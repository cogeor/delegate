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
   WHILE idle.state.active == true:
     - Read current loop plan
     - Read FOCUS.md if exists (pass to planner)
     - Spawn ds-idle-planner with model={model}, focus={prompt}
     - Agent returns: what was refined/added
     - Increment iterations
     - Update idle.state
     - Log to {loop_plan}/ITERATIONS.md
     - Check if /ds:wake was called (idle.state.active == false)
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

<iteration-log>
Append to {loop_plan}/ITERATIONS.md after each iteration:

```markdown
## Iteration {N}

Time: {timestamp}
Model: {model}

### Action
{What the idle planner did this iteration}

### Changes
- {file}: {what changed}

### Next Direction
{What the planner will focus on next}

---
```
</iteration-log>
