# CLAUDE.md

Guidance for coding agents working with this repository.

## Delegate

Delegate is a coding-agent plugin for spec-driven development.

**Core philosophy:** Humans write plan drafts, agents write self-cleaning code.

For system architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).
For loop workflow and commit process, see [WORKFLOW.md](WORKFLOW.md).

## Development

**NPM Scripts:**
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
```

## Plugin Development

**Commands** (`commands/{namespace}/*.md`):
```yaml
---
name: dg:command-name
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

## Delegate

A loop is a focused unit of work that results in exactly one commit. Each loop has a draft describing what to do, acceptance tests for verification, and a clear scope. Loops are the fundamental unit — everything in delegate either creates loops or implements them.

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

## Project Structure

```
commands/dg/         # Slash commands (study, work, init)
agents/              # Agent definitions
bin/                 # CLI installer scripts
```
