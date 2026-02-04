---
name: dg:study
description: Enter study mode - continuously explore and analyze the codebase
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - Bash
  - WebSearch
---

# /dg:study - Continuous Study Mode

You are the ORCHESTRATOR for study mode. You spawn dg-study-planner agents in a loop.
Study mode is read-only exploration — no source code modifications, no commits.

## Non-Negotiable Rules

1. **Spawn dg-study-planner for each iteration** — do not explore the codebase yourself.
2. **Never modify source code** — study mode is read-only (tests are the exception during [V] iterations).
3. **Never commit** — study mode produces drafts, not implementations.
4. **Keep iterating** until interrupted or max_iterations reached.

## Step 1: Parse Arguments

```
/dg:study                        → model=haiku, theme=null
/dg:study haiku|sonnet|opus      → model={arg}, theme=null
/dg:study sonnet test coverage   → model=sonnet, theme="test coverage"
/dg:study error handling          → model=haiku, theme="error handling"
```

If first arg is not a model name, treat entire input as the theme (default model: haiku). No quotes needed.

## Step 2: Initialize

1. Check `.delegate/plan.state` — if already active, report and stop
2. Create session folder: `.delegate/loop_plans/{YYYYMMDD-HHMMSS}-plan-session/`
3. Write `.delegate/plan.state`:
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
   Preserve existing `session_summaries` from previous plan.state if present.

4. If theme provided, write `{session_folder}/THEME.md`:
   ```markdown
   # Plan Session Theme
   > This theme guides ALL iterations, not just one.
   **Theme:** {theme}
   ```

5. Report study mode started:
   ```
   Study Mode Active
   ================
   Model: {model}
   Theme: {theme or "General exploration"}
   Types: [T]emplate -> [I]ntrospect -> [R]esearch -> [F]lect -> [V]erify
   Study progress tracked in loop_plans/
   ```

## Step 3: Iteration Loop

Repeat until interrupted or max_iterations reached:

1. Determine type from iteration number (5-phase cycle):
   - 1, 6, 11... → [T] Template
   - 2, 7, 12... → [I] Introspect
   - 3, 8, 13... → [R] Research
   - 4, 9, 14... → [F] Reflect
   - 5, 10, 15... → [V] Verify

2. Load previous session summaries from plan.state

3. Spawn **dg-study-planner** with model={model}:
   ```
   Study Mode Iteration {N} of {max}
   Theme: {theme or "General exploration"}
   Type: {type}
   Session: {path}

   Previous Sessions:
   - {sessionId} ({N} iter): {summary}
   ```

4. Agent produces: one ITERATIONS.md row + one draft file (feature proposal, improvement, or test approach)

5. Increment iterations, update plan.state

6. If iterations >= max_iterations → stop, set active=false

7. Brief pause (5 seconds), check if interrupted

## Step 4: On Stop

When study mode ends (interrupt or max_iterations):

1. Read ITERATIONS.md, extract key findings
2. Create session summary, append to plan.state.session_summaries
3. Keep only last 5 summaries
4. Report final iteration count
