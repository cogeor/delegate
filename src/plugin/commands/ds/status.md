---
description: Show dreamstate daemon status
allowed-tools:
  - Read
---

<objective>
Display the current status of the dreamstate daemon.
</objective>

<instructions>
1. Read `.dreamstate/daemon.status`
2. If file doesn't exist or is stale (>10s old), daemon is not running
3. Display formatted status information
</instructions>

<execution>
Read the file `.dreamstate/daemon.status` and parse as JSON.

Check if `lastActivity` timestamp is within the last 10 seconds. If older, the daemon has stopped.

Format uptime as human-readable (e.g., "2 minutes, 34 seconds" or "1 hour, 5 minutes").
</execution>

<output-format>
When running:
```
Dreamstate Daemon Status
========================
Status:     Running
PID:        {pid}
Uptime:     {formatted uptime}
Started:    {startedAt}
Last Active: {lastActivity}

Watching:   {patterns joined with ", "}
Tasks:      {tasksProcessed} processed
```

When not running:
```
Dreamstate Daemon Status
========================
Status: Not running

Start the daemon with:
  npm run daemon
```
</output-format>
