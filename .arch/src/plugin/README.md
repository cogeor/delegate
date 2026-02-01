# Module: src/plugin

## Overview

Claude Code plugin providing slash commands and specialized agents for the dreamstate workflow. Commands interact with the daemon via IPC; agents handle specific phases of the plan/implement/test loop.

## Public API

**Commands (ds namespace):**
- `/ds:ping` - Test daemon connectivity
- `/ds:status` - Show daemon and idle mode status
- `/ds:idle [model] [prompt]` - Enter continuous idle refinement mode
- `/ds:wake` - Stop idle mode
- `/ds:loop [args]` - Execute plan/implement/test loops

**Agents:**
- `ds-coordinator` - Orchestrates the 3-phase loop
- `ds-planner` - Creates implementation plans from drafts
- `ds-executor` - Implements tasks from plans
- `ds-tester` - Verifies implementation against plan
- `ds-idle-planner` - Refines plans during idle mode

## Architecture

```
                          User
                            |
                    +-------v--------+
                    |  /ds:* commands |
                    +-------+--------+
                            |
         +------------------+------------------+
         |          |           |              |
    +----v----+ +---v---+ +----v----+  +------v------+
    |  ping   | |status | |  loop   |  |idle / wake  |
    +---------+ +-------+ +----+----+  +------+------+
         |          |          |              |
         |          |          v              v
         |          |   +------+------+  +----+------+
         |          |   | coordinator |  |idle-planner|
         v          v   +------+------+  +-----------+
    [.dreamstate/]      |      |
         ^              v      v
         |         +----+----+ +-----+-----+
         +-------->| planner | | executor  |
                   +---------+ +-----+-----+
                                     |
                                     v
                               +-----+-----+
                               |  tester   |
                               +-----------+
```

## Key Files

| File | Purpose |
|------|---------|
| commands/ds/ping.md | Tests daemon connectivity via IPC |
| commands/ds/status.md | Displays daemon and idle status |
| commands/ds/idle.md | Starts continuous idle planning mode |
| commands/ds/wake.md | Stops idle mode |
| commands/ds/loop.md | Executes loops with dependency resolution |
| agents/ds-coordinator.md | Orchestrates plan/implement/test phases |
| agents/ds-planner.md | Transforms drafts into detailed plans |
| agents/ds-executor.md | Implements tasks from plans |
| agents/ds-tester.md | Verifies implementation, gates commits |
| agents/ds-idle-planner.md | Explores templates, refines missions |

## Dependencies

**Inputs:** `.dreamstate/` (tasks, idle.state, daemon.status, templates), `../shared/types`

**Outputs:** `.dreamstate/results/`, `.dreamstate/loops/*/`, `.dreamstate/loop_plans/*/`, git commits

## Call Graph

```
/ds:loop
  +-> findLoopPlan() or findDraft()
  +-> resolveOrder() - dependency resolution
  +-> buildParallelGroups()
  +-> Task(ds-coordinator)
        +-> read DRAFT.md
        +-> Task(ds-planner)
        |     +-> explore codebase (Glob/Grep)
        |     +-> write PLAN.md
        +-> for each task: Task(ds-executor) -> IMPLEMENTATION.md
        +-> Task(ds-tester)
        |     +-> compare PLAN vs IMPLEMENTATION
        |     +-> run tests (Bash)
        |     +-> write TEST.md
        +-> if tests pass:
              +-> git add/commit
              +-> write COMMIT.md

/ds:idle
  +-> create loop_plan folder, write idle.state
  +-> loop: Task(ds-idle-planner) -> ITERATIONS.md -> check active
```
