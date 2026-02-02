# Loop-Based Workflow

Every implementation task is a loop. This is mandatory, not optional.

## Quick Reference

```bash
1. mkdir .dreamstate/loops/{YYYYMMDD-HHMMSS}-{slug}
2. Create DRAFT.md, STATUS.md
3. Implement
4. npm run build
5. git add <src-files> && git commit
6. Create COMMIT.md with hash
```

## Phases

### 1. Before Implementation

Create loop folder: `.dreamstate/loops/{timestamp}-{slug}/`

Create `DRAFT.md` with task description.

Create `STATUS.md`:
```markdown
# Loop Status
Started: {timestamp}
Phase: implementing
Updated: {timestamp}

## Progress
- [ ] Implementation
- [ ] Verification
- [ ] Commit
```

### 2. During Implementation

- Update `STATUS.md` as you progress
- Keep changes focused on one logical unit
- Run tests frequently

### 3. After Implementation

1. Verify build: `npm run build`
2. Create `IMPLEMENTATION.md` documenting what was done
3. Commit (do NOT batch multiple loops):
   ```bash
   git add <changed-files>
   # Do NOT add .dreamstate/
   git commit -m "{type}({scope}): {description}

   Implements: {loop-folder-name}"
   ```
4. Update `STATUS.md`: Phase -> complete
5. Create `COMMIT.md` with commit hash

## Commit Message Format

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

**Example:**
```
feat(daemon): add token budget tracking

- Add TokenBudget type
- Create tracker class
- Integrate into daemon

Implements: 20260201-193500-token-budgeting
```

**Required:** Always include `Implements: {loop-folder}` line.

## What NOT to Do

- Implement multiple features without committing between them
- Skip creating the loop folder
- Commit `.dreamstate/` artifacts with code changes
- Forget to run `npm run build` before committing

## Why Loops?

Loops make intent explicit, progress visible, and rollback safe. Each loop is timestamped and traceable through its artifacts:

| File | Purpose | When Created |
|------|---------|--------------|
| `DRAFT.md` | Task description | Before starting |
| `STATUS.md` | Progress tracking | Before starting |
| `IMPLEMENTATION.md` | What was done | After implementation |
| `COMMIT.md` | Commit reference | After committing |
| `REFLECTION.md` | Value/quality assessment | Created during audit mode |

## Loop Reflection

After a loop completes, reflections are handled during audit mode iterations. The audit process reviews completed loops and generates REFLECTION.md files.

Reflection assesses three dimensions (1-5 scale):

| Dimension | Question |
|-----------|----------|
| **Value** | Did this add meaningful value? |
| **Quality** | Is the implementation clean and maintainable? |
| **Coverage** | Are critical paths tested? |

Check reflection status with `/ds:status`:
```
Loops:
  Completed:  14
  In Progress: 2
```

Reflections catch silent failures and improve future loops.
