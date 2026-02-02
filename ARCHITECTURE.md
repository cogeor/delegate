# Architecture

Dreamstate uses a daemon + plugin architecture for spec-driven development. The daemon runs in the background and communicates with the Claude Code plugin via file-based IPC.

## System Overview

```
                    dreamstate-daemon
  +-------------------------------------------------------------+
  |                                                             |
  |  +--------------+  +---------------+  +-------------------+  |
  |  | File Watcher |  | Audit Detector|  |   Claude CLI      |  |
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
| **Audit Detector** | Tracks Claude Code activity, triggers audit mode | `src/daemon/audit-detector.ts` |
| **Token Budget** | Manages hourly token spending limits | `src/daemon/token-budget.ts` |
| **Claude CLI Interface** | Spawns `claude` processes with prompts | `src/daemon/claude-cli.ts` |

## Plugin Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Commands** | Slash commands (`/ds:*`) for user interaction | `src/plugin/commands/ds/` |
| **Agents** | Specialized agents for planning, execution, testing | `src/plugin/agents/` |
| **Hooks** | Session lifecycle hooks (SessionStart, UserPromptSubmit, SessionEnd) | `bin/*.ts` |

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
|   +-- audit-detector.ts  # Detect idle state, trigger audit
|   +-- token-budget.ts    # Hourly token spending limits
|   +-- claude-cli.ts      # Spawn claude processes
|   +-- ipc.ts             # File-based IPC
|   +-- providers/         # LLM provider implementations
+-- plugin/
|   +-- commands/ds/       # Slash commands
|   +-- agents/            # Agent definitions
+-- shared/
    +-- config.ts          # Shared configuration
    +-- types.ts           # Shared type definitions

bin/
+-- daemon-hook.ts         # SessionStart hook (auto-starts daemon)
+-- prompt-hook.ts         # UserPromptSubmit hook (daemon requests)
+-- session-end-hook.ts    # SessionEnd hook (cleanup on exit)
+-- validate-docs.ts       # Pre-commit doc validation
+-- install.ts             # Plugin installer
```

## Agents

| Agent | Role |
|-------|------|
| `ds-coordinator` | Orchestrates loops, manages task flow |
| `ds-planner` | Creates implementation plans from drafts |
| `ds-executor` | Implements specific tasks from plans |
| `ds-tester` | Verifies implementation, runs tests |
| `ds-audit-planner` | Explores and plans during audit mode |
| `ds-doc-generator` | Generates documentation during audit mode |

## Configuration

`.dreamstate/config.json`:

```json
{
  "daemon": {
    "provider": "claude",
    "audit_timeout_minutes": 5,
    "token_budget_per_hour": 10000,
    "model": "haiku",
    "auto_audit": {
      "enabled": false,
      "model": "haiku",
      "max_iterations": 10,
      "prompt": null
    }
  },
  "watch": {
    "patterns": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    "ignore": ["node_modules", "dist", ".git", ".dreamstate"]
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
