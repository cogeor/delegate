---
name: ds:status
description: Show dreamstate daemon and audit mode status (user)
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Display the current status of the dreamstate daemon and audit mode. Also performs a live ping test to verify daemon responsiveness.
</objective>

<instructions>
1. Perform daemon ping test (quick responsiveness check)
2. Read `.dreamstate/daemon.status` for daemon state
3. Read `.dreamstate/audit.state` for audit mode state
4. Display formatted status information
</instructions>

<execution>
## Step 1: Daemon Ping Test

1. Generate a unique task ID: `ping-{timestamp}-{random}`
2. Write ping task to `.dreamstate/tasks/{id}.json`:
   ```json
   {
     "id": "ping-{timestamp}-{random}",
     "type": "ping",
     "payload": {},
     "createdAt": "{ISO timestamp}"
   }
   ```
3. Poll `.dreamstate/results/{id}.json` every 200ms for up to 3 seconds
4. Record result: responsive (with uptime) or not responding
5. Clean up result file after reading

## Step 2: Read Status Files

1. Read `.dreamstate/daemon.status` and parse as JSON
   - Check if `lastActivity` is within last 10 seconds
   - If stale, daemon is stopped

2. Read `.dreamstate/audit.state` and parse as JSON
   - Check if `active` is true
   - Show iteration count and current loop plan

## Step 3: Count Loop Status

1. Glob for `.dreamstate/loops/*/STATUS.md`
2. For each, check if phase is "complete"
3. Calculate completed vs in-progress
</execution>

<output-format>
```
Dreamstate Status
━━━━━━━━━━━━━━━━━

Daemon:     {Running|Stopped}
  PID:      {pid}
  Uptime:   {formatted uptime}
  Ping:     {responded in Xms|not responding}
  Tasks:    {tasksProcessed} processed

Token Budget:
  Used:     {used}/{limit} tokens this hour
  Status:   {Active|Paused}
  Resets:   {minutes until reset}

Audit Mode: {Active|Inactive}
  Model:    {model if active}
  Theme:    {theme if provided, else "General exploration"}
  Iter:     {count if active}
  Plan:     {path if active}

Loops:
  Completed:  {total_complete}
  In Progress: {in_progress}

Watching:   {patterns}

Commands:
  /ds:audit [model] [theme]  - Enter audit mode
  /ds:loop                   - Run a loop
  /ds:init                   - Initialize project
```

When daemon not running:
```
Dreamstate Status
━━━━━━━━━━━━━━━━━

Daemon: Not running
  Ping: No response (daemon offline)

Start with: npm run daemon
```

When daemon not responding to ping:
```
Daemon:     Running (stale)
  PID:      {pid}
  Ping:     Not responding (may be stuck)

Troubleshooting:
  - Check if daemon process is running: ps aux | grep daemon
  - Restart daemon: npm run daemon
```

When token budget paused:
```
Token Budget: PAUSED
  Used: {used}/{limit} tokens
  Operations paused until budget resets
  Manual resume: Update config or wait for hourly reset
```
</output-format>
