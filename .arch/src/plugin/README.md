# Module: src/plugin

## Overview

Claude Code plugin providing slash commands and specialized agents for the dreamstate workflow. Commands interact with the daemon via IPC; agents handle specific phases of the plan/implement/test loop.

## Public API

**Commands (ds namespace):**
- `/ds:ping` - Test daemon connectivity
- `/ds:status` - Show daemon and dream mode status
- `/ds:dream [model] [prompt]` - Enter continuous dream refinement mode
- `/ds:wake` - Stop dream mode
- `/ds:loop [args]` - Execute plan/implement/test loops

**Agents:**
- `ds-coordinator` - Orchestrates the 3-phase loop
- `ds-planner` - Creates implementation plans from drafts
- `ds-executor` - Implements tasks from plans
- `ds-tester` - Verifies implementation against plan
- `ds-dream-planner` - Refines plans during dream mode

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
    |  ping   | |status | |  loop   |  |dream / wake |
    +---------+ +-------+ +----+----+  +------+------+
         |          |          |              |
         |          |          v              v
         |          |   +------+------+  +------+------+
         |          |   | coordinator |  |dream-planner|
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
| commands/ds/status.md | Displays daemon and dream status |
| commands/ds/dream.md | Starts continuous dream planning mode |
| commands/ds/wake.md | Stops dream mode |
| commands/ds/loop.md | Executes loops with dependency resolution |
| agents/ds-coordinator.md | Orchestrates plan/implement/test phases |
| agents/ds-planner.md | Transforms drafts into detailed plans |
| agents/ds-executor.md | Implements tasks from plans |
| agents/ds-tester.md | Verifies implementation, gates commits |
| agents/ds-dream-planner.md | Explores templates, refines missions |

## Dependencies

**Inputs:** `.dreamstate/` (tasks, dream.state, daemon.status, templates), `../shared/types`

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

/ds:dream
  +-> create loop_plan folder, write dream.state
  +-> loop: Task(ds-dream-planner) -> ITERATIONS.md -> check active
```
