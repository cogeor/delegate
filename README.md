# Delegate

A coding-agent plugin for spec-driven development. Splits work into two phases: **study** (explore and specify) and **work** (plan, implement, test). Work is done in loops, each handled by a separate sub-agent. Delegate will split work into modular testable work packages, document, test, and commit them automatically when implemented.

**~1650 lines of markdown.** As minimal as possible.

## Philosophy

**Humans write and read plan drafts, agents write self-documenting code.**

| Plan first, then implement | No code changes without a plan |
| Markdown is code | Specs, plans, and docs are first-class artifacts |
| One loop = one commit | Atomic, traceable changes |
| Transparent workflow | All state visible in `.delegate/` as readable files |

## Quick Start

```bash
# 1. Study a theme (runs 5 cycles by default, 2 here) → produces TASKs
/dg:study 2 implement auth for this project look for git repos with a similar stack and best practices.

# 2. Execute any task (will look in .delegate/study for a task with this name) → loops with commits
/dg:work auth delegate task

# Or work directly from a prompt
/dg:work add retry logic to API calls
```

## Commands

| Command | Purpose |
|---------|---------|
| `/dg:init` | Initialize delegate in project |
| `/dg:study [model] [N] [theme]` | Run up to N SITR cycles (default 5) → TASKs |
| `/dg:work {stump}` | Execute study TASK → loops → commits |
| `/dg:work plan {prompt}` | Plan only, no execution |
| `/dg:work {prompt}` | Plan + execute from prompt |
| `/dg:doc` | Generate/update project docs in `.delegate/doc/` |

**Examples:** `/dg:study` (5 cycles default), `/dg:study 10`, `/dg:study opus 3 auth`

## Study Loop: SITR

The study phase explores a theme before proposing solutions. Runs up to N cycles (default 5), each producing a TASK.md proposal. Intended for less expensive models running for long periods — users review the generated TASKs and decide which to implement.

Study is composed of four phases, three optional:

| Phase | Name | Purpose |
|-------|------|---------|
| **S** | Search | Web research for patterns and best practices, can also clone repositories for Template phase |
| **I** | Introspect | Analyze source code for issues, gaps, improvements |
| **T** | Template | Explore template repos for applicable patterns |
| **R** | Review | Consolidate findings into actionable TASK.md *(always runs)* |

**Theme-driven selection:**
- `test`, `coverage` → I → R
- `pattern`, `template` → T → R
- `research`, `compare` → S → R
- `refactor`, `improve` → I → R
- No theme → S → I → T → R (all phases)

**Output:** `.delegate/study/{stump}/TASK.md`

## Work Cycle: Loops

The work phase splits tasks from study sessions or user prompts into loops, which represent units of testable work. Each loop = one commit.

```
TASK.md → LOOPS.yaml → Loop 01 → Loop 02 → ...
                          │
                    ┌──────────────────────┐
                    │  PLAN.md             │  ← what to do
                    │  IMPLEMENTATION.md   │  ← what was done
                    │  TEST.md             │  ← verification
                    └──────────┬───────────┘
                               │
                          git commit
```

**Four specialized agents:**

| Agent | Role | Constraint |
|-------|------|------------|
| Planner | Breaks TASK into loops, writes PLAN.md | Read-only, cannot execute |
| Implementer | Executes plan, writes IMPLEMENTATION.md | Only touches files in plan |
| Tester | Verifies work, writes TEST.md | Reports only, does not fix |
| Doc-generator | Updates `.delegate/doc/` post-commit | Non-blocking |

**Quality gate:** Commit only happens when TEST.md shows "Ready for Commit: yes"

## Output Structure

```
.delegate/
├── study/{stump}/     # SITR outputs → TASK.md
├── work/{stump}/      # Loops → commits
│   ├── LOOPS.yaml
│   └── 01/, 02/...
├── templates/         # Cloned reference repos
└── doc/               # Auto-generated docs
```

## Install

**Prerequisites:** Node.js 18+, Claude Code CLI

```bash
git clone <repo-url> && cd delegate
npm install
npx delegate-claude install

# Restart Claude Code, then in your project:
/dg:init
```

**Uninstall:** `npx delegate-claude uninstall`

## License

MIT
