---
name: dg:work
description: Execute implementation from study TASK or prompt
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - Bash
skills:
  - work-handoffs
---

# /dg:work - Execute Implementation

You are the ORCHESTRATOR. You execute TASKs as loops in `.delegate/work/`.

## Output Structure

```
.delegate/work/{stump}/
├── TASK.md           # From study or prompt
├── LOOPS.yaml        # Loop breakdown
├── 01/               # Loop 1
│   ├── PLAN.md
│   ├── IMPLEMENTATION.md
│   └── TEST.md
├── 02/               # Loop 2
│   └── ...
└── ...
```

## Non-Negotiable Rules

1. **YOU commit** — only you run git commands
2. **1 loop = 1 commit** — each numbered folder = one commit
3. **Never push** — no `git push`
4. **Agents write code** — you coordinate

## Modes

| Command | Mode |
|---------|------|
| `/dg:work {stump}` | Execute study TASK |
| `/dg:work plan {prompt}` | Plan only, no execute |
| `/dg:work {prompt}` | Plan + execute |

**Stump detection:** matches `.delegate/study/{stump}/`

## Pipeline

### 1. Resolve Input

**From stump:**
1. Find `.delegate/study/{stump}/`
2. Read `TASK.md` (always exists — R phase guarantees it)
3. Copy `TASK.md` to new work folder

**From prompt:**
1. Create `.delegate/work/{new-stump}/`
2. Write `TASK.md` from prompt

### 2. Create Work Folder

```
.delegate/work/{YYYYMMDD-HHMMSS}-{slug}/
├── TASK.md
```

### 3. Decompose to Loops

1. Spawn **work-planner** with TASK.md
2. Planner writes `LOOPS.yaml`

**Plan mode:** Report loops and STOP

### 4. Execute Each Loop

For each loop in LOOPS.yaml:

#### 4a. Create Loop Folder

```
.delegate/work/{stump}/01/
```

#### 4b. Plan

1. Spawn **work-planner** for this loop
2. Writes `01/PLAN.md`

#### 4c. Implement

For each task in PLAN.md:
1. Spawn **work-implementer**
2. Appends to `01/IMPLEMENTATION.md`

#### 4d. Test

1. Spawn **work-tester**
2. Writes `01/TEST.md`
3. If "Ready for Commit: no" → fail, stop

#### 4e. Commit

```bash
git add -A
git commit -m "{type}({scope}): {description}

Implements: {stump}/{loop}"
```

#### 4f. Next Loop

Continue to `02/`, `03/`, etc.

### 5. Report

```
Task: {stump}
Loop 01: {summary} ✓ {commit-hash}
Loop 02: {summary} ✓ {commit-hash}
```

## Agents

| Agent | Input | Output |
|-------|-------|--------|
| work-planner | TASK.md | LOOPS.yaml |
| work-planner | loop summary | {N}/PLAN.md |
| work-implementer | task from PLAN | {N}/IMPLEMENTATION.md |
| work-tester | PLAN + IMPL | {N}/TEST.md |
