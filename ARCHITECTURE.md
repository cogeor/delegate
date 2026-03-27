# Architecture

## Overview

Delegate is a coding-agent plugin for spec-driven development. It provides slash commands and specialized agents that work within the agent's session. No background processes.

## Components

### Commands (`commands/dg/`)

| Command | Purpose |
|---------|---------|
| `/dg:study` | SITR cycles → TASKs |
| `/dg:work` | Execute TASKs → loops → commits |
| `/dg:init` | Initialize delegate in a project |
| `/dg:doc` | Generate/update project docs in `.delegate/doc/` |

### Agents

**Study** (`agents/study/`):
| Agent | Role |
|-------|------|
| study-search | Web research, clone repos |
| study-introspect | Analyze source code |
| study-template | Explore templates |
| study-review | Consolidate → TASK |

**Work** (`agents/work/`):
| Agent | Role |
|-------|------|
| work-planner | TASK → LOOPS.yaml, loop → PLAN.md |
| work-implementer | Execute tasks from PLAN.md |
| work-tester | Verify implementation |
| work-doc-generator | Generate docs post-commit |

## Project Structure

```
commands/dg/         # Slash commands (init, study, work, doc)
agents/study/        # Study agents
agents/work/         # Work agents
skills/              # Handoff formats
bin/                 # CLI installer scripts
```

## State Directory (`.delegate/`)

```
.delegate/
├── study/           # Study outputs
│   └── {stump}/     # One folder per SITR cycle
│       ├── S.md     # Search (optional)
│       ├── I.md     # Introspect (optional)
│       ├── T.md     # Template (optional)
│       └── TASK.md  # Review (always)
├── work/            # Work outputs
│   └── {stump}/     # One folder per task
│       ├── TASK.md
│       ├── LOOPS.yaml
│       ├── 01/      # Loop 1
│       └── 02/      # Loop 2
├── templates/       # Cloned repos, patterns
└── doc/             # Auto-generated docs
```

**Stump format:** `{YYYYMMDD-HHMMSS}-{slug}`

## Workflow

1. **Study** (`/dg:study`) — SITR cycles: [S]earch, [I]ntrospect, [T]emplate, [R]eview. S/I/T optional based on theme, R always runs. Produces TASK.md.

2. **Work** (`/dg:work {stump}`) — Reads TASK from study, breaks into loops, implements each, commits. One loop = one commit.

## Design Principles

- **Commands-only** — No background processes
- **Provider-agnostic** — Works with any coding agent
- **Loop-based** — Every change is a loop: plan, implement, test, commit
- **File-based state** — All state in `.delegate/` as readable files
- **Stump-based linking** — Study and work linked by stump identifier
