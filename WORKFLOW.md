# Workflow

Every implementation is a loop. One loop = one commit.

## Quick Reference

```
/dg:study auth
  → .delegate/study/20240115-143022-auth/TASK.md

/dg:work 20240115-143022-auth
  → .delegate/work/20240115-143030-auth/01/
  → git commit
```

## Study Phase

SITR cycle produces a TASK:

```
.delegate/study/{stump}/
├── S.md       # Search findings (optional)
├── I.md       # Introspect findings (optional)
├── T.md       # Template findings (optional)
└── TASK.md    # Consolidated task (always)
```

S, I, T are optional based on theme. R (review) always runs.

## Work Phase

Each loop is a numbered subfolder:

```
.delegate/work/{stump}/
├── TASK.md        # From study
├── LOOPS.yaml     # Loop breakdown
├── 01/
│   ├── PLAN.md
│   ├── IMPLEMENTATION.md
│   └── TEST.md
└── 02/
    └── ...
```

### Loop Execution

1. **Plan** — work-planner creates PLAN.md
2. **Implement** — work-implementer executes tasks
3. **Test** — work-tester verifies
4. **Commit** — orchestrator commits

```bash
git add -A
git commit -m "{type}({scope}): {description}

Implements: {stump}/01"
```

## Commit Message Format

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

**Example:**
```
feat(cli): add --verbose flag

Implements: 20240115-143030-verbose-flag/01
```

## Documentation

```
/dg:doc
  → .delegate/doc/README.md          # Folder tree + last commit
  → .delegate/doc/{path}/README.md   # Per-folder docs mirroring source
```

Incremental: only updates docs for files changed since last documented commit.

## Rules

- One loop = one commit
- Never push (user does that)
- Commit as user only (no Co-Authored-By)
- `.delegate/` is gitignored
