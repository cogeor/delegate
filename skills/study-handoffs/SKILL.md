---
name: study-handoffs
description: Output formats and folder structure for study agents
---

# Study Handoff Formats

All study output goes to `.delegate/study/`.

## Folder Structure

```
.delegate/study/
├── {YYYYMMDD-HHMMSS}-{slug}/    # Cycle folder (stump)
│   ├── THEME.md                  # Optional: session theme
│   ├── S.md                      # Search output (if ran)
│   ├── I.md                      # Introspect output (if ran)
│   ├── T.md                      # Template output (if ran)
│   └── TASK.md                   # Review output (ALWAYS)
└── ...
```

**Stump format:** `{YYYYMMDD-HHMMSS}-{slug}`
- Example: `20240115-143022-error-handling`
- Slug: lowercase, hyphens, max 30 chars

## Phase Output Files

Each phase writes ONE file to the cycle folder.

### S.md (Search)

```markdown
# Search

Created: {timestamp}

## Query

{search query used}

## Findings

1. {URL}: {key insight}
2. {URL}: {key insight}

## Cloned

- `.delegate/templates/{repo}` (if applicable)

## Proposal

{What should be done based on research}
```

### I.md (Introspect)

```markdown
# Introspect

Created: {timestamp}

## Focus

{What area of code was analyzed}

## Findings

- `{file}:{line}`: {observation}
- `{file}:{line}`: {observation}

## Proposal

{What improvement should be made}
```

### T.md (Template)

```markdown
# Template

Created: {timestamp}

## Source

{Template or repo analyzed}

## Pattern

{Pattern discovered}

## Application

{How to apply this to codebase}
```

### TASK.md (Review — ALWAYS CREATED)

```markdown
# TASK: {title}

Created: {timestamp}
Build: {OK|FAIL}
Tests: {pass}/{total}

## Summary

{1-2 sentence description}

## Context

{Consolidated from S/I/T — cite which phases ran}

Sources:
- [S] {if S.md existed}: {key finding}
- [I] {if I.md existed}: {key finding}
- [T] {if T.md existed}: {key finding}

## Objective

{Clear, measurable outcome}

## Scope

- `{path}`: {change}

## Acceptance Criteria

- [ ] {criterion}
- [ ] Build passes
- [ ] Tests pass
```

## Handoff to Work

When `/dg:work {stump}` is called:

1. Locate `.delegate/study/{stump}/`
2. If no `TASK.md` → spawn study-review to create it
3. Read `TASK.md` → create work task folder

## Key Rules

1. **One folder per cycle** — stump identifies the cycle
2. **1-4 files per folder** — depends on phases that ran
3. **TASK.md always exists** — R phase always runs
4. **Stump is the handoff key** — work references study by stump
