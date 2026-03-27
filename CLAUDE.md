# CLAUDE.md

Guidance for coding agents working with this repository.

## Delegate

Delegate is a coding-agent plugin for spec-driven development.

**Core philosophy:** Humans write plan drafts, agents write self-cleaning code.

## Commands

| Command | Purpose |
|---------|---------|
| `/dg:study [model] [theme]` | SITR cycles → TASKs in `.delegate/study/` |
| `/dg:work {stump}` | Execute TASK → loops in `.delegate/work/` |
| `/dg:doc` | Generate/update project docs in `.delegate/doc/` |

## Workflow

```
/dg:study auth        →  .delegate/study/20240115-143022-auth/
                          ├── S.md, I.md, T.md (optional)
                          └── TASK.md (always)

/dg:work 20240115-143022-auth  →  .delegate/work/20240115-143030-auth/
                                   ├── TASK.md
                                   ├── LOOPS.yaml
                                   ├── 01/PLAN.md, IMPLEMENTATION.md, TEST.md
                                   └── 02/...
```

## Output Structure

```
.delegate/
├── study/
│   └── {stump}/           # SITR cycle
│       ├── S.md, I.md, T.md (optional)
│       └── TASK.md        # Review (always)
├── work/
│   └── {stump}/           # Task execution
│       ├── TASK.md, LOOPS.yaml
│       ├── 01/            # Loop 1
│       └── 02/            # Loop 2
├── templates/             # Cloned repos, patterns
└── doc/                   # Auto-generated docs
```

## Project Structure

```
commands/dg/         # Slash commands (study, work, init, doc)
agents/study/        # Study agents (search, introspect, template, review)
agents/work/         # Work agents (planner, implementer, tester, doc-generator)
skills/              # Handoff formats (study-handoffs, work-handoffs)
bin/                 # CLI installer scripts
```

## Study Configuration (Optional)

Add to your project's CLAUDE.md:

```markdown
## Delegate Study

allow-template-cloning: true
```

Enables [S] phase to clone reference repos to `.delegate/templates/`.
