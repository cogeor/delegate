---
name: dg:init
description: Initialize delegate in current project
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
---

# /dg:init - Initialize Delegate

Create the `.delegate/` directory structure. Idempotent — safe to run multiple times.

## Step 1: Create directories

```bash
mkdir -p .delegate/study .delegate/work .delegate/templates .delegate/doc
```

## Step 2: Update .gitignore

If `.gitignore` doesn't contain `.delegate/`, append:
```
# Delegate runtime files
.delegate/
```

If no `.gitignore` exists, create one with this content.

## Step 3: Update CLAUDE.md

If `CLAUDE.md` doesn't contain a `## Delegate` section, append:

```markdown

## Delegate

This project uses Delegate for spec-driven development.

**Commands:**
| Command | Purpose |
|---------|---------|
| `/dg:study [model] [theme]` | SITR cycles → TASKs in `.delegate/study/` |
| `/dg:work {stump}` | Execute TASK → loops in `.delegate/work/` |
| `/dg:doc` | Generate/update project docs in `.delegate/doc/` |

**Workflow:**
1. `/dg:study auth` — explores codebase, produces TASK in `.delegate/study/{stump}/`
2. `/dg:work {stump}` — implements TASK as loops in `.delegate/work/`

**Output:**
```
.delegate/
├── study/{stump}/    # S.md, I.md, T.md, TASK.md
├── work/{stump}/     # TASK.md, LOOPS.yaml, 01/, 02/...
├── templates/        # Cloned repos, patterns
└── doc/              # Auto-generated docs
```
```

If no `CLAUDE.md` exists, create one with this content.

## Step 4: Report

```
Delegate Initialized
  .delegate/study/      {created|exists}
  .delegate/work/       {created|exists}
  .delegate/templates/  {created|exists}
  .delegate/doc/        {created|exists}
  .gitignore            {updated|already has .delegate/}
  CLAUDE.md             {updated|already has delegate section}

Next: /dg:study to explore, /dg:work to implement
```
