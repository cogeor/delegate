---
name: ds:loop
description: Start a plan/implement/test loop from a plan draft or loop plan
allowed-tools:
  - Read
  - Write
  - Glob
  - Task
  - Bash
---

<objective>
Execute loops from plan drafts or loop plans. Supports single loops, multiple loops, and dependency resolution.
</objective>

<usage>
/ds:loop [args...]

Modes:
  /ds:loop                     # Find plan_draft.md, run single loop
  /ds:loop ./my-draft.md       # Run loop from specific draft file
  /ds:loop 06                  # Run loop 06 from active loop plan
  /ds:loop 06 07 08            # Run multiple loops in order
  /ds:loop 06..10              # Run loops 06 through 10
  /ds:loop --all               # Run all pending loops from active plan
  /ds:loop --plan {path} 06    # Specify loop plan path explicitly

Options:
  --plan {path}   Path to loop plan folder (default: most recent in .dreamstate/loop_plans/)
  --all           Run all pending loops in dependency order
  --parallel      Enable parallel execution for independent loops (default: true)
  --sequential    Force sequential execution (disable parallelism)
  --dry-run       Show what would be executed without running
</usage>

<argument-detection>
Parse arguments to determine execution mode:

```
IF no arguments:
  mode = "draft"
  → Find plan_draft.md

ELSE IF first arg is a file path (contains / or ends with .md):
  mode = "draft"
  draft_path = first arg

ELSE IF first arg is "--all":
  mode = "all"
  → Execute all pending loops from active plan

ELSE IF first arg is "--plan":
  loop_plan_path = second arg
  remaining_args = args[2:]
  → Parse remaining args for loop IDs

ELSE IF first arg matches loop ID pattern (number or range):
  mode = "loops"
  → Parse loop IDs: 06, 06..10, or space-separated list
```

Loop ID patterns:
- Single: `06`, `6`, `09`
- Range: `06..10`, `6..10`
- List: `06 07 08` (space-separated)
</argument-detection>

<execution-mode-draft>
## Mode: Draft File

When running from a plan draft file:

1. Find and read the plan draft:
   - Check argument path first
   - Then ./plan_draft.md
   - Then .dreamstate/plan_draft.md
   - Error if not found

2. Generate loop folder name:
   - Timestamp: YYYYMMDD-HHMMSS format
   - Slug: first 30 chars of plan draft, kebab-cased
   - Example: .dreamstate/loops/20260201-143022-add-user-authentication/

3. Create the folder and initialize:
   - Copy plan draft as DRAFT.md
   - Create STATUS.md with "started" state

4. Spawn ds-coordinator agent:
   ```
   Task: ds-coordinator
   Prompt: Execute loop in {loop_folder}
   - Read DRAFT.md for requirements
   - Run planning phase → write PLAN.md
   - Run implementation phase → write IMPLEMENTATION.md
   - Run testing phase → write TEST.md
   - Update STATUS.md on completion
   ```

5. Report results to user
</execution-mode-draft>

<execution-mode-loops>
## Mode: Loop Plan Execution

When running specific loops from a loop plan:

1. **Find active loop plan:**
   ```bash
   # If --plan specified, use that path
   # Otherwise, find most recent loop plan
   ls -td .dreamstate/loop_plans/*/ 2>/dev/null | head -1
   ```

2. **Load loop manifest (LOOPS.yaml or parse OVERVIEW.md):**
   ```yaml
   # .dreamstate/loop_plans/{plan}/LOOPS.yaml
   loops:
     06:
       name: GSD pattern extraction
       status: pending|in_progress|complete
       depends_on: []
       draft: 06-gsd-patterns/DRAFT.md
     07:
       name: Agent boundary enforcement
       status: pending
       depends_on: [06]
       draft: 07-boundary-enforcement/DRAFT.md
   ```

3. **Parse requested loop IDs:**
   - Single: `06` → [06]
   - Range: `06..10` → [06, 07, 08, 09, 10]
   - List: `06 07 08` → [06, 07, 08]

4. **Resolve dependencies:**
   For each requested loop:
   - Check `depends_on` field
   - If dependency not complete, add to execution list
   - Build execution order (dependencies first)
   - Detect circular dependencies (error if found)

5. **Build parallel groups (unless --sequential):**
   - Group loops by dependency satisfaction
   - Loops in same group have no mutual dependencies
   - See <parallel-execution> section for algorithm

6. **Execute groups:**
   For each group:
   - If single loop: execute synchronously
   - If multiple loops: spawn parallel Task agents
   - Wait for group completion
   - Update manifest statuses
   - Commit after each loop completes

6. **Report results:**
   ```
   Loop Plan: {plan_name}
   ━━━━━━━━━━━━━━━━━━━━━
   ✓ Loop 06: GSD pattern extraction (b67bc3e)
   ✓ Loop 07: Agent boundary enforcement (abc123f)
   ◐ Loop 08: In progress...
   ```
</execution-mode-loops>

<execution-mode-all>
## Mode: Execute All Pending

When running with --all:

1. Load loop plan and manifest
2. Find all loops with status: pending
3. Build dependency-ordered execution list
4. Execute each loop in order
5. Update manifest after each completion
</execution-mode-all>

<dependency-resolution>
## Dependency Resolution Algorithm

```
function resolveOrder(requested: string[]): string[] {
  const resolved: string[] = [];
  const visiting = new Set<string>();

  function visit(id: string) {
    if (resolved.includes(id)) return;
    if (visiting.has(id)) {
      throw Error(`Circular dependency: ${id}`);
    }

    visiting.add(id);
    const loop = manifest.loops[id];

    // Visit dependencies first
    for (const dep of loop.depends_on) {
      if (manifest.loops[dep].status !== 'complete') {
        visit(dep);
      }
    }

    visiting.delete(id);
    resolved.push(id);
  }

  for (const id of requested) {
    visit(id);
  }

  return resolved;
}
```

Example:
```
Requested: [10]
Loop 10 depends_on: [09]
Loop 09 depends_on: []

Resolved order: [09, 10]
```
</dependency-resolution>

<loops-yaml-schema>
## LOOPS.yaml Schema

Location: `.dreamstate/loop_plans/{plan}/LOOPS.yaml`

```yaml
# Loop plan manifest
name: Context Architecture
created: 2026-02-01T20:20:07Z
status: in_progress

loops:
  "06":
    name: GSD pattern extraction
    scope: analysis
    status: complete
    depends_on: []
    draft: loops/20260201-210117-gsd-pattern-extraction/DRAFT.md
    completed_at: 2026-02-01T21:20:00Z
    commit: b67bc3e

  "07":
    name: Agent boundary enforcement
    scope: implementation
    status: pending
    depends_on: ["06"]
    draft: null  # Will be generated

  "09":
    name: Loop argument passing
    scope: implementation
    status: pending
    depends_on: []
    draft: null

  "10":
    name: Loop dependency resolution
    scope: implementation
    status: pending
    depends_on: ["09"]
    draft: null

  "11":
    name: Parallel loop execution
    scope: implementation
    status: pending
    depends_on: ["09", "10"]
    draft: null
```
</loops-yaml-schema>

<parallel-execution>
## Parallel Execution

When executing multiple loops, identify which can run in parallel (no mutual dependencies):

### Parallel Grouping Algorithm

```
function buildParallelGroups(orderedLoops: string[]): string[][] {
  const groups: string[][] = [];
  const completed = new Set<string>();

  // Pre-populate with already-complete loops
  for (const id of Object.keys(manifest.loops)) {
    if (manifest.loops[id].status === 'complete') {
      completed.add(id);
    }
  }

  const remaining = [...orderedLoops];

  while (remaining.length > 0) {
    const currentGroup: string[] = [];

    // Find all loops whose dependencies are satisfied
    for (const id of remaining) {
      const deps = manifest.loops[id].depends_on || [];
      const allDepsSatisfied = deps.every(dep => completed.has(dep));

      if (allDepsSatisfied) {
        currentGroup.push(id);
      }
    }

    if (currentGroup.length === 0) {
      throw Error("Deadlock: no loops can execute");
    }

    groups.push(currentGroup);

    // Mark as "will be completed" for next iteration
    for (const id of currentGroup) {
      completed.add(id);
      remaining.splice(remaining.indexOf(id), 1);
    }
  }

  return groups;
}
```

### Parallel Execution Flow

```
1. Resolve dependency order: [06, 07, 09, 10, 11]
2. Build parallel groups:
   - Group 1: [06, 09]     # No dependencies
   - Group 2: [07, 10]     # 07 needs 06, 10 needs 09
   - Group 3: [11]         # Needs 09, 10

3. Execute groups:
   FOR each group:
     IF group.length == 1:
       Execute single loop synchronously
     ELSE:
       Spawn parallel Task agents for each loop
       Wait for all to complete (TaskOutput with blocking)

     Update manifest statuses
     Report group completion
```

### Spawning Parallel Loops

When a group has multiple loops:

```
# Use Task tool with run_in_background for all but track completion
For loop in group[0:-1]:
  Task(ds-coordinator, loop_folder, run_in_background=true)

# Last one runs foreground, then collect background results
Task(ds-coordinator, last_loop_folder, run_in_background=false)

For each background task:
  TaskOutput(task_id, block=true)
```

### Progress Reporting

```
Loop Plan: context-architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Group 1 (parallel):
  ◐ Loop 06: GSD pattern extraction
  ◐ Loop 09: Loop argument passing

Group 1 complete:
  ✓ Loop 06: GSD pattern extraction (b67bc3e)
  ✓ Loop 09: Loop argument passing (def456g)

Group 2 (parallel):
  ◐ Loop 07: Agent boundary enforcement
  ◐ Loop 10: Loop dependency resolution

...

All 5 loops complete (3 groups, max parallelism: 2)
```
</parallel-execution>

<output>
Show loop progress and final status:

Single loop:
```
Loop: 20260201-143022-add-user-authentication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Plan phase complete
✓ Implementation phase complete
✓ Test phase complete

Artifacts: .dreamstate/loops/20260201-143022-add-user-authentication/
Commit: abc123f - feat: add user authentication
```

Multiple loops:
```
Loop Plan: context-architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Executing 3 loops (2 dependencies resolved)

✓ Loop 06: GSD pattern extraction (b67bc3e)
✓ Loop 09: Loop argument passing (def456g)
✓ Loop 10: Loop dependency resolution (hij789k)

All loops complete.
```
</output>
