# Dreamstate

## Mission

Dreamstate is autonomous coding infrastructure for Claude Code. It enables continuous exploration and implementation through two complementary modes:

**Audit Mode** - Claude explores your codebase, analyzes patterns, runs tests, and proposes improvements. Audits are read-only: they can create tests to validate assumptions but cannot modify source code.

**Loop Mode** - Claude implements changes from a prompt or plan. Loops are full-cycle: plan → implement → test → commit.

The core insight: **separate exploration from execution**. Audits propose, loops execute.

## Usage

> **Note:** Dreamstate is in active development. The daemon auto-starts with Claude Code sessions but some features are experimental.

```bash
# Install
npm install
npm run install:claude

# Commands
/ds:audit              # Enter audit mode (continuous exploration)
/ds:audit "theme"      # Audit with focus (e.g., "error handling")
/ds:loop "prompt"      # Plan and implement from prompt
/ds:loop plan          # Show all unimplemented loops
/ds:status             # Check daemon and audit status (includes ping)
/ds:init               # Initialize project with dreamstate
```

## Workflow

### Audit → Implement Cycle

Each feature follows this pattern:

```
1. AUDIT: Explore and analyze
   /ds:audit "user authentication"

   → Creates loop plan with proposals:
     .dreamstate/loop_plans/20260202-user-auth/
     ├── OVERVIEW.md        # Vision, baseline tests, all loops
     ├── 01-auth-patterns.md    # Analysis of existing patterns
     ├── 02-jwt-integration.md  # JWT implementation proposal
     ├── 03-session-management.md
     └── ITERATIONS.md      # Audit iteration log

2. REVIEW: Check what was proposed
   /ds:loop plan

   → Shows unimplemented loops:
     Loop 01: auth-patterns [proposed] - Analyze existing auth
     Loop 02: jwt-integration [proposed] - Add JWT support
     Loop 03: session-management [proposed] - Session handling

3. IMPLEMENT: Execute a loop
   /ds:loop 02

   → Executes the loop:
     - Planning phase → PLAN.md
     - Implementation → modifies source code
     - Testing → TEST.md
     - Commit on success

4. REPEAT: Audit again for next feature
   (interrupt current audit with Ctrl+C)
   /ds:audit "session security"
```

### Loop Plan Structure

Each loop proposal contains:

```markdown
# Loop 02: JWT Integration

## Current Test Status
- Build: passing
- Tests: 12 passing, 2 failing
- Failing: `auth.test.ts` - no JWT validation

## Problem Statement
Authentication uses session cookies, need stateless JWT.

## Implementation Spec
| File | Changes |
|------|---------|
| src/auth/jwt.ts | Create JWT utilities |
| src/middleware/auth.ts | Add JWT validation |

## Acceptance Criteria
- [ ] JWT tokens generated on login
  - Verify: `npm test -- --grep "jwt"`
  - Expected: All JWT tests pass
```

### Audit vs Loop

| Aspect | Audit Mode | Loop Mode |
|--------|------------|-----------|
| Purpose | Explore, analyze, propose | Plan, implement, commit |
| Modifies code | NO (read-only) | YES |
| Creates tests | YES (to validate assumptions) | YES |
| Runs tests | YES (to understand state) | YES (to verify implementation) |
| Output | Loop proposals with test baselines | Working code + commit |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code Session                     │
├─────────────────────────────────────────────────────────────┤
│  /ds:audit          /ds:loop           /ds:status           │
│      │                  │                   │               │
│      ▼                  ▼                   ▼               │
│  ┌─────────┐      ┌──────────┐      ┌───────────┐          │
│  │ audit   │      │ loop     │      │ status    │          │
│  │ planner │      │ executor │      │ reporter  │          │
│  └────┬────┘      └────┬─────┘      └─────┬─────┘          │
│       │                │                  │                 │
│       ▼                ▼                  ▼                 │
│  ┌──────────────────────────────────────────────┐          │
│  │           .dreamstate/ (IPC layer)           │          │
│  │  ├── daemon.status    # Daemon state         │          │
│  │  ├── audit.state      # Audit mode state     │          │
│  │  ├── tasks/           # Task queue           │          │
│  │  ├── results/         # Task results         │          │
│  │  ├── loop_plans/      # Audit proposals      │          │
│  │  └── loops/           # Executed loops       │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Dreamstate Daemon                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ File        │  │ Task        │  │ LLM         │         │
│  │ Watcher     │  │ Processor   │  │ Provider    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Components

**Plugin** (`src/plugin/`)
- Commands: `/ds:audit`, `/ds:loop`, `/ds:status`, etc.
- Agents: ds-audit-planner, ds-planner, ds-executor, ds-tester

**Daemon** (`src/daemon/`)
- File watcher: Monitors `.dreamstate/` for tasks
- IPC: JSON file-based communication
- Provider: Abstract LLM interface (Claude, future: others)

**Shared** (`src/shared/`)
- Types: Task, DaemonStatus, Config
- Config: Default settings, validation

### File Structure

```
dreamstate/
├── src/
│   ├── daemon/          # Background daemon
│   │   ├── index.ts     # Entry point
│   │   ├── ipc.ts       # File-based IPC
│   │   └── providers/   # LLM providers
│   ├── plugin/          # Claude Code plugin
│   │   ├── commands/ds/ # Slash commands
│   │   ├── agents/      # Agent definitions
│   │   └── references/  # Shared docs
│   └── shared/          # Shared code
│       ├── types.ts     # Type definitions
│       └── config.ts    # Configuration
├── bin/                 # CLI scripts
│   ├── install.ts       # Plugin installer
│   └── validate-docs.ts # Pre-commit validator
└── .dreamstate/         # Runtime state (gitignored)
    ├── loop_plans/      # Audit proposals
    ├── loops/           # Executed loops
    └── config.json      # Local config
```

## License

MIT
