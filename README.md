# Dreamstate

A Claude Code plugin with a background daemon for spec-driven development.

**Core philosophy:** Humans write plan drafts, agents write self-cleaning code.

## Quick Start

### 1. Install Dependencies

```bash
cd dreamstate
npm install
```

### 2. Install Plugin to Claude Code

```bash
npm run install:claude
```

This copies the slash commands to `~/.claude/commands/ds/`.

### 3. Start the Daemon

In a terminal (keep this running):

```bash
npm run daemon
```

You should see:

```
╔══════════════════════════════════════════╗
║         DREAMSTATE DAEMON                ║
╚══════════════════════════════════════════╝

[Daemon] Started (PID: 12345)
[Daemon] Workspace: /path/to/dreamstate
[Daemon] Ready. Waiting for tasks...
```

### 4. Test the Connection

In another terminal, start Claude Code in the same directory:

```bash
claude
```

Then run:

```
/ds:ping
```

Expected output:

```
✓ Daemon responded!
  Uptime: 1234ms
  Message: Daemon is alive!
```

## Commands

| Command | Description |
|---------|-------------|
| `/ds:ping` | Test daemon connectivity |
| `/ds:status` | Show daemon status |
| `/ds:loop` | Start plan/implement/test loop |
| `/ds:reflect` | Trigger reflection mode |

## Agents

| Agent | Role |
|-------|------|
| `ds-coordinator` | Orchestrates the three-phase loop |
| `ds-planner` | Creates detailed implementation plans from drafts |
| `ds-executor` | Implements tasks from the plan |
| `ds-tester` | Verifies implementation against plan |
| `ds-reflector` | Updates docs and proposes next steps |

## Workflow

### Running a Loop

1. Create a plan draft:
```bash
echo "Add user authentication with JWT tokens" > plan_draft.md
```

2. Run the loop:
```
/ds:loop
```

3. The coordinator will:
   - Create timestamped folder: `.dreamstate/loops/20260201-143022-add-user-auth/`
   - Run planning phase → `PLAN.md`
   - Run implementation → code changes + `IMPLEMENTATION.md`
   - Run testing → `TEST.md`
   - Commit on success

### Triggering Reflection

```
/ds:reflect
```

This runs the reflector agent which:
- Analyzes recently changed files
- Updates documentation in `.dreamstate/docs/`
- Reviews recent loop artifacts
- Updates `.dreamstate/STATE.md`
- Proposes next steps in `.dreamstate/NEXT.md`

## How It Works

```
┌─────────────────────┐     ┌─────────────────────┐
│   Claude Code       │     │  dreamstate-daemon  │
│   (user session)    │     │  (background)       │
└─────────┬───────────┘     └──────────┬──────────┘
          │                            │
          │  /ds:ping writes task      │
          ├───────────────────────────▶│
          │  .dreamstate/tasks/        │
          │                            │
          │  daemon writes result      │
          │◀───────────────────────────┤
          │  .dreamstate/results/      │
          │                            │
```

The daemon and Claude Code plugin communicate via JSON files in `.dreamstate/`:

- `daemon.pid` - Daemon process ID
- `daemon.status` - JSON with daemon state
- `tasks/` - Tasks written by plugin, consumed by daemon
- `results/` - Results written by daemon, read by plugin

## Configuration

Create `.dreamstate/config.json` to customize:

```json
{
  "daemon": {
    "idle_timeout_minutes": 5,
    "token_budget_per_hour": 10000,
    "model": "haiku"
  },
  "watch": {
    "patterns": ["**/*.ts", "**/*.tsx"],
    "ignore": ["node_modules", "dist"]
  }
}
```

## Development

```bash
# Build TypeScript
npm run build

# Run daemon in development
npm run daemon

# Install plugin
npm run install:claude
```

## Roadmap

- [x] Phase 1: Daemon + ping test
- [x] Phase 2: Three-phase loop (plan/implement/test)
- [x] Phase 3: Reflection mode (manual trigger)
- [ ] Phase 4: File-save LLM triggers (@dreamstate markers)
- [ ] Phase 5: Automatic idle detection

## License

MIT
