# Loop Plan Structure Reference

This document defines the canonical structure for loop plans created by audit mode and ds:loop.

## Loop Types

| Type | Source | Can Modify Code | Can Create Tests | Purpose |
|------|--------|-----------------|------------------|---------|
| Audit Loop | ds:audit iterations | NO | YES | Exploration, analysis, proposals |
| Implementation Loop | ds:loop "prompt" | YES | YES | Plan and execute changes |

**Key distinction:**
- Dream loops are **proposals** - they analyze code, run tests to verify assumptions, but cannot modify source code
- Implementation loops **execute** - they plan, implement, test, and commit

## Loop Plan Folder Structure

```
.dreamstate/loop_plans/{timestamp}-{slug}/
├── OVERVIEW.md          # Vision, all loops table, dependencies
├── THEME.md             # Optional: overarching theme for audit sessions
├── ITERATIONS.md        # Iteration log (audit mode only)
├── 01-{slug}.md         # Loop 01 detailed plan
├── 02-{slug}.md         # Loop 02 detailed plan
├── ...
└── LOOPS.yaml           # Optional: machine-readable manifest
```

## Individual Loop File Structure

Each loop file (`{NN}-{slug}.md`) MUST contain these sections:

### Required Sections

```markdown
# Loop {NN}: {Title}

## Status
- Type: {audit|implementation}
- Created: {timestamp}
- Status: {proposed|in_progress|complete|failed}

## Current Test Status (BEFORE implementation)

**Run these commands to see current state:**
```bash
npm run build    # Build status
npm test         # Test status
```

**Current state:**
- Build: {passing|failing} - {details if failing}
- Tests: {X passing, Y failing, Z skipped}
- Relevant failing tests:
  - `{test name}`: {why it fails, what it reveals}
  - `{test name}`: {why it fails, what it reveals}

**What these failures indicate:**
{Analysis of what the failing tests reveal about the problem to solve}

## Context
{What exists now - relevant files, current patterns, current behavior}

## Problem Statement
{What specific problem does this loop solve?}

## Objective
{What needs to be accomplished - measurable outcome}

## Implementation Spec

### Files to Modify
| File | Current State | Changes Required |
|------|---------------|------------------|
| {path} | {what it does now} | {what to change} |

### Files to Create
| File | Purpose | Key Exports |
|------|---------|-------------|
| {path} | {why needed} | {public API} |

### Implementation Steps
1. {Step with specific file and change}
2. {Step with specific file and change}
3. ...

## Acceptance Criteria

**All criteria must be testable. Include the command to verify each.**

- [ ] **{Criterion 1}**
  - Verify: `{command or file check}`
  - Expected: {what success looks like}

- [ ] **{Criterion 2}**
  - Verify: `{command or file check}`
  - Expected: {what success looks like}

## Test Plan

### Tests to Create (Dream loops)
Dream loops CAN create test files to validate assumptions:
- `{test-file}.test.ts`: Tests {what behavior}

### Tests to Run (All loops)
```bash
{specific test commands}
```

### Expected Post-Implementation Test Status
- Build: passing
- Tests: {X passing, 0 failing}
- New tests added: {list}

## Dependencies
- Depends on: {Loop NN} - {why}
- Blocks: {Loop NN} - {why}

## Risks and Mitigations
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| {risk} | {low|medium|high} | {how to address} |
```

## OVERVIEW.md Structure

```markdown
# Loop Plan: {Name}

Created: {timestamp}
Type: {audit|implementation}
Theme: {optional overarching theme}

## Vision
{What this loop plan aims to achieve - 2-3 sentences}

## Current Baseline

**Project health before this plan:**
```bash
npm run build && npm test
```

- Build: {status}
- Tests: {X passing, Y failing}
- Key issues: {what needs fixing}

## Implementation Loops

| # | Name | Type | Status | Dependencies | Acceptance Criteria Summary |
|---|------|------|--------|--------------|----------------------------|
| 01 | {name} | {audit|impl} | {proposed|complete} | — | {one-liner} |
| 02 | {name} | {audit|impl} | proposed | 01 | {one-liner} |

## Dependencies Graph

```
01 ──→ 02 ──→ 04
        ↓
       03
```

## Success Metrics

**This plan is complete when:**
1. All loops marked complete
2. Build passes: `npm run build`
3. All tests pass: `npm test`
4. {Additional project-specific criteria}
```

## Audit Loop Constraints

Dream loops (from ds:audit) have these restrictions:

### CAN Do:
- Read any source file
- Analyze code patterns
- Run `npm run build` to verify code compiles
- Run `npm test` to see test status
- Create test files (`*.test.ts`, `*.spec.ts`)
- Create loop plan proposals
- Update OVERVIEW.md and loop draft files

### CANNOT Do:
- Modify source code in `src/`
- Delete any files
- Install dependencies
- Commit changes
- Execute implementation

### Test Creation Rules
Dream loops MAY create tests to:
1. Verify assumptions about current behavior
2. Document expected behavior for future implementation
3. Highlight bugs or issues (failing tests are valuable!)

Tests created by audit loops should:
- Be placed in appropriate test directories
- Follow existing test patterns
- Include comments explaining intent
- May intentionally fail to highlight problems

## Implementation Loop Flow

Implementation loops (from ds:loop) follow this flow:

1. **Plan Phase** (ds-planner)
   - Reads DRAFT.md
   - Creates detailed PLAN.md with tasks

2. **Implement Phase** (ds-executor)
   - Executes each task
   - Modifies source code
   - Creates IMPLEMENTATION.md

3. **Test Phase** (ds-tester)
   - Verifies implementation matches plan
   - Runs tests
   - Checks acceptance criteria
   - Creates TEST.md with quality scores

4. **Commit Phase** (ds:loop command)
   - If tests pass, commits changes
   - Creates COMMIT.md with hash

## Quality Scores

All loops should track these scores (1-5 scale):

| Score | Value | Implementation | Test Coverage |
|-------|-------|----------------|---------------|
| 1 | No value / busywork | Broken / bloated | No tests |
| 2 | Marginal value | Major issues | Unit tests only |
| 3 | Useful | Some issues | Basic coverage |
| 4 | Important | Good quality | Integration tests |
| 5 | Critical | Excellent | Full coverage |

## Completion Criteria

A loop is **complete** when:
1. All acceptance criteria verified (checkboxes checked)
2. Build passes
3. All tests pass (or failing tests are intentional/documented)
4. Quality scores are 3+ in all categories
5. (Implementation loops only) Commit created
