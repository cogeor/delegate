import { IPC } from './ipc.js';
import { FileWatcher } from './file-watcher.js';
import { loadConfig, ensureDreamstateDir } from '../shared/config.js';
import type { DaemonStatus, Task, TaskResult, PingResult } from '../shared/types.js';

class Daemon {
  private ipc: IPC;
  private fileWatcher: FileWatcher;
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

    this.fileWatcher = new FileWatcher(workspaceRoot, config, {
      onFileChange: (task) => this.queueTask(task)
    });
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
    const status: DaemonStatus = {
      pid: process.pid,
      startedAt: this.startedAt.toISOString(),
      lastActivity: new Date().toISOString(),
      uptime: Date.now() - this.startedAt.getTime(),
      watching: this.fileWatcher.getWatchedPaths(),
      tasksProcessed: this.tasksProcessed
    };
    this.ipc.writeStatus(status);
  }

  private pollTasks(): void {
    const tasks = this.ipc.getPendingTasks();
    for (const task of tasks) {
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
    this.ipc.clearPid();

    console.log('[Daemon] Stopped');
  }
}

// Entry point
const workspaceRoot = process.cwd();
const daemon = new Daemon(workspaceRoot);
daemon.start();
