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
mkdir -p .delegate/tasks .delegate/results .delegate/loops .delegate/loop_plans
```

## Step 2: Create config.json (if missing)

Check if `.delegate/config.json` exists. If not, create:

```json
{
  "daemon": {
    "provider": "claude",
    "model": "haiku",
    "plan_timeout_minutes": 5,
    "token_budget_per_hour": 10000,
    "auto_plan": {
      "enabled": false,
      "model": "haiku",
      "max_iterations": 10,
      "prompt": null
    }
  },
  "watch": {
    "patterns": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    "ignore": ["node_modules", "dist", ".git", ".delegate"]
  },
  "docs": {
    "enabled": true,
    "patterns": ["src/**/*.ts", "src/**/*.tsx"],
    "ignore": ["**/*.test.ts", "**/*.spec.ts", "**/types.ts"]
  }
}
```

If config.json already exists, do NOT overwrite it.

## Step 3: Update .gitignore

If `.gitignore` doesn't contain `.delegate/`, append:
```
# Delegate runtime files
.delegate/
```

If no `.gitignore` exists, create one with this content.

## Step 4: Update CLAUDE.md

If `CLAUDE.md` doesn't contain a `## Delegate Plugin` section, append:

```markdown

## Delegate Plugin

This project uses the Delegate plugin for spec-driven development.

**Commands:**
| Command | Purpose |
|---------|---------|
| `/dg:status` | Show daemon and plan status |
| `/dg:study [model] [theme]` | Enter study mode |
| `/dg:do [args]` | Start plan/implement/test loop |
| `/dg:init` | Initialize delegate in project |

**Configuration** (`.delegate/config.json`):
- `daemon.model`: Default model (haiku/sonnet/opus)
- `daemon.auto_plan.enabled`: Auto-start plan when idle
- `daemon.token_budget_per_hour`: Hourly token limit
- `watch.patterns`: File patterns to watch
```

If no `CLAUDE.md` exists, create one with a `# CLAUDE.md` header and the above content.

## Step 5: Report

```
Delegate Initialized
  .delegate/     {created|exists}
  config.json    {created|exists}
  .gitignore     {updated|already has .delegate/}
  CLAUDE.md      {updated|already has delegate section}

Next: npm run daemon, then /dg:status
```
