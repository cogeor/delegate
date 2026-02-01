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
- [ ] Phase 2: File-save LLM triggers
- [ ] Phase 3: Idle detection + reflection
- [ ] Phase 4: Three-phase loop (plan/implement/test)

## License

MIT
