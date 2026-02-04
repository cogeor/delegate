# Delegate

A coding-agent plugin that splits work into two phases: **study** (explore and propose) and **work** (plan, implement, test, commit).

Study mode explores your codebase and produces drafts in `.delegate/loop_plans/`. Each draft describes a feature proposal, an implementation plan, and how to test it. Work mode takes a draft, builds a full plan with example code, implements it, runs tests, and commits — all in `.delegate/loops/`.

## Example: Adding `--verbose` to a CLI tool

```
# 1. Study the codebase with a theme
/dg:study cli flags

# Study mode runs 5-phase cycles: [T]emplate, [I]ntrospect, [R]esearch, [F]lect, [V]erify
# After a few iterations, it produces drafts like:
#   .delegate/loop_plans/20260204-140000-plan-session/
#     01-verbose-flag.md      <- "Add --verbose flag to enable debug logging"
#     02-flag-validation.md   <- "Add unknown-flag error handling"
#     OVERVIEW.md
#     ITERATIONS.md

# 2. Review what was proposed
/dg:work plan
# Loop 01: Add --verbose flag to enable debug logging [proposed]
# Loop 02: Add unknown-flag error handling             [proposed]

# 3. Implement the first draft
/dg:work 01

# Work mode creates a full loop in .delegate/loops/:
#   .delegate/loops/20260204-141500-verbose-flag/
#     DRAFT.md            <- copied from the study draft
#     PLAN.md             <- detailed plan with code examples
#     IMPLEMENTATION.md   <- what was actually changed
#     TEST.md             <- test results
#     STATUS.md           <- phase: complete
#
# Then commits:
#   feat(cli): add --verbose flag for debug logging

# 4. Or implement directly from a prompt (no study needed)
/dg:work add --help flag with usage examples
```

## Install

**Prerequisites:** Node.js 18+, one supported coding-agent CLI (Claude CLI or Codex CLI)

```bash
git clone <repo-url> && cd delegate
npm install && npm run build

# Claude
npx delegate-claude install

# Codex
npx delegate-codex install

# Or specify explicitly
npx delegate-agent install claude
npx delegate-agent install codex
```

Restart your coding agent, then initialize delegate in your project:

```
/dg:init
```

This creates `.delegate/`, updates `.gitignore`, and adds usage docs to `AGENTS.md`.

### Uninstall

```bash
npx delegate-claude uninstall
npx delegate-codex uninstall
```

## Commands

```bash
/dg:study                     # Explore codebase, produce drafts
/dg:study sonnet testing      # Study with specific model and theme
/dg:work plan                 # List unimplemented drafts
/dg:work 01                   # Implement a specific draft
/dg:work add dark mode        # Implement directly from a prompt
/dg:init                      # Initialize delegate in a project
```

## How It Works

```
 /dg:study                          /dg:work
     |                                  |
     v                                  v
 dg-study-planner               dg-planner
 (explore, propose)             dg-executor
     |                          dg-tester
     v                                  |
 .delegate/loop_plans/                  v
   drafts (proposals)          .delegate/loops/
                                 full implementations
                                 + git commit
```

**Study** is read-only. It explores the codebase in 5-phase cycles and writes drafts — one per iteration. Each draft contains a feature proposal, implementation plan, and test approach. Study never modifies source code or commits.

**Work** is the execution engine. It takes a draft (or a prompt), creates a detailed plan with code examples, spawns agents to implement and test, then commits. One loop = one commit.

## Project Structure

```
commands/dg/         # Slash commands (study, work, init)
agents/              # Agent definitions (planner, executor, tester, study-planner, doc-generator)
bin/                 # CLI installer scripts
.claude-plugin/      # Plugin manifest
```

## Development

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode
npm test             # Run tests
```

## License

MIT
