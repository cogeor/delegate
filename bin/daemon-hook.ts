#!/usr/bin/env node
/**
 * SessionStart hook for Claude Code.
 * Starts the dreamstate daemon if not already running.
 * Must be fast - detaches daemon and exits immediately.
 */

import { existsSync, readFileSync } from 'fs';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Get workspace from CWD (Claude Code runs hooks in workspace)
const workspace = process.cwd();
const pidFile = join(workspace, '.dreamstate', 'daemon.pid');

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function main(): void {
  // Check if daemon already running
  if (existsSync(pidFile)) {
    try {
      const pid = parseInt(readFileSync(pidFile, 'utf-8').trim(), 10);
      if (!isNaN(pid) && isProcessRunning(pid)) {
        console.log(`[dreamstate] Daemon running (PID: ${pid})`);
        return;
      }
      // PID file exists but process is dead - stale file
    } catch {
      // Ignore read errors
    }
  }

  // Start daemon in background
  const isWindows = process.platform === 'win32';

  const spawnOptions = {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore' as const,
    env: { ...process.env, DREAMSTATE_WORKSPACE: workspace },
    shell: isWindows, // Required for detached processes on Windows
    windowsHide: true
  };

  const daemon = isWindows
    ? spawn('npm', ['run', 'daemon'], spawnOptions)
    : spawn('npm', ['run', 'daemon'], spawnOptions);

  daemon.unref();
  console.log(`[dreamstate] Daemon started (PID: ${daemon.pid})`);
}

main();
