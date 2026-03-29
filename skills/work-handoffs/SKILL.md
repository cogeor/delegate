---
name: work-handoffs
description: Output formats and folder structure for work agents
---

# Work Handoff Formats

All work output goes to `.delegate/work/`.

## Folder Structure

```
.delegate/work/
├── {YYYYMMDD-HHMMSS}-{slug}/    # Task folder
│   ├── TASK.md                   # Copy from study or new
│   ├── LOOPS.yaml                # Loop breakdown
│   ├── 01/                       # Loop 1
│   │   ├── PLAN.md
│   │   ├── IMPLEMENTATION.md
│   │   └── TEST.md
│   ├── 02/                       # Loop 2
│   │   ├── PLAN.md
│   │   ├── IMPLEMENTATION.md
│   │   └── TEST.md
│   └── ...
└── ...
```

**Task folder:** `{YYYYMMDD-HHMMSS}-{slug}`
**Loop folders:** `01/`, `02/`, `03/`, ... (zero-padded)

## Task Level Files

### TASK.md

Copied from study or created from prompt:

```markdown
# TASK: {title}

Created: {timestamp}
Source: {study stump | prompt}

## Summary

{description}

## Objective

{outcome}

## Scope

- `{path}`: {change}

## Acceptance Criteria

- [ ] {criterion}
```

### LOOPS.yaml

```yaml
loops:
  - id: 01
    summary: {one line}
    status: pending | in_progress | complete | failed
  - id: 02
    summary: {one line}
    depends_on: [01]
    status: pending
```

## Loop Level Files

Each loop folder (`01/`, `02/`, etc.) contains:

### PLAN.md

```markdown
# Loop {id}: {summary}

## Overview

{what this loop accomplishes}

## Tasks

### Task 1: {name}

**Goal:** {what to do}

**Files:**
| Action | Path |
|--------|------|
| MODIFY | `{path}` |
| CREATE | `{path}` |

**Steps:**
1. {step}
2. {step}

**Verify:** {how to verify}

### Task 2: {name}
...

## Acceptance Criteria

- [ ] {criterion}
```

### IMPLEMENTATION.md

Appended by implementer after each task:

```markdown
# Implementation Log

## Task 1: {name}

Completed: {timestamp}

### Changes

- `{path}`: {what was done}

### Verification

- [x] {criterion}: {result}

---

## Task 2: {name}
...
```

### TEST.md

Written by tester:

```markdown
# Test Results

Tested: {timestamp}
Status: PASS | FAIL

## Task Verification

- [x] Task 1: {result}
- [x] Task 2: {result}

## Acceptance Criteria

- [x] {criterion}: {result}

## Build & Tests

- Build: {OK|FAIL}
- Tests: {pass}/{total}

## Commit Gate

ready: yes | no
reason: {why ready or why not}
commit-message: {type}({scope}): {description}
```

## Workflow

```
/dg:work {stump}
    │
    ▼
.delegate/study/{stump}/TASK.md
    │
    ▼
.delegate/work/{timestamp}-{slug}/
    ├── TASK.md (copy)
    ├── LOOPS.yaml (from planner)
    ├── 01/
    │   ├── PLAN.md (from planner)
    │   ├── IMPLEMENTATION.md (from implementer)
    │   └── TEST.md (from tester)
    │   └── [commit]
    └── 02/
        └── ...
```

## Key Rules

1. **One folder per task** — task = unit from study
2. **Numbered loop subfolders** — `01/`, `02/`, etc.
3. **Each loop = one commit** — after TEST.md says ready
4. **Sequential execution** — respect depends_on in LOOPS.yaml
5. **Stump links study → work** — traceability
