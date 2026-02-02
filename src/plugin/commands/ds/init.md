---
name: ds:init
description: Initialize dreamstate in current project (user)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
---

<objective>
Initialize dreamstate in the current project by creating the `.dreamstate/` directory structure, config file, updating CLAUDE.md, and ensuring .gitignore excludes runtime files.
</objective>

<what-gets-created>
```
project/
├── CLAUDE.md              # Updated with dreamstate instructions
├── .gitignore             # Updated to exclude .dreamstate/
└── .dreamstate/
    ├── config.json        # Default configuration
    ├── tasks/             # IPC task queue (daemon)
    ├── results/           # IPC task results (daemon)
    ├── loops/             # Executed loop artifacts
    └── loop_plans/        # Audit proposals and plans
```
</what-gets-created>

<execution>
## Step 1: Create .dreamstate/ directory structure

Create the following directories using Bash:
```bash
mkdir -p .dreamstate/tasks .dreamstate/results .dreamstate/loops .dreamstate/loop_plans
```

## Step 2: Create config.json (if not exists)

Check if `.dreamstate/config.json` exists using Glob. If not, create it with default config using Write:

```json
{
  "daemon": {
    "provider": "claude",
    "model": "haiku",
    "audit_timeout_minutes": 5,
    "token_budget_per_hour": 10000,
    "auto_audit": {
      "enabled": false,
      "model": "haiku",
      "max_iterations": 10,
      "prompt": null
    }
  },
  "watch": {
    "patterns": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    "ignore": ["node_modules", "dist", ".git", ".dreamstate"]
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

Check if `.gitignore` exists and contains `.dreamstate/`:
1. Use Glob to check if .gitignore exists
2. If exists, use Read to check contents for `.dreamstate`
3. If .gitignore doesn't exist: use Write to create it with `.dreamstate/`
4. If .gitignore exists but doesn't have `.dreamstate/`: use Edit to append it
5. If already has `.dreamstate/`: skip

Content to add (if needed):
```
# Dreamstate runtime files
.dreamstate/
```

## Step 4: Update CLAUDE.md

Check if `CLAUDE.md` exists in project root:
1. Use Glob to check if CLAUDE.md exists
2. If exists, use Read to check for "## Dreamstate Plugin"
3. If exists and already has dreamstate section: skip
4. If exists but no dreamstate section: use Edit to append
5. If doesn't exist: use Write to create with header + content

### Dreamstate content to append to CLAUDE.md:

```markdown

## Dreamstate Plugin

This project uses the Dreamstate plugin for spec-driven development.

**Commands:**
| Command | Purpose |
|---------|---------|
| `/ds:status` | Show daemon and audit status (includes ping) |
| `/ds:audit [model] [theme]` | Enter audit mode (haiku/sonnet/opus) |
| `/ds:loop [args]` | Start plan/implement/test loop |
| `/ds:init` | Initialize dreamstate in project |

**Agents:**
| Name | Role |
|------|------|
| `ds-planner` | Creates implementation plans |
| `ds-executor` | Implements tasks |
| `ds-tester` | Verifies implementation |
| `ds-audit-planner` | Explores and plans during audit mode |
| `ds-doc-generator` | Generates documentation during audit mode |

**Configuration** (`.dreamstate/config.json`):
- `daemon.model`: Default model for daemon tasks (haiku/sonnet/opus)
- `daemon.auto_audit.enabled`: Auto-start audit when idle (default: false)
- `daemon.token_budget_per_hour`: Hourly token limit (default: 10000)
- `watch.patterns`: File patterns to watch for changes
- `docs.enabled`: Enable documentation generation

**Directory Structure** (`.dreamstate/`):
- `config.json` - Configuration
- `loops/` - Executed loop artifacts
- `loop_plans/` - Audit proposals and implementation plans
- `tasks/`, `results/` - IPC with daemon (auto-managed)
```

### If CLAUDE.md doesn't exist, create with:

```markdown
# CLAUDE.md

Project instructions for Claude Code.

## Dreamstate Plugin

... (rest of content from above)
```
</execution>

<output-format>
On success (fresh install):
```
Dreamstate Initialized

✓ Created .dreamstate/
  ├── config.json
  ├── tasks/
  ├── results/
  ├── loops/
  └── loop_plans/

✓ Updated .gitignore
✓ Updated CLAUDE.md

Next steps:
  1. Start daemon: npm run daemon (in dreamstate project)
  2. Check status: /ds:status
  3. Enter audit mode: /ds:audit
```

On success (already partially initialized):
```
Dreamstate Initialized

✓ .dreamstate/ directory exists
✓ config.json exists (preserved)
✓ Updated .gitignore
✓ Updated CLAUDE.md

Next steps:
  1. Check status: /ds:status
```

Already fully initialized:
```
Dreamstate already initialized

  .dreamstate/     ✓ exists
  config.json      ✓ exists
  .gitignore       ✓ has .dreamstate/
  CLAUDE.md        ✓ has dreamstate section

Run /ds:status to check daemon connection.
```
</output-format>

<idempotent>
This command is idempotent - safe to run multiple times:
- Directories: created only if missing
- config.json: created only if missing (never overwrites user config)
- .gitignore: line added only if missing
- CLAUDE.md: section added only if missing
</idempotent>
