---
name: ds:status
description: Show dreamstate daemon and idle mode status
allowed-tools:
  - Read
---

<objective>
Display the current status of the dreamstate daemon and idle mode.
</objective>

<instructions>
1. Read `.dreamstate/daemon.status` for daemon state
2. Read `.dreamstate/idle.state` for idle mode state
3. Display formatted status information
</instructions>

<execution>
1. Read `.dreamstate/daemon.status` and parse as JSON
   - Check if `lastActivity` is within last 10 seconds
   - If stale, daemon is stopped

2. Read `.dreamstate/idle.state` and parse as JSON
   - Check if `active` is true
   - Show iteration count and current loop plan
</execution>

<output-format>
```
Dreamstate Status
━━━━━━━━━━━━━━━━━

Daemon:     {Running|Stopped}
PID:        {pid}
Uptime:     {formatted uptime}
Tasks:      {tasksProcessed} processed

Token Budget:
  Used:     {used}/{limit} tokens this hour
  Status:   {Active|Paused}
  Resets:   {minutes until reset}

Idle Mode:  {Active|Inactive}
Model:      {model if active}
Focus:      {prompt if provided, else "General exploration"}
Iterations: {count if active}
Loop Plan:  {path if active}

Watching:   {patterns}

Commands:
  /ds:idle [model] [prompt]  - Enter idle mode with optional focus
  /ds:wake                   - Stop idle mode
  /ds:loop                   - Run a loop
```

When daemon not running:
```
Dreamstate Status
━━━━━━━━━━━━━━━━━

Daemon: Not running

Start with: npm run daemon
```

When token budget paused:
```
Token Budget: PAUSED
  Used: {used}/{limit} tokens
  Operations paused until budget resets
  Manual resume: Update config or wait for hourly reset
```
</output-format>
