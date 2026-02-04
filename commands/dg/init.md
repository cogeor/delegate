---
name: dg:init
description: Initialize delegate in current project (user)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
---

# /dg:init - Initialize Delegate

Create the `.delegate/` directory structure and update project files. This command is idempotent — safe to run multiple times. Never overwrite existing config.

## Step 1: Create directories

```bash
mkdir -p .delegate/loops .delegate/loop_plans
```

## Step 2: Create config.json (if missing)

Check if `.delegate/config.json` exists. If not, create:

```json
{}
```

If config.json already exists, do NOT overwrite it.

## Step 3: Update .gitignore

If `.gitignore` doesn't contain `.delegate/`, append:
```
# Delegate runtime files
.delegate/
```

If no `.gitignore` exists, create one with this content.

## Step 4: Update AGENTS.md

If `AGENTS.md` doesn't contain a `## Delegate` section, append:

```markdown

## Delegate

This project uses the Delegate plugin for spec-driven development.

**A loop is a focused unit of work that results in exactly one commit.** Each loop has a draft describing what to do, acceptance tests for verification, and a clear scope. Loops are the fundamental unit — everything in delegate either creates loops or implements them.

**Commands:**
| Command | Purpose |
|---------|---------|
| `/dg:study [model] [theme]` | Explore codebase, produce drafts in `.delegate/loop_plans/` |
| `/dg:work [args]` | Implement loops in `.delegate/loops/` (plan, execute, test, commit) |

**Workflow:**
1. `/dg:study` — explores codebase, web, tests; produces drafts with feature proposals, implementation plans, and test approaches
2. `/dg:work plan` — review proposed drafts
3. `/dg:work 02` or `/dg:work add logout button` — implement from drafts (plan, execute, test, commit each)

Study drafts live in `.delegate/loop_plans/`. When `/dg:work` executes a draft, it creates a full loop in `.delegate/loops/` with detailed plans, implementation records, and test results.
```

If no `AGENTS.md` exists, create one with a `# AGENTS.md` header and the above content.

## Step 5: Report

```
Delegate Initialized
  .delegate/     {created|exists}
  config.json    {created|exists}
  .gitignore     {updated|already has .delegate/}
  AGENTS.md      {updated|already has delegate section}

Next: /dg:study to explore and propose, /dg:work to implement
```
