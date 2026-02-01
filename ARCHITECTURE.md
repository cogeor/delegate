# Architecture

Dreamstate uses a daemon + plugin architecture for spec-driven development. The daemon runs in the background and communicates with the Claude Code plugin via file-based IPC.

## System Overview

```
                    dreamstate-daemon
  +-------------------------------------------------------------+
  |                                                             |
  |  +--------------+  +--------------+  +-------------------+  |
  |  | File Watcher |  | Idle Detector|  |   Claude CLI      |  |
  |  | (chokidar)   |  | (activity)   |  |   Interface       |  |
  |  +------+-------+  +------+-------+  +---------+---------+  |
  |         |                 |                    |            |
  |         +--------+--------+--------------------+            |
  |                  |                                          |
  |           +------v------+                                   |
  |           | Task Queue  |                                   |
  |           | (token      |                                   |
  |           |  budgeted)  |                                   |
  |           +-------------+                                   |
  +-------------------------------------------------------------+
           |                              ^
           | spawns claude CLI            | IPC (file-based)
           v                              |
  +-----------------+              +------+------+
  |  Claude Code    |<------------>|   Plugin    |
  |  (user session) |   commands   |  (commands/ |
  |                 |              |   agents/)  |
  +-----------------+              +-------------+
```

## Daemon Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **File Watcher** | Monitors workspace for file saves, triggers LLM tasks | `src/daemon/file-watcher.ts` |
| **Idle Detector** | Tracks Claude Code activity, triggers reflection | `src/daemon/idle-detector.ts` |
| **Task Queue** | Manages task execution with token budgeting | `src/daemon/task-queue.ts` |
| **Claude CLI Interface** | Spawns `claude` processes with prompts | `src/daemon/claude-cli.ts` |

## Plugin Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Commands** | Slash commands (`/ds:*`) for user interaction | `src/plugin/commands/ds/` |
| **Agents** | Specialized agents for planning, execution, testing | `src/plugin/agents/` |
| **Hooks** | Session lifecycle hooks | `src/plugin/hooks/` |

## IPC Protocol

Daemon and plugin communicate via files in `.dreamstate/`:

| File/Directory | Purpose |
|----------------|---------|
| `daemon.pid` | Daemon process ID |
| `daemon.status` | JSON with daemon state, last activity |
| `tasks/` | Pending tasks (written by plugin, consumed by daemon) |
| `results/` | Task results (written by daemon, read by plugin) |

## File Structure

```
src/
+-- daemon/
|   +-- index.ts           # Daemon entry point
|   +-- file-watcher.ts    # Watch for file saves
|   +-- idle-detector.ts   # Detect idle state
|   +-- task-queue.ts      # Queue with token budget
|   +-- claude-cli.ts      # Spawn claude processes
|   +-- ipc.ts             # File-based IPC
+-- plugin/
|   +-- commands/ds/       # Slash commands
|   +-- agents/            # Agent definitions
|   +-- hooks/             # Lifecycle hooks
+-- shared/
    +-- config.ts          # Shared configuration
    +-- types.ts           # Shared type definitions
```

## Agents

| Agent | Role |
|-------|------|
| `ds-coordinator` | Orchestrates loops, manages task flow |
| `ds-planner` | Creates implementation plans from drafts |
| `ds-executor` | Implements specific tasks from plans |
| `ds-tester` | Verifies implementation, runs tests |
| `ds-idle-planner` | Refines loop plans during idle mode |

## Configuration

`.dreamstate/config.json`:

```json
{
  "daemon": {
    "idle_timeout_minutes": 5,
    "token_budget_per_hour": 10000,
    "model": "haiku"
  },
  "watch": {
    "patterns": ["**/*.ts", "**/*.tsx"],
    "ignore": ["node_modules", "dist"]
  }
}
```

## Design Principles

- **Daemon-first** - Background process enables true idle detection and file watching
- **File-based IPC** - Simple, debuggable, works across processes
- **Token budgeting** - Prevents runaway costs during idle reflection
- **Single command interface** - Reduce complexity (vs multi-command systems)
- **Timestamp everything** - All loops and plans are timestamped for traceability
