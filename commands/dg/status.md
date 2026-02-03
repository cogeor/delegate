---
name: dg:status
description: Show delegate daemon and plan mode status (user)
allowed-tools:
  - Read
  - Write
  - Bash
---

# /dg:status - Show Delegate Status

Read status files and display a formatted summary. Do not modify anything.

## Step 1: Ping Daemon

1. Write a ping task to `.delegate/tasks/ping-{timestamp}.json`:
   ```json
   {"id": "ping-{timestamp}", "type": "ping", "payload": {}, "createdAt": "{ISO}"}
   ```
2. Poll `.delegate/results/ping-{timestamp}.json` every 200ms, up to 3 seconds
3. Record: responsive (with latency) or not responding
4. Clean up the result file

## Step 2: Read Status

1. Read `.delegate/daemon.status` — if `lastActivity` is stale (>10s), daemon is stopped
2. Read `.delegate/plan.state` — check if plan mode is active

## Step 3: Count Loops

1. Glob `.delegate/loops/*/STATUS.md`
2. Count completed vs in-progress

## Step 4: Display

```
Delegate Status
===============

Daemon:     {Running|Stopped}
  PID:      {pid}
  Uptime:   {uptime}
  Ping:     {Xms|not responding}

Token Budget:
  Used:     {used}/{limit} this hour
  Status:   {Active|Paused}

Plan Mode:  {Active|Inactive}
  Model:    {model}
  Theme:    {theme}
  Iter:     {count}

Loops:      {completed} complete, {in_progress} in progress

Commands:
  /dg:study [model] [theme]  - Enter study mode
  /dg:do                    - Run a do loop
  /dg:init                  - Initialize project
```

If daemon not running, show minimal output with `npm run daemon` hint.
