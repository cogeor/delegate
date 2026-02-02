# CLAUDE.md

Guidance for Claude Code working with this repository.

## Dreamstate

Dreamstate is a Claude Code plugin with a background daemon for spec-driven development.
Inspired by get-shit-done but with a simplified workflow and reactive file-watching.

**Core philosophy:** Humans write plan drafts, agents write self-cleaning code.

For system architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).
For loop workflow and commit process, see [WORKFLOW.md](WORKFLOW.md).

## Development

**NPM Scripts:**
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run daemon       # Start daemon (dev)
npm run install:claude  # Install plugin to Claude Code
```

## Plugin Development

**Commands** (`src/plugin/commands/{namespace}/*.md`):
```yaml
---
name: ds:command-name
description: What this command does
allowed-tools:
  - Read
  - Write
  - Task
---
Command prompt content
```

**Agents** (`src/plugin/agents/*.md`):
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

**Hooks** (configured via `bin/install.ts`):
- `SessionStart`: Auto-starts daemon
- `UserPromptSubmit`: Triggers auto-audit when idle
- `SessionEnd`: Cleans up daemon on exit

## Project Structure

```
src/
├── daemon/          # Background daemon (file watcher, IPC, providers)
├── plugin/          # Claude Code plugin assets
│   ├── commands/ds/ # Slash commands
│   ├── agents/      # Agent definitions
│   └── references/  # Shared reference docs
└── shared/          # Shared types and config

bin/                 # CLI scripts (install, hooks)
```
