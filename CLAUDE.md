# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dreamstate is a Claude Code plugin with a background daemon for spec-driven development. Inspired by get-shit-done but with a simplified workflow and reactive file-watching capabilities.

**Core philosophy:** Humans write plan drafts, agents write self-cleaning code.

## Commands

```bash
# Install dependencies
npm install

# Build the daemon and plugin
npm run build

# Start the daemon (development)
npm run daemon

# Install plugin to Claude Code
npm run install:claude
```

## Plugin Commands

| Command | Description |
|---------|-------------|
| `/ds:ping` | Test daemon connectivity |
| `/ds:status` | Show daemon and idle status |
| `/ds:idle [model]` | Enter idle mode (haiku/sonnet/opus) |
| `/ds:wake` | Stop idle mode, return control |
| `/ds:loop [path]` | Start plan/implement/test loop |

## Agents

| Agent | Role |
|-------|------|
| `ds-coordinator` | Orchestrates loops |
| `ds-planner` | Creates implementation plans |
| `ds-executor` | Implements tasks |
| `ds-tester` | Verifies implementation |
| `ds-idle-planner` | Iteratively refines loop plans during idle |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    dreamstate-daemon                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ File Watcher│  │Idle Detector│  │   Claude CLI        │  │
│  │ (chokidar)  │  │ (activity)  │  │   Interface         │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┴─────────────────────┘             │
│                          │                                   │
│                   ┌──────▼──────┐                           │
│                   │ Task Queue  │                           │
│                   │ (token      │                           │
│                   │  budgeted)  │                           │
│                   └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
         │                              ▲
         │ spawns claude CLI            │ IPC (file-based)
         ▼                              │
┌─────────────────┐              ┌──────┴──────┐
│  Claude Code    │◀────────────▶│   Plugin    │
│  (user session) │   commands   │  (commands/ │
│                 │              │   agents/)  │
└─────────────────┘              └─────────────┘
```

### Daemon Components

1. **File Watcher** - Monitors workspace for file saves, triggers LLM tasks
2. **Idle Detector** - Tracks Claude Code activity, triggers reflection when idle
3. **Task Queue** - Executes tasks with token budgeting (max tokens/hour)
4. **Claude CLI Interface** - Spawns `claude` processes with prompts

### Plugin Components

1. **Commands** - Slash commands (`/ds:*`) for user interaction
2. **Agents** - Specialized agents for planning, execution, reflection
3. **Hooks** - Session lifecycle hooks

### IPC Protocol

Daemon and plugin communicate via files in `.dreamstate/`:
- `daemon.pid` - Daemon process ID
- `daemon.status` - JSON with daemon state, last activity
- `tasks/` - Pending tasks written by plugin, consumed by daemon
- `results/` - Task results written by daemon, read by plugin

## File Structure

```
dreamstate/
├── src/
│   ├── daemon/
│   │   ├── index.ts           # Daemon entry point
│   │   ├── file-watcher.ts    # Watch for file saves
│   │   ├── idle-detector.ts   # Detect idle state
│   │   ├── task-queue.ts      # Queue with token budget
│   │   ├── claude-cli.ts      # Spawn claude processes
│   │   └── ipc.ts             # File-based IPC
│   ├── plugin/
│   │   ├── commands/
│   │   │   └── ds/
│   │   │       ├── ping.md    # Test daemon connectivity
│   │   │       ├── status.md  # Show daemon status
│   │   │       └── plan.md    # Start planning from draft
│   │   ├── agents/
│   │   │   ├── ds-coordinator.md
│   │   │   ├── ds-planner.md
│   │   │   ├── ds-executor.md
│   │   │   └── ds-reflector.md
│   │   └── hooks/
│   │       └── session-start.ts
│   └── shared/
│       ├── config.ts          # Shared configuration
│       └── types.ts           # Shared type definitions
├── bin/
│   ├── daemon.ts              # CLI for daemon
│   └── install.ts             # Plugin installer
├── dist/                      # Compiled output
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Implementation Plan

### Phase 1: Daemon Foundation + Ping Test

**Goal:** Daemon runs, watches files, responds to ping command.

1. Set up TypeScript project structure
2. Implement daemon with file watcher (chokidar)
3. Implement IPC protocol (file-based)
4. Create `/ds:ping` command that writes to IPC, daemon responds
5. Create installer that:
   - Compiles TypeScript
   - Copies plugin files to `~/.claude/`
   - Registers daemon as background service

**Verification:** Run `/ds:ping`, get "pong" response with daemon uptime.

### Phase 2: File-Save LLM Triggers

**Goal:** Save a file, daemon runs LLM on it.

1. File watcher detects saves in workspace
2. Check for `@dreamstate` markers in file (or `.dreamstate/watch.json` config)
3. Queue task with file content
4. Spawn `claude` CLI with appropriate prompt
5. Write result back (to file or IPC)

**Verification:** Add `// @dreamstate: explain this function` comment, save, see explanation appear.

### Phase 3: Idle Detection + Reflection

**Goal:** When user is idle, daemon runs reflection tasks.

1. Track Claude Code activity (process list or heartbeat file)
2. After N minutes idle, trigger reflection
3. Reflection agent updates docs, proposes next steps
4. Respect token budget (configurable tokens/hour)

### Phase 4: Three-Phase Loop

**Goal:** Coordinator receives plan draft, spawns plan/implement/test loops.

1. `/ds:plan` command reads `plan_draft.md`
2. Coordinator agent breaks into tasks
3. Each task runs through plan → implement → test
4. Commits after each successful loop

## Reference Implementation

The `get-shit-done/` directory contains patterns to learn from:
- `commands/gsd/` - Slash command definitions
- `agents/` - Agent definitions
- `hooks/` - Hook scripts
- `bin/install.js` - Multi-runtime installer

## Claude Code Plugin Patterns

**Commands** (`commands/{namespace}/*.md`):
```yaml
---
description: What this command does
allowed-tools:
  - Read
  - Write
  - Task
---
Command prompt content here
```

**Agents** (`agents/*.md`):
```yaml
---
name: agent-name
color: cyan
allowed-tools:
  - Read
  - Grep
  - Task
---
Agent system prompt here
```

**Hooks** (configured in `settings.json`):
```json
{
  "hooks": {
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "node path/to/hook.js" }] }]
  }
}
```

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

## Design Decisions

- **Daemon-first** - Background process enables true idle detection and file watching
- **File-based IPC** - Simple, debuggable, works across processes
- **Token budgeting** - Prevents runaway costs during idle reflection
- **Single command interface** - Reduce complexity vs GSD's many commands
- **Timestamp everything** - All loops and plans are timestamped for traceability
