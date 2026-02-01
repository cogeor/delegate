import { existsSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Config } from './types.js';

export const DREAMSTATE_DIR = '.dreamstate';
export const STATUS_FILE = 'daemon.status';
export const PID_FILE = 'daemon.pid';
export const TASKS_DIR = 'tasks';
export const RESULTS_DIR = 'results';
export const CONFIG_FILE = 'config.json';

export function getDreamstateDir(workspaceRoot: string): string {
  return join(workspaceRoot, DREAMSTATE_DIR);
}

export function ensureDreamstateDir(workspaceRoot: string): string {
  const dir = getDreamstateDir(workspaceRoot);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const tasksDir = join(dir, TASKS_DIR);
  if (!existsSync(tasksDir)) {
    mkdirSync(tasksDir, { recursive: true });
  }
  const resultsDir = join(dir, RESULTS_DIR);
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }
  return dir;
}

export function getDefaultConfig(): Config {
  return {
    daemon: {
      idle_timeout_minutes: 5,
      token_budget_per_hour: 10000,
      model: 'haiku'
    },
    watch: {
      patterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      ignore: ['node_modules', 'dist', '.git', '.dreamstate']
    }
  };
}

export function loadConfig(workspaceRoot: string): Config {
  const configPath = join(getDreamstateDir(workspaceRoot), CONFIG_FILE);
  const defaults = getDefaultConfig();

  if (existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(readFileSync(configPath, 'utf-8')) as Partial<Config>;
      return {
        daemon: { ...defaults.daemon, ...userConfig.daemon },
        watch: { ...defaults.watch, ...userConfig.watch }
      };
    } catch {
      return defaults;
    }
  }
  return defaults;
}
