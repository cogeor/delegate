import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { Config, LoopStatus, DaemonRequest } from './types.js';

export const DREAMSTATE_DIR = '.dreamstate';
export const STATUS_FILE = 'daemon.status';
export const PID_FILE = 'daemon.pid';
export const AUDIT_STATE_FILE = 'audit.state';
export const TASKS_DIR = 'tasks';
export const RESULTS_DIR = 'results';
export const CONFIG_FILE = 'config.json';
export const LOOPS_DIR = 'loops';
export const LOOP_PLANS_DIR = 'loop_plans';
export const TEMPLATES_DIR = 'templates';
export const DOCS_DIR = 'docs';
export const STATE_FILE = 'STATE.md';

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

export const DAEMON_REQUEST_FILE = 'daemon-request.json';

export function getDefaultConfig(): Config {
  return {
    daemon: {
      provider: 'claude',  // Default provider (claude, opencode, codex, auto)
      audit_timeout_minutes: 5,
      token_budget_per_hour: 10000,
      model: 'haiku',
      auto_audit: {
        enabled: false,  // Disabled by default - user must opt-in
        model: 'haiku',
        max_iterations: 10,  // Throttle: max iterations per audit session
        prompt: undefined
      }
    },
    watch: {
      patterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      ignore: ['node_modules', 'dist', '.git', '.dreamstate']
    },
    docs: {
      enabled: true,
      patterns: ['src/**/*.ts', 'src/**/*.tsx'],
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/types.ts']
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
        daemon: {
          ...defaults.daemon,
          ...userConfig.daemon,
          auto_audit: {
            ...defaults.daemon.auto_audit,
            ...(userConfig.daemon?.auto_audit || {})
          }
        },
        watch: { ...defaults.watch, ...userConfig.watch },
        docs: { ...defaults.docs, ...userConfig.docs }
      };
    } catch {
      return defaults;
    }
  }
  return defaults;
}

/**
 * Generate a timestamped folder name for a loop
 * Format: YYYYMMDD-HHMMSS-{slug}
 */
export function generateLoopFolderName(description: string): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .slice(0, 15); // YYYYMMDD-HHMMSS

  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);

  return `${timestamp}-${slug}`;
}

/**
 * Create a new loop folder with initial structure
 */
export function createLoopFolder(workspaceRoot: string, description: string): string {
  const dsDir = ensureDreamstateDir(workspaceRoot);
  const loopsDir = join(dsDir, LOOPS_DIR);

  if (!existsSync(loopsDir)) {
    mkdirSync(loopsDir, { recursive: true });
  }

  const folderName = generateLoopFolderName(description);
  const loopFolder = join(loopsDir, folderName);
  mkdirSync(loopFolder, { recursive: true });

  // Initialize STATUS.md
  const status: LoopStatus = {
    started: new Date().toISOString(),
    phase: 'planning',
    updated: new Date().toISOString(),
    tasks: { total: 0, completed: 0 },
    notes: []
  };

  const statusContent = `# Loop Status

Started: ${status.started}
Phase: ${status.phase}
Updated: ${status.updated}

## Progress
- [ ] Planning
- [ ] Implementation
- [ ] Testing

## Notes
`;

  writeFileSync(join(loopFolder, 'STATUS.md'), statusContent);

  return loopFolder;
}

/**
 * Ensure docs directory exists
 */
export function ensureDocsDir(workspaceRoot: string): string {
  const docsDir = join(getDreamstateDir(workspaceRoot), DOCS_DIR);
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }
  return docsDir;
}

/**
 * Create a new loop plan folder with initial structure
 */
export function createLoopPlanFolder(workspaceRoot: string, description: string): string {
  const dsDir = ensureDreamstateDir(workspaceRoot);
  const plansDir = join(dsDir, LOOP_PLANS_DIR);

  if (!existsSync(plansDir)) {
    mkdirSync(plansDir, { recursive: true });
  }

  const folderName = generateLoopFolderName(description);
  const planFolder = join(plansDir, folderName);
  mkdirSync(planFolder, { recursive: true });

  return planFolder;
}

/**
 * Get templates directory path
 */
export function getTemplatesDir(workspaceRoot: string): string {
  return join(getDreamstateDir(workspaceRoot), TEMPLATES_DIR);
}

/**
 * List available templates
 */
export function listTemplates(workspaceRoot: string): string[] {
  const templatesDir = getTemplatesDir(workspaceRoot);
  if (!existsSync(templatesDir)) {
    return [];
  }
  return readdirSync(templatesDir).filter(f => {
    const stat = statSync(join(templatesDir, f));
    return stat.isDirectory();
  });
}
