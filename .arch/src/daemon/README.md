# Module: src/daemon

## Overview

Background daemon that watches files, detects idle state, manages token budgets, and processes tasks via file-based IPC with the Claude Code plugin.

## Public API

- `Daemon` - Main daemon class with start/stop lifecycle
- `IPC` - File-based inter-process communication
- `FileWatcher` - Watches files for changes and @dreamstate directives
- `IdleDetector` - Tracks activity and triggers idle callbacks
- `TokenBudgetTracker` - Manages hourly token spending limits
- `runClaude` - Spawns claude CLI with prompts
- `runClaudeAgent` - Runs claude with a specific agent name

## Architecture

```
                      +-----------------+
                      |     Daemon      |
                      | (orchestrator)  |
                      +-------+---------+
                              |
          +-------------------+-------------------+
          |           |           |               |
    +-----+----+ +----+----+ +----+-----+ +------+------+
    |FileWatcher| |IdleDetector| |TokenBudget| |    IPC     |
    |(chokidar) | |(activity)  | |(limits)   | |(file-based)|
    +-----+-----+ +-----+------+ +-----+-----+ +------+-----+
          |             |              |              |
          v             v              v              v
    [file changes] [idle events] [budget checks] [.dreamstate/]
          |             |              |              |
          +-------------+------+-------+--------------+
                               |
                        +------+------+
                        | runClaude() |
                        | (CLI spawn) |
                        +-------------+
```

## Key Files

| File | Purpose |
|------|---------|
| index.ts | Daemon entry point, orchestrates all components |
| ipc.ts | File-based IPC: status, tasks, results |
| file-watcher.ts | Watches files, scans for @dreamstate directives |
| idle-detector.ts | Tracks activity, triggers idle callbacks |
| token-budget.ts | Hourly token budget tracking and enforcement |
| claude-cli.ts | Spawns claude CLI processes |

## Dependencies

**Inputs:**
- `chokidar` - File watching
- `../shared/config` - Configuration loading
- `../shared/types` - Type definitions

**Outputs:**
- `.dreamstate/daemon.status` - Current daemon state
- `.dreamstate/daemon.pid` - Process ID file
- `.dreamstate/results/*.json` - Task results
- Console logs for debugging

## Call Graph

```
Daemon.start()
  +-> IPC.writePid()
  +-> FileWatcher.start()
  |     +-> chokidar.watch()
  |     +-> scanForDirectives() -> onFileDirective callback
  |     +-> onFileChange callback
  +-> IdleDetector.start()
  |     +-> setInterval(checkIdle)
  |     +-> onIdleStart/onIdleEnd callbacks
  +-> updateStatus()
  |     +-> TokenBudgetTracker.getStatus()
  |     +-> IPC.writeStatus()
  +-> pollTasks()
        +-> IPC.getPendingTasks()
        +-> processTask()
        |     +-> handles 'ping' type
        +-> IPC.writeResult()
        +-> IPC.consumeTask()

Daemon.processFileDirective()
  +-> TokenBudgetTracker.canSpend()
  +-> IdleDetector.recordActivity()
  +-> runClaude()
  +-> TokenBudgetTracker.recordUsage()

Daemon.stop()
  +-> FileWatcher.stop()
  +-> IdleDetector.stop()
  +-> IPC.clearPid()
```
