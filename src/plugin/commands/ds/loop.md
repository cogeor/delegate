---
description: Start a plan/implement/test loop from a plan draft
allowed-tools:
  - Read
  - Write
  - Glob
  - Task
  - Bash
---

<objective>
Execute a three-phase loop (plan → implement → test) based on a plan draft file.
</objective>

<usage>
/ds:loop [path-to-plan-draft]

If no path provided, looks for:
1. plan_draft.md in current directory
2. .dreamstate/plan_draft.md
</usage>

<instructions>
1. Read the plan draft file
2. Create a timestamped loop folder: .dreamstate/loops/{YYYYMMDD-HHMMSS}-{slug}/
3. Spawn the ds-coordinator agent with the plan draft content
4. Coordinator will orchestrate:
   - Planning phase → PLAN.md
   - Implementation phase → IMPLEMENTATION.md + code changes
   - Testing phase → TEST.md
5. On success, commit changes with descriptive message
</instructions>

<execution>
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
</execution>

<output>
Show loop progress and final status:
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
