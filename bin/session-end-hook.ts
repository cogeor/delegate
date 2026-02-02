#!/usr/bin/env node
/**
 * SessionEnd hook for Claude Code.
 * Kills the dreamstate daemon when the session ends.
 */

import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

// Get workspace from CWD (Claude Code runs hooks in workspace)
const workspace = process.cwd();
const pidFile = join(workspace, '.dreamstate', 'daemon.pid');

function main(): void {
  if (!existsSync(pidFile)) {
    return; // No daemon running
  }

  try {
    const pid = parseInt(readFileSync(pidFile, 'utf-8').trim(), 10);
    if (isNaN(pid)) {
      return;
    }

    // Try to kill the daemon process
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`[dreamstate] Daemon stopped (PID: ${pid})`);
    } catch (err: any) {
      if (err.code !== 'ESRCH') {
        // ESRCH means process doesn't exist - that's fine
        console.error(`[dreamstate] Failed to stop daemon: ${err.message}`);
      }
    }

    // Clean up PID file
    try {
      unlinkSync(pidFile);
    } catch {
      // Ignore cleanup errors
    }
  } catch {
    // Ignore read errors
  }
}

main();
