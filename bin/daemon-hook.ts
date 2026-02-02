#!/usr/bin/env node
/**
 * SessionStart hook for Claude Code.
 * Starts the dreamstate daemon if not already running.
 * Must be fast - detaches daemon and exits immediately.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { spawn, execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Get workspace from CWD (Claude Code runs hooks in workspace)
const workspace = process.cwd();
const dreamstateDir = join(workspace, '.dreamstate');
const pidFile = join(dreamstateDir, 'daemon.pid');

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function main(): void {
  ensureDir(dreamstateDir);

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

  // Path to the daemon entry point
  const daemonScript = join(projectRoot, 'dist', 'daemon', 'index.js');

  if (!existsSync(daemonScript)) {
    console.error(`[dreamstate] Daemon script not found: ${daemonScript}`);
    console.error(`[dreamstate] Run 'npm run build' in the dreamstate directory`);
    return;
  }

  const isWindows = process.platform === 'win32';

  if (isWindows) {
    // On Windows, use a VBS script to launch node truly hidden
    // This avoids the terminal window that appears with detached + shell
    const vbsPath = join(dreamstateDir, 'launch-daemon.vbs');
    const vbsContent = `
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node ""${daemonScript.replace(/\\/g, '\\\\')}""", 0, False
`.trim();

    writeFileSync(vbsPath, vbsContent);

    // Run the VBS script which will launch node hidden
    const vbs = spawn('wscript', [vbsPath], {
      cwd: projectRoot,
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, DREAMSTATE_WORKSPACE: workspace },
    });
    vbs.unref();

    // Wait briefly for daemon to start and write its PID
    setTimeout(() => {
      if (existsSync(pidFile)) {
        const pid = readFileSync(pidFile, 'utf-8').trim();
        console.log(`[dreamstate] Daemon started (PID: ${pid})`);
      } else {
        console.log(`[dreamstate] Daemon started`);
      }
    }, 500);
  } else {
    // On Unix, standard detached spawn works fine
    const daemon = spawn('node', [daemonScript], {
      cwd: projectRoot,
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, DREAMSTATE_WORKSPACE: workspace },
    });

    daemon.unref();
    console.log(`[dreamstate] Daemon started (PID: ${daemon.pid})`);
  }
}

main();
