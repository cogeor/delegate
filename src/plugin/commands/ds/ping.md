---
description: Test connection to dreamstate daemon
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Test that the dreamstate daemon is running and responsive.
</objective>

<instructions>
1. Generate a unique task ID using timestamp and random suffix
2. Write a ping task to `.dreamstate/tasks/{id}.json`
3. Poll for result in `.dreamstate/results/{id}.json` (max 5 seconds)
4. Report daemon status or troubleshooting steps
</instructions>

<execution>
First, create the task file. Use this exact JSON structure:

```json
{
  "id": "ping-{timestamp}-{random}",
  "type": "ping",
  "payload": {},
  "createdAt": "{ISO timestamp}"
}
```

Write it to `.dreamstate/tasks/{id}.json`.

Then poll `.dreamstate/results/{id}.json` every 200ms for up to 5 seconds.

If result found:
- Parse the JSON
- Extract `result.uptime` and `result.message`
- Delete the result file (cleanup)
- Report success with uptime

If no result after 5 seconds:
- Check if `.dreamstate/daemon.pid` exists
- If PID file exists: "Daemon may be stuck (PID: {pid}). Try restarting."
- If no PID file: "Daemon not running. Start with: npm run daemon"
</execution>

<output-format>
On success:
```
✓ Daemon responded!
  Uptime: {formatted uptime}
  Message: {message}
```

On failure:
```
✗ Daemon not responding
  {troubleshooting message}
```
</output-format>
