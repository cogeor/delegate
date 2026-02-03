# Architecture

Delegate uses a daemon + plugin architecture for spec-driven development. The daemon runs in the background and communicates with the Claude Code plugin via file-based IPC.

## System Overview

```
                    delegate-daemon
  +-------------------------------------------------------------+
  |                                                             |
  |  +--------------+  +---------------+  +-------------------+  |
  |  | File Watcher |  | Plan Detector |  |   Claude CLI      |  |
  |  | (chokidar)   |  | (activity)    |  |   Interface       |  |
  |  +------+-------+  +-------+-------+  +---------+---------+  |
  |         |                 |                    |            |
  |         +--------+--------+--------------------+            |
  |                  |                                          |
  |           +------v------+                                   |
  |           |Token Budget |                                   |
  |           | (hourly     |                                   |
  |           |  limits)    |                                   |
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
| **Plan Detector** | Tracks Claude Code activity, triggers plan mode | `src/daemon/plan-detector.ts` |
| **Token Budget** | Manages hourly token spending limits | `src/daemon/token-budget.ts` |
| **Claude CLI Interface** | Spawns `claude` processes with prompts | `src/daemon/claude-cli.ts` |

## Plugin Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Commands** | Slash commands (`/dg:*`) for user interaction | `commands/dg/` |
| **Agents** | Specialized agents for planning, execution, testing | `agents/` |
| **Hooks** | Session lifecycle hooks (SessionStart, UserPromptSubmit, SessionEnd) | `hooks/` |

## IPC Protocol

Daemon and plugin communicate via files in `.delegate/`:

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
|   +-- plan-detector.ts   # Detect idle state, trigger plan
|   +-- token-budget.ts    # Hourly token spending limits
|   +-- claude-cli.ts      # Spawn claude processes
|   +-- ipc.ts             # File-based IPC
|   +-- providers/         # LLM provider implementations
+-- hooks/
|   +-- session-start.ts   # SessionStart hook (auto-starts daemon)
|   +-- prompt-submit.ts   # UserPromptSubmit hook (daemon requests)
|   +-- session-end.ts     # SessionEnd hook (cleanup on exit)
+-- shared/
    +-- config.ts          # Shared configuration
    +-- types.ts           # Shared type definitions
    +-- state.ts           # State management

commands/dg/               # Slash commands
agents/                    # Agent definitions
hooks/                     # Hook configuration
bin/
+-- validate-docs.ts       # Pre-commit doc validation
```

## Agents

| Agent | Role |
|-------|------|
| `dg-planner` | Creates implementation plans from drafts |
| `dg-executor` | Implements specific tasks from plans |
| `dg-tester` | Verifies implementation, runs tests |
| `dg-study-planner` | Explores and plans during plan mode |
| `dg-doc-generator` | Generates documentation during plan mode |

**Note:** Loop coordination (spawning planner -> executor -> tester) is done by `/dg:do` command directly.

## Configuration

`.delegate/config.json`:

```json
{
  "daemon": {
    "provider": "claude",
    "plan_timeout_minutes": 5,
    "token_budget_per_hour": 10000,
    "model": "haiku",
    "auto_plan": {
      "enabled": false,
      "model": "haiku",
      "max_iterations": 10,
      "prompt": null
    }
  },
  "watch": {
    "patterns": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    "ignore": ["node_modules", "dist", ".git", ".delegate"]
  },
  "docs": {
    "enabled": true,
    "patterns": ["src/**/*.ts", "src/**/*.tsx"],
    "ignore": ["**/*.test.ts", "**/*.spec.ts", "**/types.ts"]
  }
}
```

## Design Principles

- **Daemon-first** - Background process enables true idle detection and file watching
- **File-based IPC** - Simple, debuggable, works across processes
- **Token budgeting** - Prevents runaway costs during idle reflection
- **Single command interface** - Reduce complexity (vs multi-command systems)
- **Timestamp everything** - All loops and plans are timestamped for traceability
