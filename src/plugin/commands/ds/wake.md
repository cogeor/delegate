---
description: Stop idle mode and return control to human
allowed-tools:
  - Read
  - Write
---

<objective>
Stop the idle mode loop and return control to the human user.
</objective>

<execution>
1. Read .dreamstate/idle.state

2. If not in idle mode:
   ```
   Not in idle mode. Nothing to wake from.
   ```

3. If in idle mode:
   - Set active = false
   - Set stoppedAt = current timestamp
   - Write updated state to .dreamstate/idle.state

4. Report summary:
   ```
   Idle Mode Stopped
   ━━━━━━━━━━━━━━━━━
   Duration: {time since startedAt}
   Iterations: {count}
   Model: {model}

   Loop Plan: {currentLoopPlan}

   Summary of work done:
   - {count} iterations completed
   - {N} loops refined
   - {M} new loops added

   To review: Read {currentLoopPlan}/ITERATIONS.md
   To continue idle: /ds:idle
   To run a loop: /ds:loop {path-to-loop-draft}
   ```
</execution>

<state-update>
Update .dreamstate/idle.state:
```json
{
  "active": false,
  "startedAt": "{original}",
  "stoppedAt": "{now}",
  "model": "{model}",
  "iterations": {final count},
  "currentLoopPlan": "{path}",
  "lastIteration": "{timestamp}",
  "tokensUsed": {estimate}
}
```
</state-update>
