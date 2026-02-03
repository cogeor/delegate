# Delegate

Autonomous coding infrastructure for Claude Code. Humans write plan drafts, agents write self-cleaning code.

## How It Works

**Study Mode** (`/dg:study`) - Claude continuously explores your codebase, analyzes patterns, runs tests, and proposes improvements. Plans are read-only: they can create tests but cannot modify source code.

**Do Mode** (`/dg:do`) - Claude implements changes from a prompt or plan. Full-cycle: plan, implement, test, commit.

Separate exploration from execution. Plans propose, do executes.

## Install

**Prerequisites:** Node.js 18+, Claude Code CLI

```bash
git clone <repo-url> && cd delegate
npm install && npm run build
npx delegate-claude install
```

The installer copies commands, agents, and hooks into `~/.claude/` where Claude Code discovers them automatically. No marketplace or plugin registration required.

Restart Claude Code, then verify:

```
/dg:status
```

### Uninstall

```bash
npx delegate-claude uninstall
```

## Commands

```bash
/dg:study                   # Enter study mode (continuous exploration)
/dg:study sonnet testing     # Study with model and focus theme
/dg:do "add dark mode"     # Plan then implement from prompt
/dg:do plan                # Show all unimplemented loops
/dg:do 02                  # Execute specific loop from plan
/dg:status                 # Check daemon and plan status
/dg:init                   # Initialize delegate in a project
```

## Workflow

```
1. PLAN: Explore and analyze
   /dg:study user authentication
   -> Creates loop plan with proposals in .delegate/loop_plans/

2. REVIEW: Check what was proposed
   /dg:do plan
   -> Shows unimplemented loops

3. DO: Execute a loop
   /dg:do 02
   -> Plans, implements, tests, commits

4. REPEAT
```

## Architecture

```
Claude Code Session
+------------------------------------------+
|  /dg:study    /dg:do      /dg:status     |
|      |            |            |          |
|      v            v            v          |
|  plan         do           status         |
|  planner      executor     reporter       |
|      |            |            |          |
|      v            v            v          |
|  .delegate/ (IPC layer)                   |
|  +-- daemon.status                        |
|  +-- plan.state                           |
|  +-- tasks/       results/                |
|  +-- loop_plans/  loops/                  |
+------------------------------------------+
               |
               v
Delegate Daemon (background)
  File Watcher | Task Processor | LLM Provider
```

### Components

**Plugin** - Commands (`/dg:*`), agents (dg-planner, dg-executor, dg-tester, dg-study-planner), hooks (session lifecycle)

**Daemon** - File watcher, task processor, idle detection, token budget, LLM provider interface

**Shared** - Types, config, state management

## Development

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode
npm run daemon       # Start daemon manually
npm test             # Run tests
```

## License

MIT
