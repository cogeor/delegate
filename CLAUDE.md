# CLAUDE.md

Guidance for Claude Code working with this repository.

## Dreamstate

Dreamstate is a Claude Code plugin with a background daemon for spec-driven development.
Inspired by get-shit-done but with a simplified workflow and reactive file-watching.

**Core philosophy:** Humans write plan drafts, agents write self-cleaning code.

For system architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).
For loop workflow and commit process, see [WORKFLOW.md](WORKFLOW.md).

## Quick Reference

**NPM Scripts:**
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run daemon       # Start daemon (dev)
npm run install:claude  # Install plugin to Claude Code
```

**Plugin Commands:**
| Command | Purpose |
|---------|---------|
| `/ds:ping` | Test daemon connectivity |
| `/ds:status` | Show daemon and idle status |
| `/ds:idle [model]` | Enter idle mode (haiku/sonnet/opus) |
| `/ds:wake` | Stop idle mode |
| `/ds:loop [path]` | Start plan/implement/test loop |

**Agents:**
| Name | Role |
|------|------|
| `ds-coordinator` | Orchestrates loops |
| `ds-planner` | Creates implementation plans |
| `ds-executor` | Implements tasks |
| `ds-tester` | Verifies implementation |
| `ds-idle-planner` | Refines loop plans during idle |

## Plugin Development

**Commands** (`commands/{namespace}/*.md`):
```yaml
---
description: What this command does
allowed-tools:
  - Read
  - Write
  - Task
---
Command prompt content
```

**Agents** (`agents/*.md`):
```yaml
---
name: agent-name
color: cyan
allowed-tools:
  - Read
  - Grep
  - Task
---
Agent system prompt
```

**Hooks** (configure in `settings.json`):
```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node path/to/hook.js" }] }
    ]
  }
}
```

## Configuration

`.dreamstate/config.json`:
```json
{
  "daemon": {
    "idle_timeout_minutes": 5,
    "token_budget_per_hour": 10000,
    "model": "haiku"
  },
  "watch": {
    "patterns": ["**/*.ts", "**/*.tsx"],
    "ignore": ["node_modules", "dist"]
  }
}
```
