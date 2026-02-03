import { writeFileSync } from 'fs';
import { join } from 'path';
import { IPC } from './ipc.js';
import { FileWatcher } from './file-watcher.js';
import { TokenBudgetTracker } from './token-budget.js';
import { PlanDetector } from './plan-detector.js';
import { loadConfig, ensureDelegateDir, getDelegateDir, DAEMON_REQUEST_FILE } from '../shared/config.js';
import type { DaemonStatus, Task, TaskResult, PingResult, FileTask, Config, DaemonRequest } from '../shared/types.js';
import { getProvider, type LLMProvider } from './providers/index.js';

class Daemon {
  private ipc: IPC;
  private fileWatcher: FileWatcher;
  private tokenBudget: TokenBudgetTracker;
  private planDetector: PlanDetector;
  private provider: LLMProvider | null = null;
  private workspaceRoot: string;
  private config: Config;
  private startedAt: Date;
  private tasksProcessed = 0;
  private running = false;
  private pollIntervalId: NodeJS.Timeout | null = null;
  private statusIntervalId: NodeJS.Timeout | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.startedAt = new Date();

    ensureDelegateDir(workspaceRoot);

    this.ipc = new IPC(workspaceRoot);
    this.config = loadConfig(workspaceRoot);
    const config = this.config;

    this.tokenBudget = new TokenBudgetTracker(workspaceRoot, config.daemon.token_budget_per_hour);

    this.planDetector = new PlanDetector(workspaceRoot, {
      planTimeoutMinutes: config.daemon.plan_timeout_minutes,
      model: config.daemon.model,
      onPlanStart: () => this.handlePlanStart(),
      onPlanEnd: () => this.handlePlanEnd(),
    });

    this.fileWatcher = new FileWatcher(workspaceRoot, config, {
      onFileChange: (task) => this.queueTask(task),
      onFileDirective: (task) => this.processFileDirective(task)
    });
  }

  private async processFileDirective(task: FileTask): Promise<void> {
    console.log(`[Daemon] Processing directive: ${task.instruction}`);

    if (!this.provider) {
      console.error('[Daemon] Provider not initialized');
      return;
    }

    // Check token budget
    const model = this.config.daemon.model;
    const estimatedTokens = this.provider.estimateTokens(model, 'medium');
    if (!this.tokenBudget.canSpend(estimatedTokens)) {
      console.log('[Daemon] Token budget exceeded, skipping directive');
      return;
    }

    // Record activity
    this.planDetector.recordActivity();

    // Build prompt with file context
    const prompt = `File: ${task.filePath}
Line ${task.lineNumber}: ${task.directive}

Instruction: ${task.instruction}

Please complete this task. Be concise and focused on the specific instruction.`;

    try {
      const result = await this.provider.run(prompt, {
        model,
        workingDir: this.workspaceRoot,
      });

      if (result.success) {
        console.log(`[Daemon] Directive completed: ${task.instruction.slice(0, 50)}...`);
        // Record token usage
        this.tokenBudget.recordUsage(
          `directive: ${task.instruction.slice(0, 30)}`,
          result.tokensUsed || estimatedTokens,
          model
        );
      } else {
        console.error(`[Daemon] Directive failed: ${result.error}`);
      }
    } catch (err) {
      console.error(`[Daemon] Error processing directive:`, err);
    }
  }

  private handlePlanStart(): void {
    // Check token budget before auto-starting plan tasks
    if (this.tokenBudget.isOverBudget()) {
      console.log('[Daemon] Idle detected but token budget exceeded, skipping auto-plan');
      return;
    }

    // Check if auto-plan is enabled
    const autoPlan = this.config.daemon.auto_plan;
    if (!autoPlan.enabled) {
      console.log('[Daemon] Idle detected (auto-plan disabled, use /dg:study manually)');
      return;
    }

    // Write daemon request for the prompt-submit hook to pick up
    const request: DaemonRequest = {
      id: `auto-plan-${Date.now()}`,
      action: 'start-plan',
      model: autoPlan.model,
      max_iterations: autoPlan.max_iterations,
      prompt: autoPlan.prompt,
      createdAt: new Date().toISOString()
    };

    const requestPath = join(getDelegateDir(this.workspaceRoot), DAEMON_REQUEST_FILE);
    writeFileSync(requestPath, JSON.stringify(request, null, 2));

    console.log(`[Daemon] Auto-plan triggered - wrote request (model: ${autoPlan.model}, max: ${autoPlan.max_iterations})`);
  }

  private handlePlanEnd(): void {
    console.log('[Daemon] Activity resumed, plan tasks paused');
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
      this.planDetector.recordActivity();

      const result = this.processTask(task);
      this.ipc.writeResult(result);
      this.ipc.consumeTask(task.id);
      this.tasksProcessed++;
      this.updateStatus();
    }
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Initialize provider
    const providerName = this.config.daemon.provider || 'claude';
    this.provider = await getProvider(providerName);

    // Write PID
    this.ipc.writePid(process.pid);

    // Start file watcher
    this.fileWatcher.start();

    // Start idle detector
    this.planDetector.start();

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
    console.log('║         DELEGATE DAEMON                   ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log(`[Daemon] Started (PID: ${process.pid})`);
    console.log(`[Daemon] Provider: ${this.provider.name}`);
    console.log(`[Daemon] Workspace: ${this.workspaceRoot}`);
    console.log(`[Daemon] IPC directory: ${this.workspaceRoot}/.delegate`);
    console.log('');
    console.log('[Daemon] Ready. Waiting for tasks...');
    console.log('[Daemon] Test with: /dg:status in Claude Code');
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
    this.planDetector.stop();
    this.ipc.clearPid();

    console.log('[Daemon] Stopped');
  }
}

// Entry point
// DELEGATE_WORKSPACE is set by the SessionStart hook
// Falls back to cwd for manual invocation
const workspaceRoot = process.env.DELEGATE_WORKSPACE || process.cwd();
const daemon = new Daemon(workspaceRoot);
daemon.start();
