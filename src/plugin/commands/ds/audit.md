---
name: ds:audit
description: Enter audit mode - continuously explore and analyze the codebase
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - Bash
  - WebSearch
---

<objective>
Enter audit mode with a specified model. Continuously iterate on exploration, code analysis, and external research until interrupted or max_iterations is reached.
</objective>

<usage>
/ds:audit [model] [theme]

Arguments:
  model - haiku (default), sonnet, or opus
  theme - Optional overarching theme that guides ALL iterations

The theme is NOT a one-time task. It's a lens through which every iteration views its work.
Audit mode continues iterating until interrupted or max_iterations is reached.

Examples:
  /ds:audit
  /ds:audit haiku
  /ds:audit sonnet "test coverage"           # Every iteration focuses on testing
  /ds:audit "error handling"                  # All iterations examine error handling
  /ds:audit opus "daemon architecture"        # Deep dive into daemon across all phases

If first argument is not a model name, it's treated as the theme (uses haiku).
</usage>

<behavior>
Audit mode is a CONTINUOUS process that keeps running until interrupted.

Each iteration selects an audit TYPE and executes that exploration (4-phase cycle):
- [T] Template - explore .dreamstate/templates/ for patterns
- [I] Introspect - analyze src/ code for improvements
- [R] Research - search web for external patterns
- [V] Verify - run build, run tests, create tests for missing coverage

The [V] Verify phase GROUNDS audits in reality by actually executing code.

The human can check progress anytime with /ds:status.
To stop: interrupt the process (Ctrl+C).
</behavior>

<audit-types>
## Audit Type Selection

Each iteration deterministically selects ONE type based on iteration number (4-phase cycle):
- Iteration 1, 5, 9, 13...  → [T] Template
- Iteration 2, 6, 10, 14... → [I] Introspect
- Iteration 3, 7, 11, 15... → [R] Research
- Iteration 4, 8, 12, 16... → [V] Verify

### Type [T] - Template Exploration (with fallback)
- Read 1-2 files from .dreamstate/templates/
- Extract patterns applicable to this project
- Compare to existing implementation
- Output insight references template file

**Fallback to [I]:** If templates are stale or unhelpful:
- Template patterns already implemented better in src/
- Template is empty or irrelevant to current theme
- No templates exist
→ Fall back to [I] Introspect for this iteration

### Type [I] - Code Introspection
- Read 2-3 source files from src/
- Look for: duplication, missing error handling, inconsistent patterns
- Look for: opportunities for abstraction, dead code, TODO comments
- Suggest concrete improvements
- MAY read .arch/*.md for context

### Type [R] - External Research
- Use WebSearch (max 1 query, 3 results)
- Search for: best practices, libraries, patterns relevant to focus
- Extract actionable insights from results
- Note: WebSearch limited to 1 per iteration

### Type [V] - Verify Execution (GROUNDING)
- Run `npm run build` to verify code compiles
- Run `npm test` to see current test status
- Identify untested modules from previous [I] findings
- Create test files (*.test.ts only) for missing coverage
- Output insight includes build/test status (e.g., "build OK, 5/8 tests pass")
- MUST NOT modify non-test source code
</audit-types>

<execution>
1. Parse arguments:
   ```
   IF no arguments:
     model = "haiku", theme = null
   ELSE IF first arg is "haiku"|"sonnet"|"opus":
     model = first arg
     theme = remaining args joined (or null)
   ELSE:
     model = "haiku"
     theme = all args joined
   ```

2. Check if already in audit mode:
   - Read .dreamstate/audit.state
   - If active, report "Already in audit mode. Interrupt to stop."

3. Create or continue loop plan:
   - If no active plan, create new: .dreamstate/loop_plans/{timestamp}-audit-session/
   - If resuming, use existing plan

4. Initialize audit state:
   ```json
   {
     "active": true,
     "startedAt": "{timestamp}",
     "model": "{model}",
     "theme": "{theme or null}",
     "iterations": 0,
     "currentLoopPlan": "{path}",
     "lastIteration": null,
     "tokensUsed": 0,
     "session_summaries": []
   }
   ```
   Write to .dreamstate/audit.state

   **Note**: Preserve existing `session_summaries` from previous audit.state if present.

5. If theme provided, write to {loop_plan}/THEME.md:
   ```markdown
   # Audit Session Theme

   > This theme guides ALL iterations. It is not a one-time task.
   > Every iteration should view its work through this lens.

   **Theme:** {theme}

   ## How to Apply This Theme

   - [T] Template: Look for templates related to "{theme}"
   - [I] Introspect: Analyze src/ code specifically for "{theme}" concerns
   - [R] Research: Search for best practices around "{theme}"
   - [V] Verify: Test and verify "{theme}" aspects work correctly

   ---
   Started: {timestamp}
   Model: {model}
   ```

6. Start iteration loop:
   ```
   max_iterations = config.daemon.auto_audit.max_iterations
   # Find config value: grep "max_iterations" .dreamstate/config.json

   # Load previous session summaries for context injection
   previous_summaries = audit.state.session_summaries (or [] if none)

   WHILE audit.state.active == true:
     - Determine audit type: (iterations % 4) → 0=[T], 1=[I], 2=[R], 3=[V]
     - Read current loop plan
     - Read THEME.md if exists (this guides ALL iterations, not just one)
     - Build "Previous Sessions" section from previous_summaries
     - Spawn ds-audit-planner with:
         model={model}
         audit_type={type}
         prompt=See "Iteration Prompt Template" below
     - Agent appends ONE table row to ITERATIONS.md (with Type column)
     - Increment iterations
     - Update audit.state
     - Check if interrupted (audit.state.active == false)

     - IF iterations >= max_iterations:
         - Stop loop
         - Output: "Reached {max_iterations} iterations. Run /ds:audit to continue with fresh context."
         - Set audit.state.active = false

     - Brief pause (5 seconds)
   ```

7. On audit mode stop (via interrupt or max_iterations reached):
   ```
   - Read ITERATIONS.md from current session
   - Extract key findings (look for ## Findings section or last 3 iterations)
   - Create session summary:
     {
       "sessionId": "{loop_plan_folder_name}",
       "iterations": {count},
       "summary": "{theme or 'General exploration'}: {key findings}"
     }
   - Append to audit.state.session_summaries
   - Keep only last 5 session summaries (prevent unbounded growth)
   - Write updated audit.state
   ```

8. Report audit mode started:
   ```
   Audit Mode Active
   ━━━━━━━━━━━━━━━━━
   Model: {model}
   Theme: {theme or "General exploration"}
   Loop Plan: {path}

   Types: [T]emplate → [I]ntrospect → [R]esearch → [V]erify (4-phase cycle)

   The theme guides ALL iterations - it's not a one-time task.
   Audit mode will continuously iterate until interrupted or max_iterations.
   Check progress: /ds:status
   ```
</execution>

<iteration-prompt-template>
When spawning ds-audit-planner, use this prompt structure:

```markdown
# Audit Mode Iteration {N} of {max_iterations}

## Session Theme (APPLIES TO ALL ITERATIONS)
{If THEME.md exists:}
**Theme: {theme}**
This theme guides your exploration. View all work through this lens.
Do NOT treat this as a one-time task - it's an overarching direction.

{If no theme: "General exploration - no specific theme."}

## Audit Type: {type}
This iteration is type **{type}**:
- [T] = Explore .dreamstate/templates/ for patterns related to theme
- [I] = Analyze src/ code for improvements related to theme
- [R] = Search web for patterns related to theme
- [V] = Run build, run tests, verify theme-related functionality

Execute ONLY this type's workflow, but always through the theme lens.

## Previous Sessions (Context Preservation)
{For each session in session_summaries:}
- {sessionId} ({iterations} iter): {summary}

{If no previous sessions: "First audit session - no prior context."}

## Step 1: Read Previous Context (MANDATORY)
Before any work, understand what exists:
1. Read .dreamstate/loop_plans/*/DRAFT.md (first 20 lines each)
2. Read .dreamstate/loops/*/STATUS.md for completed work
3. Note what's been done to avoid duplicates

## Step 2: Execute Audit Type (Through Theme Lens)

### If [T] Template:
1. Check if .dreamstate/templates/ exists and has useful content
2. Pick 1-2 files relevant to the session theme
3. Compare template patterns to current src/ implementation
4. **EVALUATE:** Is this template useful?
   - Already implemented better in src/? → STALE
   - Empty or irrelevant to theme? → UNHELPFUL
   - No templates exist? → MISSING
5. **If STALE/UNHELPFUL/MISSING:** Fall back to [I] Introspect instead
   - Log: "| N | time | [T→I] | fallback | reason | insight |"
6. If useful: Extract patterns, insight references template file path

### If [I] Introspect:
1. Pick 2-3 files from src/
2. Analyze specifically for theme-related concerns
3. Also look for: code smells, duplication, inconsistencies
4. Insight should describe the finding

### If [R] Research:
1. Use WebSearch with 1 focused query related to theme
2. Extract actionable patterns from results
3. Insight should cite the source

### If [V] Verify:
1. Run `npm run build` - verify code compiles
2. Run `npm test` - capture full test status (pass/fail counts)
3. Document which tests fail and WHY (this informs future loops)
4. Create test files for untested modules (*.test.ts only)
5. Failing tests are VALUABLE - they highlight problems to solve
6. Insight should include: "build {OK|FAIL}, {X}/{Y} tests pass"
7. Loop draft should document test status as baseline

## Step 3: Create Loop Draft (MANDATORY)
**Each iteration = 1 loop.** You MUST create artifacts:

**Reference:** See `src/plugin/references/loop-plan-structure.md` for full spec.

1. **ITERATIONS.md** - Append ONE table row:
   | {N} | {time} | {type} | {action} | {target} | {insight} |

2. **OVERVIEW.md** - Create on iteration 1, update on subsequent iterations:
   - Include current baseline (build/test status)
   - Add new loop entry to Implementation Loops table
   - Update dependencies if relevant

3. **{NN}-{slug}.md** - Create loop draft file with FULL structure:
   - Status section (type: audit, status: proposed)
   - Current Test Status (run npm test, document what passes/fails)
   - Context (what you discovered)
   - Problem Statement (what this loop solves)
   - Objective (measurable outcome)
   - Implementation Spec (files to modify, steps)
   - Acceptance Criteria (TESTABLE - include verify command for each)
   - Test Plan (tests to create, expected post-implementation state)

**Every iteration produces a complete loop draft. No exceptions.**

**Audit loops CAN create test files to validate assumptions.**

**IMPORTANT: This is iteration {N} of {max_iterations}. Audit mode continues until interrupted or max reached.**

## Loop Plan Location
{path to current loop plan}
```
</iteration-prompt-template>

<iteration-log>
## Output Structure Per Iteration

Each iteration produces THREE artifacts:

### 1. ITERATIONS.md (table row)
```markdown
# Audit Session: {session-id}
Theme: {theme or "General"} | Model: {model} | Limit: {max_iterations}

## Iterations
| # | Time | Type | Action | Target | Insight |
|---|------|------|--------|--------|---------|
| 1 | 00:05 | [T] | discover | templates/workflow | state machine pattern |
| 2 | 00:12 | [I] | analyze | daemon/index | nesting in processTask |
```

### 2. OVERVIEW.md (created iteration 1, updated each iteration)
```markdown
# Audit Session: {session-id}

## Vision
{What this session aims to discover/improve}

## Implementation Loops
| # | Loop | Scope | Status | Description |
|---|------|-------|--------|-------------|
| 01 | state-machine-pattern | analysis | pending | Extract state machine from templates |
| 02 | process-task-refactor | implementation | pending | Flatten nesting in processTask |
```

### 3. Loop Draft File ({NN}-{slug}.md)

**Reference:** See `src/plugin/references/loop-plan-structure.md` for full spec.

```markdown
# Loop 01: State Machine Pattern

## Status
- Type: audit
- Created: 2026-02-02T10:05:00Z
- Status: proposed

## Current Test Status

**Run to verify:**
```bash
npm run build && npm test
```

**Current state:**
- Build: passing
- Tests: 12 passing, 3 failing
- Relevant failing tests:
  - `daemon state transitions`: invalid state not caught
  - `process cleanup`: orphaned processes on error

**What failures indicate:**
State management is implicit, leading to invalid transitions.

## Context
Read templates/workflow.md, found state machine pattern that explicitly
models valid transitions and prevents invalid states.

## Problem Statement
Daemon has implicit state that can become inconsistent, especially
during error recovery. Need explicit state machine.

## Objective
Extract and apply state machine pattern to daemon to prevent invalid states.

## Implementation Spec

### Files to Modify
| File | Current State | Changes Required |
|------|---------------|------------------|
| src/daemon/index.ts | Implicit state via flags | Add state machine |
| src/shared/types.ts | No state types | Add DaemonState enum |

### Implementation Steps
1. Create DaemonState enum in shared/types.ts
2. Create state transition validator
3. Refactor daemon/index.ts to use state machine
4. Update tests to verify state transitions

## Acceptance Criteria

- [ ] **State transitions are explicit**
  - Verify: `grep -r "setState" src/daemon/`
  - Expected: All state changes go through setState()

- [ ] **Invalid transitions throw**
  - Verify: `npm test -- --grep "state"`
  - Expected: Tests verify invalid transitions throw

## Test Plan

### Tests to Create
- `src/daemon/state.test.ts`: Tests valid/invalid transitions

### Expected Post-Implementation
- Build: passing
- Tests: 15 passing, 0 failing (3 fixed + 3 new)
```

**Every iteration = 1 complete loop draft. No exceptions.**
</iteration-log>
