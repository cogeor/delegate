# Audit Types and Constraints Reference

Canonical definitions for audit mode iteration types and access constraints.

## Audit Type Cycle

Iterations follow a deterministic 4-phase cycle:
- Iteration 1, 5, 9...  → **[T] Template**
- Iteration 2, 6, 10... → **[I] Introspect**
- Iteration 3, 7, 11... → **[R] Research**
- Iteration 4, 8, 12... → **[V] Verify**

## Type Definitions

| Type | Focus | Access | Output |
|------|-------|--------|--------|
| **[T] Template** | Explore `.dreamstate/templates/` for patterns | Templates, src/ (read-only comparison) | Pattern insights, may fallback to [I] |
| **[I] Introspect** | Analyze `src/` code for improvements | src/, .arch/*.md | Code findings, improvement proposals |
| **[R] Research** | Search web for external patterns | WebSearch (1 query, max 3 results) | Cited insights from sources |
| **[V] Verify** | Run build/tests, create test files | Bash (npm run build/test), test file creation | Build/test status, new tests |

## Type [T] Fallback Rules

Template exploration may fall back to [I] Introspect when:
- No templates exist in `.dreamstate/templates/`
- Templates are stale (src/ has better implementation)
- Templates are irrelevant to session theme
- Templates offer no new insights

**Log fallback as:** `[T→I]` in the Type column

## Access Constraints by Type

### Type [T] - Template MAY access:
- `.dreamstate/templates/` - Pattern extraction
- `src/` - Comparison only (read-only)
- `.dreamstate/loop_plans/` - Planning artifacts
- `.dreamstate/loops/*/STATUS.md` - Completed loop status

### Type [I] - Introspect MAY access:
- `src/` - Source code analysis
- `.arch/*.md` - Architecture docs
- `.dreamstate/loop_plans/` - Planning artifacts

### Type [R] - Research MAY access:
- WebSearch (1 query per iteration, max 3 results)
- `.dreamstate/loop_plans/` - Context for queries

### Type [V] - Verify MAY:
- Run `npm run build` and `npm test` via Bash
- Create test files (`*.test.ts`, `*.spec.ts`)
- Read any source file for test reference

### Type [V] MUST NOT:
- Modify non-test source code
- Delete any files
- Install dependencies
- Run arbitrary shell commands

### ALL Types MUST NOT:
- Modify source code in `src/` (except [V] creating tests)
- Make unlimited WebSearch queries
- Access files outside project directories

## Output Requirements

Each iteration produces:
1. **ITERATIONS.md row** - `| {N} | {time} | {type} | {action} | {target} | {insight} |`
2. **Loop draft file** - `{NN}-{slug}.md` following loop-plan-structure.md format

**Action types:** discover, connect, refine, design, reflect, research, analyze, verify, test, fallback

## Context Limits

- Max 5 completed loops for reflection
- Max 500 KB total context per iteration
- Templates are read-only (never modify)
- Research insights must cite sources
