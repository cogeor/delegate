import chokidar from 'chokidar';
import { join } from 'path';
import type { Config, Task } from '../shared/types.js';

export interface FileWatcherEvents {
  onFileChange: (task: Task) => void;
}

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private workspaceRoot: string;
  private config: Config;
  private events: FileWatcherEvents;

  constructor(workspaceRoot: string, config: Config, events: FileWatcherEvents) {
    this.workspaceRoot = workspaceRoot;
    this.config = config;
    this.events = events;
  }

  start(): void {
    const patterns = this.config.watch.patterns.map(p =>
      join(this.workspaceRoot, p)
    );

    this.watcher = chokidar.watch(patterns, {
      ignored: [
        ...this.config.watch.ignore.map(p => `**/${p}/**`),
        /(^|[\/\\])\../  // Ignore dotfiles
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    this.watcher.on('change', (filePath: string) => {
      const task: Task = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'file-change',
        payload: { filePath },
        createdAt: new Date().toISOString()
      };
      this.events.onFileChange(task);
    });

    this.watcher.on('error', (error: Error) => {
      console.error('[FileWatcher] Error:', error.message);
    });

    console.log(`[FileWatcher] Watching patterns: ${this.config.watch.patterns.join(', ')}`);
    console.log(`[FileWatcher] Ignoring: ${this.config.watch.ignore.join(', ')}`);
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('[FileWatcher] Stopped');
    }
  }

  getWatchedPaths(): string[] {
    return this.config.watch.patterns;
  }
}
