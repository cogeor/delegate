import { existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  getDreamstateDir,
  ensureDreamstateDir,
  STATUS_FILE,
  PID_FILE,
  TASKS_DIR,
  RESULTS_DIR
} from '../shared/config.js';
import type { DaemonStatus, Task, TaskResult } from '../shared/types.js';

export class IPC {
  private workspaceRoot: string;
  private dir: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.dir = ensureDreamstateDir(workspaceRoot);
  }

  // Status management
  writeStatus(status: DaemonStatus): void {
    writeFileSync(
      join(this.dir, STATUS_FILE),
      JSON.stringify(status, null, 2)
    );
  }

  readStatus(): DaemonStatus | null {
    const path = join(this.dir, STATUS_FILE);
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as DaemonStatus;
    } catch {
      return null;
    }
  }

  // PID management
  writePid(pid: number): void {
    writeFileSync(join(this.dir, PID_FILE), String(pid));
  }

  readPid(): number | null {
    const path = join(this.dir, PID_FILE);
    if (!existsSync(path)) return null;
    try {
      return parseInt(readFileSync(path, 'utf-8').trim(), 10);
    } catch {
      return null;
    }
  }

  clearPid(): void {
    const path = join(this.dir, PID_FILE);
    if (existsSync(path)) unlinkSync(path);
  }

  // Task queue
  getPendingTasks(): Task[] {
    const tasksDir = join(this.dir, TASKS_DIR);
    if (!existsSync(tasksDir)) return [];

    const files = readdirSync(tasksDir).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const content = readFileSync(join(tasksDir, f), 'utf-8');
      return JSON.parse(content) as Task;
    }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  consumeTask(taskId: string): void {
    const path = join(this.dir, TASKS_DIR, `${taskId}.json`);
    if (existsSync(path)) unlinkSync(path);
  }

  // Used by plugin to submit tasks
  submitTask(task: Task): void {
    const tasksDir = join(this.dir, TASKS_DIR);
    const path = join(tasksDir, `${task.id}.json`);
    writeFileSync(path, JSON.stringify(task, null, 2));
  }

  // Results
  writeResult(result: TaskResult): void {
    const path = join(this.dir, RESULTS_DIR, `${result.taskId}.json`);
    writeFileSync(path, JSON.stringify(result, null, 2));
  }

  readResult(taskId: string): TaskResult | null {
    const path = join(this.dir, RESULTS_DIR, `${taskId}.json`);
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as TaskResult;
    } catch {
      return null;
    }
  }

  clearResult(taskId: string): void {
    const path = join(this.dir, RESULTS_DIR, `${taskId}.json`);
    if (existsSync(path)) unlinkSync(path);
  }
}
