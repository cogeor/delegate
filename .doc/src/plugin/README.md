# Module: Plugin

## Overview

Claude Code plugin providing slash commands and specialized agents for the delegate workflow. Commands coordinate specialized agents for the plan/implement/test loop.

## Public API

**Commands (dg namespace):**
- `/dg:study [model] [theme]` - Explore codebase, produce drafts in `loop_plans/`
- `/dg:work [args]` - Implement loops in `loops/` (plan, execute, test, commit)
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
         |                  |                  |
    +----v----+       +-----v-----+     +------v------+
    |  study  |       |   work    |     |    init     |
    +----+----+       +-----+-----+     +-------------+
         |                  |
         v                  v
    dg-study-       +-------+-------+
    planner         |   planner     |
         |          +-------+-------+
         v                  |
    [loop_plans/]    +------+------+
    (drafts)         |  executor   |
                     +------+------+
                            |
                     +------+------+
                     |   tester    |
                     +------+------+
                            |
                            v
                     [loops/]
                     (implementations)
```

## Key Files

| File | Purpose |
|------|---------|
| commands/dg/study.md | Starts continuous study mode |
| commands/dg/work.md | Executes loops with dependency resolution |
| commands/dg/init.md | Initializes delegate in a project |
| agents/dg-planner.md | Transforms drafts into detailed plans |
| agents/dg-executor.md | Implements tasks from plans |
| agents/dg-tester.md | Verifies implementation, gates commits |
| agents/dg-study-planner.md | Explores codebase during study mode |
| agents/dg-doc-generator.md | Generates documentation |

## Dependencies

**Inputs:** `.delegate/` (loop_plans, loops, plan.state, templates)

**Outputs:** `.delegate/loops/*/`, `.delegate/loop_plans/*/`, git commits
