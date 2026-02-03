# Module: Plugin

## Overview

Claude Code plugin providing slash commands and specialized agents for the delegate workflow. Commands interact with the daemon via IPC; agents handle specific phases of the plan/implement/test loop.

## Public API

**Commands (dg namespace):**
- `/dg:status` - Show daemon and plan mode status
- `/dg:study [model] [theme]` - Enter continuous study mode
- `/dg:do [args]` - Execute plan/implement/test loops
- `/dg:init` - Initialize delegate in a project

**Agents:**
- `dg-planner` - Creates implementation plans from drafts
- `dg-executor` - Implements tasks from plans
- `dg-tester` - Verifies implementation against plan
- `dg-study-planner` - Explores and plans during plan mode
- `dg-doc-generator` - Generates documentation during plan mode

## Architecture

```
                          User
                            |
                    +-------v--------+
                    |  /dg:* commands |
                    +-------+--------+
                            |
         +------------------+------------------+
         |          |           |              |
    +----v----+ +---v---+ +----v----+  +------v------+
    | status  | | plan  | |   do    |  |    init     |
    +---------+ +-------+ +----+----+  +-------------+
         |          |          |
         |          |          v
         |          |   +------+------+
         |          |   |  planner    |
         v          v   +------+------+
    [.delegate/]               |
         ^              +------+------+
         |              |  executor   |
         +------------->+------+------+
                               |
                        +------+------+
                        |   tester    |
                        +-------------+
```

## Key Files

| File | Purpose |
|------|---------|
| commands/dg/status.md | Displays daemon and plan status |
| commands/dg/study.md | Starts continuous study mode |
| commands/dg/do.md | Executes loops with dependency resolution |
| commands/dg/init.md | Initializes delegate in a project |
| agents/dg-planner.md | Transforms drafts into detailed plans |
| agents/dg-executor.md | Implements tasks from plans |
| agents/dg-tester.md | Verifies implementation, gates commits |
| agents/dg-study-planner.md | Explores codebase during study mode |
| agents/dg-doc-generator.md | Generates documentation |

## Dependencies

**Inputs:** `.delegate/` (tasks, plan.state, daemon.status, templates), `../shared/types`

**Outputs:** `.delegate/results/`, `.delegate/loops/*/`, `.delegate/loop_plans/*/`, git commits
