import { IPC } from './ipc.js';
import { FileWatcher } from './file-watcher.js';
import { TokenBudgetTracker } from './token-budget.js';
import { IdleDetector } from './idle-detector.js';
import { loadConfig, ensureDreamstateDir } from '../shared/config.js';
import type { DaemonStatus, Task, TaskResult, PingResult, FileTask } from '../shared/types.js';
import { runClaude } from './claude-cli.js';

class Daemon {
  private ipc: IPC;
  private fileWatcher: FileWatcher;
  private tokenBudget: TokenBudgetTracker;
  private idleDetector: IdleDetector;
  private workspaceRoot: string;
  private startedAt: Date;
  private tasksProcessed = 0;
  private running = false;
  private pollIntervalId: NodeJS.Timeout | null = null;
  private statusIntervalId: NodeJS.Timeout | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.startedAt = new Date();

    ensureDreamstateDir(workspaceRoot);

    this.ipc = new IPC(workspaceRoot);
    const config = loadConfig(workspaceRoot);

    this.tokenBudget = new TokenBudgetTracker(workspaceRoot, config.daemon.token_budget_per_hour);

    this.idleDetector = new IdleDetector(workspaceRoot, {
      idleTimeoutMinutes: config.daemon.idle_timeout_minutes,
      model: config.daemon.model,
      onIdleStart: () => this.handleIdleStart(),
      onIdleEnd: () => this.handleIdleEnd(),
    });

    this.fileWatcher = new FileWatcher(workspaceRoot, config, {
      onFileChange: (task) => this.queueTask(task),
      onFileDirective: (task) => this.processFileDirective(task)
    });
  }

  private async processFileDirective(task: FileTask): Promise<void> {
    console.log(`[Daemon] Processing directive: ${task.instruction}`);

    // Check token budget
    const estimatedTokens = this.tokenBudget.estimateTokens('haiku', 'medium');
    if (!this.tokenBudget.canSpend(estimatedTokens)) {
      console.log('[Daemon] Token budget exceeded, skipping directive');
      return;
    }

    // Record activity
    this.idleDetector.recordActivity();

    // Build prompt with file context
    const prompt = `File: ${task.filePath}
Line ${task.lineNumber}: ${task.directive}

Instruction: ${task.instruction}

Please complete this task. Be concise and focused on the specific instruction.`;

    try {
      const result = await runClaude(prompt, {
        model: 'haiku',
        workingDir: this.workspaceRoot,
      });

      if (result.success) {
        console.log(`[Daemon] Directive completed: ${task.instruction.slice(0, 50)}...`);
        // Record token usage
        this.tokenBudget.recordUsage(
          `directive: ${task.instruction.slice(0, 30)}`,
          result.tokensUsed || estimatedTokens,
          'haiku'
        );
      } else {
        console.error(`[Daemon] Directive failed: ${result.error}`);
      }
    } catch (err) {
      console.error(`[Daemon] Error processing directive:`, err);
    }
  }

  private handleIdleStart(): void {
    // Check token budget before auto-starting idle tasks
    if (this.tokenBudget.isOverBudget()) {
      console.log('[Daemon] Idle detected but token budget exceeded, skipping auto-idle');
      return;
    }
    console.log('[Daemon] Auto-idle triggered - would start idle planning tasks');
    // Note: Full auto-idle implementation would spawn claude here
    // For now, just log - user can manually trigger /ds:idle
  }

  private handleIdleEnd(): void {
    console.log('[Daemon] Activity resumed, idle tasks paused');
  }

  private queueTask(task: Task): void {
    console.log(`[Daemon] Task queued: ${task.type} (${task.id})`);
    // For now, just log file changes. Phase 2 will process these with LLM.
    // We don't want to auto-queue file changes to the task system yet
    // since that would require the LLM integration.
  }

  private processTask(task: Task): TaskResult {
    console.log(`[Daemon] Processing: ${task.type} (${task.id})`);

    if (task.type === 'ping') {
      const result: PingResult = {
        pong: true,
        uptime: Date.now() - this.startedAt.getTime(),
        message: 'Daemon is alive!'
      };
      return {
        taskId: task.id,
        success: true,
        result,
        completedAt: new Date().toISOString()
      };
    }

    // Other task types will be handled in later phases
    return {
      taskId: task.id,
      success: false,
      error: `Unknown task type: ${task.type}`,
      completedAt: new Date().toISOString()
    };
  }

  private updateStatus(): void {
    const budgetStatus = this.tokenBudget.getStatus();
    const status: DaemonStatus = {
      pid: process.pid,
      startedAt: this.startedAt.toISOString(),
      lastActivity: new Date().toISOString(),
      uptime: Date.now() - this.startedAt.getTime(),
      watching: this.fileWatcher.getWatchedPaths(),
      tasksProcessed: this.tasksProcessed,
      tokenBudget: {
        used: budgetStatus.used,
        limit: budgetStatus.limit,
        remaining: budgetStatus.remaining,
        isPaused: budgetStatus.isPaused,
      }
    };
    this.ipc.writeStatus(status);
  }

  private pollTasks(): void {
    const tasks = this.ipc.getPendingTasks();
    for (const task of tasks) {
      // Record activity when processing tasks
      this.idleDetector.recordActivity();

      const result = this.processTask(task);
      this.ipc.writeResult(result);
      this.ipc.consumeTask(task.id);
      this.tasksProcessed++;
      this.updateStatus();
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    // Write PID
    this.ipc.writePid(process.pid);

    // Start file watcher
    this.fileWatcher.start();

    // Start idle detector
    this.idleDetector.start();

    // Initial status
    this.updateStatus();

    // Poll for tasks every 500ms
    this.pollIntervalId = setInterval(() => {
      if (!this.running) return;
      this.pollTasks();
    }, 500);

    // Update status every 5s
    this.statusIntervalId = setInterval(() => {
      if (!this.running) return;
      this.updateStatus();
    }, 5000);

    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║         DREAMSTATE DAEMON                ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log(`[Daemon] Started (PID: ${process.pid})`);
    console.log(`[Daemon] Workspace: ${this.workspaceRoot}`);
    console.log(`[Daemon] IPC directory: ${this.workspaceRoot}/.dreamstate`);
    console.log('');
    console.log('[Daemon] Ready. Waiting for tasks...');
    console.log('[Daemon] Test with: /ds:ping in Claude Code');
    console.log('');

    // Handle shutdown
    const shutdown = () => {
      console.log('\n[Daemon] Shutting down...');
      this.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  stop(): void {
    this.running = false;

    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }

    if (this.statusIntervalId) {
      clearInterval(this.statusIntervalId);
      this.statusIntervalId = null;
    }

    this.fileWatcher.stop();
    this.idleDetector.stop();
    this.ipc.clearPid();

    console.log('[Daemon] Stopped');
  }
}

// Entry point
// DREAMSTATE_WORKSPACE is set by the SessionStart hook
// Falls back to cwd for manual invocation
const workspaceRoot = process.env.DREAMSTATE_WORKSPACE || process.cwd();
const daemon = new Daemon(workspaceRoot);
daemon.start();
