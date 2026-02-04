import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { Config, LoopStatus } from './types.js';

export const DELEGATE_DIR = '.delegate';
export const PLAN_STATE_FILE = 'plan.state';
export const CONFIG_FILE = 'config.json';
export const LOOPS_DIR = 'loops';
export const LOOP_PLANS_DIR = 'loop_plans';
export const TEMPLATES_DIR = 'templates';
export const DOCS_DIR = '.doc';
export const STATE_FILE = 'STATE.md';

export function getDelegateDir(workspaceRoot: string): string {
  return join(workspaceRoot, DELEGATE_DIR);
}

export function ensureDelegateDir(workspaceRoot: string): string {
  const dir = getDelegateDir(workspaceRoot);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getDefaultConfig(): Config {
  return {
    docs: {
      enabled: true,
      patterns: ['src/**/*.ts', 'src/**/*.tsx'],
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/types.ts']
    }
  };
}

export function loadConfig(workspaceRoot: string): Config {
  const configPath = join(getDelegateDir(workspaceRoot), CONFIG_FILE);
  const defaults = getDefaultConfig();

  if (existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(readFileSync(configPath, 'utf-8')) as Partial<Config>;
      return {
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
  const dgDir = ensureDelegateDir(workspaceRoot);
  const loopsDir = join(dgDir, LOOPS_DIR);

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
  const docsDir = join(workspaceRoot, DOCS_DIR);
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }
  return docsDir;
}

/**
 * Create a new loop plan folder with initial structure
 */
export function createLoopPlanFolder(workspaceRoot: string, description: string): string {
  const dgDir = ensureDelegateDir(workspaceRoot);
  const plansDir = join(dgDir, LOOP_PLANS_DIR);

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
  return join(getDelegateDir(workspaceRoot), TEMPLATES_DIR);
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
