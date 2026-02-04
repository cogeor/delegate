# Architecture

## Overview

Delegate is a coding-agent plugin for spec-driven development. It provides slash commands and specialized agents that work within the agent's session. No background processes.

## Components

### Commands (`commands/dg/`)

| Command | Purpose |
|---------|---------|
| `/dg:study` | Explore codebase, propose implementation loops |
| `/dg:work` | Implement loops (plan, execute, test, commit) |
| `/dg:init` | Initialize delegate in a project |

### Agents (`agents/`)

| Agent | Role |
|-------|------|
| dg-study-planner | Executes one exploration iteration per study cycle |
| dg-planner | Creates detailed implementation plans from drafts |
| dg-executor | Implements a single task from a plan |
| dg-tester | Verifies implementation against plan, runs tests |
| dg-doc-generator | Generates documentation for source files |

## File Structure

```
commands/dg/         # Slash commands (study, work, init)
agents/              # Agent definitions
bin/                 # CLI installer scripts
.claude-plugin/      # Plugin manifest
src/shared/          # Internal TypeScript utilities (not part of plugin interface)
```

## State Directory (`.delegate/`)

```
.delegate/
├── config.json      # Project configuration
├── plan.state       # Current study mode state
├── STATE.md         # Project state (focus, activity, next steps)
├── loops/           # Full loop implementations (created by /dg:work)
├── loop_plans/      # Study-generated drafts (proposals from /dg:study)
├── templates/       # Loop templates (optional)
└── docs/            # Generated documentation (optional, from dg-doc-generator)
```

## Workflow

1. **Study** (`/dg:study`) -- Explores codebase in 5-phase cycles [T]emplate, [I]ntrospect, [R]esearch, [F]lect, [V]erify. Produces drafts in `.delegate/loop_plans/` with feature proposals, implementation plans, and test approaches.
2. **Work** (`/dg:work`) -- Implements loops through plan-execute-test-commit pipeline. Creates full loop records in `.delegate/loops/`. Each loop results in exactly one commit.

## Design Principles

- **Commands-only** -- No background processes. Everything runs within the agent session.
- **Provider-agnostic** -- Works with any coding agent (Claude Code, Codex, others).
- **Loop-based** -- Every change is a loop: plan, implement, test, commit.
- **Timestamp everything** -- Loop folders use YYYYMMDD-HHMMSS-slug naming.
- **File-based state** -- All state in `.delegate/` as readable files.
