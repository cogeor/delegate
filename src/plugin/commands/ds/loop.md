---
name: ds:loop
description: Start a plan/implement/test loop from a plan draft or loop plan (user)
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - Bash
  - Edit
---

<objective>
Execute loops from plan drafts, loop plans, or natural language prompts. Supports planning-only mode, plan-then-implement mode, and direct execution.
</objective>

<usage>
/ds:loop [args...]

Modes:
  /ds:loop plan                    # Show all unimplemented loops (NO execution)
  /ds:loop plan "add dark mode"    # Plan ONLY - create plan, report for review (NO implementation)
  /ds:loop "add dark mode"         # Plan THEN implement from prompt
  /ds:loop                         # Find plan_draft.md, run single loop
  /ds:loop ./my-draft.md           # Run loop from specific draft file
  /ds:loop 06                      # Run loop 06 from active loop plan
  /ds:loop 06 07 08                # Run multiple loops in order
  /ds:loop 06..10                  # Run loops 06 through 10
  /ds:loop --all                   # Run all pending loops from active plan

Options:
  --plan {path}   Path to loop plan folder (default: most recent in .dreamstate/loop_plans/)
  --all           Run all pending loops in dependency order
  --dry-run       Show what would be executed without running
</usage>

<argument-detection>
Parse arguments to determine execution mode:

```
IF first arg is "plan":
  IF more args exist:
    mode = "plan-only"
    prompt = remaining args joined
    → Create plan, report for review (NO implementation)
  ELSE:
    mode = "plan"
    → Summarize all unimplemented loops (NO execution)

ELSE IF first arg is a quoted string or natural language (not a path, number, or flag):
  mode = "prompt"
  prompt = all args joined
  → Create loop plan FIRST, then implement

ELSE IF no arguments:
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

ELSE:
  # Treat as prompt (natural language)
  mode = "prompt"
  prompt = all args joined
```

**Detecting prompt vs other modes:**
- If arg starts with `"` or `'` → prompt
- If arg contains spaces and isn't a flag → prompt
- If arg is NOT: a number, a file path, "plan", "--all", "--plan" → prompt
</argument-detection>

<execution-mode-plan>
## Mode: Plan Summary (NO EXECUTION)

When `ds:loop plan` is called:

**Purpose:** Show what needs to be done without doing anything. Read-only inspection.

1. **Find all loop plans:**
   ```bash
   ls -d .dreamstate/loop_plans/*/
   ```

2. **For each loop plan, find unimplemented items:**
   - Read LOOPS.yaml or OVERVIEW.md
   - Find loops with status: pending or in_progress
   - Read each loop's DRAFT.md (first 30 lines)

3. **Output summary:**
   ```
   Unimplemented Loops
   ━━━━━━━━━━━━━━━━━━━

   Loop Plan: 20260202-context-architecture
   ├── Loop 07: Agent boundary enforcement [pending]
   │   → Enforce agent tool restrictions at runtime
   ├── Loop 09: Loop argument passing [pending]
   │   → Parse and pass arguments to loop commands
   └── Loop 10: Dependency resolution [pending, depends: 09]
       → Resolve loop dependencies before execution

   Loop Plan: 20260201-audit-session
   └── (no pending loops)

   Total: 3 unimplemented loops across 2 plans

   To implement: /ds:loop 07  or  /ds:loop "description"
   ```

4. **DO NOT execute anything.** This is purely informational.
</execution-mode-plan>

<execution-mode-plan-only>
## Mode: Plan Only (with prompt)

When `ds:loop plan "prompt"` is called (e.g., `/ds:loop plan "add user auth"`):

**Purpose:** Create a plan from the prompt, analyze feasibility, report for review. NO implementation.

1. **Create loop plan folder:**
   ```
   .dreamstate/loop_plans/{timestamp}-{slug}/
   ```

2. **Analyze codebase and create DRAFT.md:**
   - Read relevant source files based on prompt
   - Identify files that would need modification
   - Check existing patterns and conventions
   - Run `npm run build && npm test` to capture baseline

3. **Spawn ds-planner for detailed plan:**
   ```
   Task: ds-planner
   Input: DRAFT.md, STATE.md
   Output: PLAN.md with tasks, files, acceptance criteria
   ```

4. **Analyze the plan for issues:**
   - Estimate complexity (files touched, new dependencies)
   - Identify risks (breaking changes, untested areas)
   - Check if acceptance criteria are testable
   - Assess value vs effort

5. **Report for review:**
   ```
   Loop Plan: {prompt}
   ━━━━━━━━━━━━━━━━━━━━━
   Location: .dreamstate/loop_plans/{folder}/

   ## Summary
   {2-3 sentence overview}

   ## Tasks ({count})
   1. {task 1} - {files affected}
   2. {task 2} - {files affected}
   ...

   ## Complexity Assessment
   - Files to modify: {count}
   - Files to create: {count}
   - Estimated risk: {low|medium|high}
   - Dependencies: {any new deps?}

   ## Potential Issues
   - {issue 1}
   - {issue 2}

   ## Recommendation
   {Worth implementing? Suggested changes to scope?}

   ---
   To implement: /ds:loop {folder}
   To modify plan: Edit .dreamstate/loop_plans/{folder}/PLAN.md
   ```

6. **DO NOT spawn executor or tester.** Stop after planning.
</execution-mode-plan-only>

<execution-mode-prompt>
## Mode: Prompt → Plan → Implement

When a natural language prompt is provided (e.g., `/ds:loop "add user authentication"`):

**This mode creates a plan FIRST, then implements it.** Unlike audit mode, this CAN modify source code.

### Phase 1: Planning (like auditing)

1. **Create loop plan folder:**
   ```
   .dreamstate/loop_plans/{timestamp}-{slug}/
   ```
   - Timestamp: YYYYMMDD-HHMMSS
   - Slug: kebab-case from first 30 chars of prompt

2. **Analyze the codebase to understand context:**
   - Read relevant source files based on prompt
   - Identify files that will need modification
   - Check existing patterns and conventions

3. **Create DRAFT.md with implementation plan:**

   **Reference:** See `src/plugin/references/loop-plan-structure.md` for full spec.

   Include: Status, Current Test Status, Context, Problem Statement, Objective,
   Implementation Spec (files to modify/create, steps), Acceptance Criteria
   (with verify commands), Test Plan.

4. **Show the plan to user:**
   ```
   Loop Plan Created
   ━━━━━━━━━━━━━━━━━
   Prompt: {prompt}
   Plan: .dreamstate/loop_plans/{folder}/DRAFT.md

   Implementation Plan:
   1. {Step 1}
   2. {Step 2}
   ...

   Files to modify: {count}
   Files to create: {count}

   Proceeding with implementation...
   ```

### Phase 2: Execution (3-phase loop)

5. **Create loop execution folder:**
   ```
   .dreamstate/loops/{timestamp}-{slug}/
   ```
   - Copy DRAFT.md from loop plan
   - Create STATUS.md with `phase: planning`

6. **Planning phase - Spawn ds-planner:**
   ```
   Task: ds-planner
   Prompt: Create implementation plan from DRAFT.md
   Input: {loop_folder}/DRAFT.md, .dreamstate/STATE.md
   Output: {loop_folder}/PLAN.md
   ```
   - Update STATUS.md: `phase: implementing`

7. **Implementation phase - Spawn ds-executor (per task):**
   ```
   Task: ds-executor
   Prompt: Implement task {N} from PLAN.md
   Input: Task spec from PLAN.md
   Output: Code changes, append to IMPLEMENTATION.md
   ```
   - Run sequentially for each task in PLAN.md
   - Update STATUS.md: `phase: testing`

8. **Testing phase - Spawn ds-tester:**
   ```
   Task: ds-tester
   Prompt: Verify implementation matches plan
   Input: PLAN.md, IMPLEMENTATION.md
   Output: {loop_folder}/TEST.md
   ```
   - If `Ready for Commit: yes` → commit and update STATUS.md: `phase: complete`
   - If `Ready for Commit: no` → update STATUS.md: `phase: failed`

9. **Report results:**
   ```
   Loop Complete: {prompt}
   ━━━━━━━━━━━━━━━━━━━━━━━
   ✓ Plan phase complete
   ✓ Implementation phase complete
   ✓ Test phase complete

   Files modified: {list}
   Files created: {list}
   Commit: {hash} - {message}
   ```

### Key Differences from Audit Mode

| Aspect | Audit Mode | Loop Prompt Mode |
|--------|------------|------------------|
| Modifies code | NO (read-only) | YES |
| Creates files | Only tests | Any files |
| Runs build/test | Yes (verify) | Yes (verify + fix) |
| Commits | No | Yes |
| Purpose | Explore & plan | Plan & execute |
</execution-mode-prompt>

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
   - Slug: first 30 chars of plan draft title, kebab-cased
   - Example: .dreamstate/loops/20260201-143022-add-user-authentication/

3. Create the folder and initialize:
   - Copy plan draft as DRAFT.md
   - Create STATUS.md with `phase: planning`

4. Run 3-phase execution (same as prompt mode):
   - Spawn ds-planner → PLAN.md
   - Spawn ds-executor (per task) → IMPLEMENTATION.md
   - Spawn ds-tester → TEST.md
   - Commit on success

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

5. **Execute loops:**
   For each loop in order:
   - Run 3-phase execution (ds-planner → ds-executor(s) → ds-tester)
   - Update manifest status
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
```
</loops-yaml-schema>

<output>
Show loop progress and final status:

Plan summary (`/ds:loop plan`):
```
Unimplemented Loops
━━━━━━━━━━━━━━━━━━━

Loop Plan: 20260202-context-architecture
├── Loop 07: Agent boundary enforcement [pending]
│   → Enforce agent tool restrictions at runtime
└── Loop 09: Loop argument passing [pending]
    → Parse and pass arguments to loop commands

Total: 2 unimplemented loops
```

Prompt mode:
```
Loop: add user authentication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1: Planning
  ✓ Analyzed codebase context
  ✓ Created implementation plan
  → .dreamstate/loop_plans/20260202-add-user-authentication/DRAFT.md

Phase 2: Implementation
  ✓ Plan phase complete
  ✓ Implementation phase complete
  ✓ Test phase complete

Files modified: src/auth.ts, src/routes.ts
Files created: src/middleware/auth.ts
Commit: abc123f - feat: add user authentication
```

Single loop from draft:
```
Loop: 20260201-143022-add-user-authentication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Plan phase complete
✓ Implementation phase complete
✓ Test phase complete

Artifacts: .dreamstate/loops/20260201-143022-add-user-authentication/
Commit: abc123f - feat: add user authentication
```
</output>
