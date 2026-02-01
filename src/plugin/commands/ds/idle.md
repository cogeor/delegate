---
name: ds:idle
description: Enter idle mode - continuously refine loop plans until /ds:wake
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - Bash
---

<objective>
Enter idle mode with a specified model. Continuously iterate on loop plans, adding details, finding new directions, and creating new loops until stopped with /ds:wake.
</objective>

<usage>
/ds:idle [model] [prompt]

Arguments:
  model  - haiku (default), sonnet, or opus
  prompt - Optional guidance for the idle planner

Examples:
  /ds:idle
  /ds:idle haiku
  /ds:idle sonnet "focus on improving test coverage"
  /ds:idle "explore the GSD verification patterns"
  /ds:idle opus "compare our daemon to GSD patterns and extract improvements"

If first argument is not a model name, it's treated as the prompt (uses haiku).
</usage>

<behavior>
Idle mode is a CONTINUOUS process that keeps running until /ds:wake is called.

Each iteration:
1. Reviews the current loop plan
2. Picks one loop to expand with more detail
3. OR discovers a new loop to add
4. OR finds new directions/approaches
5. Updates the loop plan folder
6. Logs the iteration
7. Waits briefly, then starts next iteration

The human can check progress anytime with /ds:status.
To stop: /ds:wake
</behavior>

<execution>
1. Parse arguments:
   ```
   IF no arguments:
     model = "haiku", prompt = null
   ELSE IF first arg is "haiku"|"sonnet"|"opus":
     model = first arg
     prompt = remaining args joined (or null)
   ELSE:
     model = "haiku"
     prompt = all args joined
   ```

2. Check if already in idle mode:
   - Read .dreamstate/idle.state
   - If active, report "Already in idle mode. Use /ds:wake to stop."

3. Create or continue loop plan:
   - If no active plan, create new: .dreamstate/loop_plans/{timestamp}-idle-session/
   - If resuming, use existing plan

4. Initialize idle state:
   ```json
   {
     "active": true,
     "startedAt": "{timestamp}",
     "model": "{model}",
     "prompt": "{prompt or null}",
     "iterations": 0,
     "currentLoopPlan": "{path}",
     "lastIteration": null,
     "tokensUsed": 0
   }
   ```
   Write to .dreamstate/idle.state

5. If prompt provided, write to {loop_plan}/FOCUS.md:
   ```markdown
   # Idle Session Focus

   > User-provided direction for this idle session.

   {prompt}

   ---
   Started: {timestamp}
   Model: {model}
   ```

6. Start iteration loop:
   ```
   max_iterations = config.daemon.auto_idle.max_iterations (default 10)

   WHILE idle.state.active == true:
     - Read current loop plan
     - Read FOCUS.md if exists
     - Read existing loop_plans/*/DRAFT.md for context (first 20 lines each)
     - Spawn ds-idle-planner with:
         model={model}
         prompt=See "Iteration Prompt Template" below
     - Agent appends ONE table row to ITERATIONS.md
     - Increment iterations
     - Update idle.state
     - Check if /ds:wake was called (idle.state.active == false)

     - IF iterations >= max_iterations:
         - Stop loop
         - Output: "Reached {max_iterations} iterations. Run /ds:idle to continue with fresh context."
         - Set idle.state.active = false

     - Brief pause (5 seconds)
   ```

7. Report idle mode started:
   ```
   Idle Mode Active
   ━━━━━━━━━━━━━━━━
   Model: {model}
   Focus: {prompt or "General exploration"}
   Loop Plan: {path}

   Idle mode will continuously refine loop plans.
   Check progress: /ds:status
   Stop with: /ds:wake
   ```
</execution>

<iteration-prompt-template>
When spawning ds-idle-planner, use this prompt structure:

```markdown
# Idle Mode Iteration {N} of {max_iterations}

## Step 1: Read Previous Context (MANDATORY)
Before any work, understand what exists:
1. Read .dreamstate/loop_plans/*/DRAFT.md (first 20 lines each)
2. Read .dreamstate/loops/*/STATUS.md for completed work
3. Note what's been done to avoid duplicates

## Step 2: Template Exploration (MANDATORY)
1. Pick 1-2 files from .dreamstate/templates/ relevant to focus
2. Read them, extract concrete patterns
3. This becomes your "Insight" column in the table

## Step 3: Focus Direction
{Contents of FOCUS.md if exists, otherwise "General exploration"}

## Step 4: Task
Based on previous context and template insights:
- Expand an existing loop with more detail
- OR create a new loop based on discovered patterns
- OR update MISSION.md with insights

## Output: ONE Table Row
Append exactly one row to ITERATIONS.md:
| {N} | {time} | {action} | {target} | {insight} |

No prose. No explanations. Just the table row.

## Loop Plan Location
{path to current loop plan}
```
</iteration-prompt-template>

<iteration-log>
ITERATIONS.md uses compact table format:

```markdown
# Idle Session: {session-id}
Focus: {focus} | Model: {model} | Limit: {max_iterations}

## Previous Context
- loop-01: {one-liner summary of what it does}
- loop-02: {one-liner summary}

## Iterations
| # | Time | Action | Target | Insight |
|---|------|--------|--------|---------|
| 1 | 00:05 | discover | gsd-planner | 50% context budget rule |
| 2 | 00:12 | research | daemon | token budget exists |
```

Each iteration appends ONE row. No prose between rows.

Fields:
- `{#}`: Iteration number
- `{Time}`: MM:SS from session start
- `{Action}`: discover|connect|refine|design|reflect|research
- `{Target}`: Short identifier (loop-id, file, section)
- `{Insight}`: Template pattern discovered (max 10 words)

**Max 100 lines total.** If approaching limit, summarize older iterations.
</iteration-log>
