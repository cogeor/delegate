# Dreamstate Implementation Plan

## Phase 1: Daemon Foundation + Ping Test

### Goal
Daemon runs as background process, watches files, responds to ping command from Claude Code plugin.

### Prerequisites
- Node.js 18+
- Claude Code installed
- TypeScript knowledge

---

### Step 1: Project Setup

```bash
cd dreamstate
npm init -y
npm install typescript chokidar tsx @types/node --save-dev
npx tsc --init
```

**Files to create:**

`package.json`:
```json
{
  "name": "dreamstate",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "daemon": "tsx src/daemon/index.ts",
    "daemon:start": "tsx src/daemon/index.ts &",
    "install:claude": "tsx bin/install.ts",
    "test": "tsx src/test/ping.test.ts"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "chokidar": "^3.6.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*", "bin/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### Step 2: Shared Types and Config

`src/shared/types.ts`:
```typescript
export interface DaemonStatus {
  pid: number;
  startedAt: string;
  lastActivity: string;
  uptime: number;
  watching: string[];
  tasksProcessed: number;
}

export interface Task {
  id: string;
  type: 'ping' | 'file-change' | 'reflect';
  payload: unknown;
  createdAt: string;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  completedAt: string;
}

export interface Config {
  daemon: {
    idle_timeout_minutes: number;
    token_budget_per_hour: number;
    model: string;
  };
  watch: {
    patterns: string[];
    ignore: string[];
  };
}
```

`src/shared/config.ts`:
```typescript
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Config } from './types.js';

export const DREAMSTATE_DIR = '.dreamstate';
export const STATUS_FILE = 'daemon.status';
export const PID_FILE = 'daemon.pid';
export const TASKS_DIR = 'tasks';
export const RESULTS_DIR = 'results';
export const CONFIG_FILE = 'config.json';

export function getDreamstateDir(workspaceRoot: string): string {
  return join(workspaceRoot, DREAMSTATE_DIR);
}

export function ensureDreamstateDir(workspaceRoot: string): string {
  const dir = getDreamstateDir(workspaceRoot);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const tasksDir = join(dir, TASKS_DIR);
  if (!existsSync(tasksDir)) {
    mkdirSync(tasksDir, { recursive: true });
  }
  const resultsDir = join(dir, RESULTS_DIR);
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }
  return dir;
}

export function loadConfig(workspaceRoot: string): Config {
  const configPath = join(getDreamstateDir(workspaceRoot), CONFIG_FILE);
  const defaults: Config = {
    daemon: {
      idle_timeout_minutes: 5,
      token_budget_per_hour: 10000,
      model: 'haiku'
    },
    watch: {
      patterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      ignore: ['node_modules', 'dist', '.git', '.dreamstate']
    }
  };

  if (existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      return { ...defaults, ...userConfig };
    } catch {
      return defaults;
    }
  }
  return defaults;
}
```

---

### Step 3: IPC Module

`src/daemon/ipc.ts`:
```typescript
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
      return JSON.parse(readFileSync(path, 'utf-8'));
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
    const path = join(this.dir, TASKS_DIR, `${task.id}.json`);
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
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return null;
    }
  }

  clearResult(taskId: string): void {
    const path = join(this.dir, RESULTS_DIR, `${taskId}.json`);
    if (existsSync(path)) unlinkSync(path);
  }
}
```

---

### Step 4: File Watcher

`src/daemon/file-watcher.ts`:
```typescript
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
      ignored: this.config.watch.ignore.map(p => `**/${p}/**`),
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    this.watcher.on('change', (filePath) => {
      const task: Task = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'file-change',
        payload: { filePath },
        createdAt: new Date().toISOString()
      };
      this.events.onFileChange(task);
    });

    console.log(`[FileWatcher] Watching: ${patterns.join(', ')}`);
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  getWatchedPaths(): string[] {
    return this.config.watch.patterns;
  }
}
```

---

### Step 5: Main Daemon

`src/daemon/index.ts`:
```typescript
import { IPC } from './ipc.js';
import { FileWatcher } from './file-watcher.js';
import { loadConfig, ensureDreamstateDir } from '../shared/config.js';
import type { DaemonStatus, Task, TaskResult } from '../shared/types.js';

class Daemon {
  private ipc: IPC;
  private fileWatcher: FileWatcher;
  private workspaceRoot: string;
  private startedAt: Date;
  private tasksProcessed = 0;
  private running = false;

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
    // For now, just log. Phase 2 will process these.
  }

  private processTask(task: Task): TaskResult {
    console.log(`[Daemon] Processing: ${task.type} (${task.id})`);

    if (task.type === 'ping') {
      return {
        taskId: task.id,
        success: true,
        result: {
          pong: true,
          uptime: Date.now() - this.startedAt.getTime(),
          message: 'Daemon is alive!'
        },
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
    const pollInterval = setInterval(() => {
      if (!this.running) {
        clearInterval(pollInterval);
        return;
      }
      this.pollTasks();
    }, 500);

    // Update status every 5s
    const statusInterval = setInterval(() => {
      if (!this.running) {
        clearInterval(statusInterval);
        return;
      }
      this.updateStatus();
    }, 5000);

    console.log(`[Daemon] Started (PID: ${process.pid})`);
    console.log(`[Daemon] Workspace: ${this.workspaceRoot}`);

    // Handle shutdown
    const shutdown = () => {
      console.log('\n[Daemon] Shutting down...');
      this.running = false;
      this.fileWatcher.stop();
      this.ipc.clearPid();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

// Entry point
const workspaceRoot = process.cwd();
const daemon = new Daemon(workspaceRoot);
daemon.start();
```

---

### Step 6: Plugin Commands

`src/plugin/commands/ds/ping.md`:
```markdown
---
description: Test connection to dreamstate daemon
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Test that the dreamstate daemon is running and responsive.
</objective>

<instructions>
1. Generate a unique task ID
2. Write a ping task to `.dreamstate/tasks/`
3. Wait for result in `.dreamstate/results/`
4. Report daemon status

Use this exact flow:
</instructions>

<task>
1. Create task file `.dreamstate/tasks/{id}.json`:
   ```json
   {
     "id": "{unique-id}",
     "type": "ping",
     "payload": {},
     "createdAt": "{ISO timestamp}"
   }
   ```

2. Poll `.dreamstate/results/{id}.json` for up to 5 seconds

3. If result found:
   - Read and parse the result
   - Delete the result file
   - Report: "Daemon responded! Uptime: {uptime}ms"

4. If no result after 5 seconds:
   - Check if `.dreamstate/daemon.pid` exists
   - If exists, daemon may be stuck
   - If not, daemon is not running
   - Report: "Daemon not responding. Start with: npm run daemon"
</task>
```

`src/plugin/commands/ds/status.md`:
```markdown
---
description: Show dreamstate daemon status
allowed-tools:
  - Read
---

<objective>
Display the current status of the dreamstate daemon.
</objective>

<instructions>
1. Read `.dreamstate/daemon.status`
2. If file doesn't exist, daemon is not running
3. Display:
   - PID
   - Uptime (human readable)
   - Files being watched
   - Tasks processed count
   - Last activity timestamp
</instructions>
```

---

### Step 7: Installer

`bin/install.ts`:
```typescript
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const CLAUDE_DIR = join(homedir(), '.claude');
const COMMANDS_DIR = join(CLAUDE_DIR, 'commands', 'ds');

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function copyCommands(): void {
  const srcDir = join(projectRoot, 'src', 'plugin', 'commands', 'ds');
  ensureDir(COMMANDS_DIR);

  const commands = ['ping.md', 'status.md'];
  for (const cmd of commands) {
    const src = join(srcDir, cmd);
    const dest = join(COMMANDS_DIR, cmd);
    if (existsSync(src)) {
      copyFileSync(src, dest);
      console.log(`  Installed: /ds:${cmd.replace('.md', '')}`);
    }
  }
}

function main(): void {
  console.log('\nInstalling dreamstate plugin...\n');

  ensureDir(CLAUDE_DIR);
  copyCommands();

  console.log('\nDone! Commands available:');
  console.log('  /ds:ping   - Test daemon connection');
  console.log('  /ds:status - Show daemon status');
  console.log('\nStart the daemon with:');
  console.log('  npm run daemon\n');
}

main();
```

---

### Step 8: Verification Recipe

**1. Install dependencies:**
```bash
cd dreamstate
npm install
```

**2. Install plugin to Claude Code:**
```bash
npm run install:claude
```

**3. Start the daemon (in a separate terminal):**
```bash
npm run daemon
```
Expected output:
```
[Daemon] Started (PID: 12345)
[Daemon] Workspace: /path/to/dreamstate
[FileWatcher] Watching: ...
```

**4. Open Claude Code in the same directory:**
```bash
claude
```

**5. Run ping test:**
```
/ds:ping
```

Expected result:
```
Daemon responded! Uptime: 1234ms
```

**6. Check status:**
```
/ds:status
```

Expected result:
```
Dreamstate Daemon Status
------------------------
PID: 12345
Uptime: 2 minutes, 34 seconds
Watching: **/*.ts, **/*.tsx, **/*.js, **/*.jsx
Tasks processed: 1
Last activity: 2024-01-15T10:30:00.000Z
```

---

### Troubleshooting

**Daemon not responding:**
1. Check if daemon is running: `cat .dreamstate/daemon.pid`
2. Check daemon logs in terminal
3. Ensure you're in the right directory

**Commands not found:**
1. Restart Claude Code after installing
2. Verify files exist: `ls ~/.claude/commands/ds/`

**File changes not detected:**
1. Check ignored patterns in `.dreamstate/config.json`
2. Verify file is in watched patterns

---

## Next Steps (Phase 2)

Once Phase 1 is verified:
1. Implement file-save LLM triggers
2. Add `@dreamstate` comment markers
3. Spawn `claude` CLI for processing
4. Write results back to files
