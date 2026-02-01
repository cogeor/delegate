import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const CLAUDE_DIR = join(homedir(), '.claude');
const COMMANDS_DIR = join(CLAUDE_DIR, 'commands', 'ds');
const AGENTS_DIR = join(CLAUDE_DIR, 'agents');
const SETTINGS_FILE = join(CLAUDE_DIR, 'settings.json');

// Path to compiled daemon hook (use forward slashes for JSON)
const HOOK_SCRIPT = join(projectRoot, 'dist', 'bin', 'daemon-hook.js').replace(/\\/g, '/');

// Colors for terminal output
const green = '\x1b[32m';
const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

interface ClaudeSettings {
  hooks?: {
    SessionStart?: Array<{
      matcher?: string;
      hooks: Array<{ type: string; command: string }>;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function configureHook(): boolean {
  // Read existing settings or create new
  let settings: ClaudeSettings = {};
  if (existsSync(SETTINGS_FILE)) {
    try {
      settings = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch {
      console.log(`${yellow}⚠${reset} Could not parse existing settings.json, creating new`);
    }
  }

  // Initialize hooks structure
  if (!settings.hooks) {
    settings.hooks = {};
  }
  if (!settings.hooks.SessionStart) {
    settings.hooks.SessionStart = [];
  }

  // Check if dreamstate hook already exists
  const hookCommand = `node "${HOOK_SCRIPT}"`;
  const existingHook = settings.hooks.SessionStart.find(entry =>
    entry.hooks?.some(h => h.command?.includes('daemon-hook'))
  );

  if (existingHook) {
    // Update existing hook command path
    const hook = existingHook.hooks.find(h => h.command?.includes('daemon-hook'));
    if (hook) {
      hook.command = hookCommand;
    }
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return false; // Updated, not added
  }

  // Add new hook entry
  settings.hooks.SessionStart.push({
    hooks: [{ type: 'command', command: hookCommand }]
  });

  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  return true; // Added new
}

function copyDir(src: string, dest: string): number {
  ensureDir(dest);
  let count = 0;

  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      count += copyDir(srcPath, destPath);
    } else if (entry.endsWith('.md')) {
      copyFileSync(srcPath, destPath);
      count++;
    }
  }

  return count;
}

function main(): void {
  console.log('');
  console.log(`${cyan}╔══════════════════════════════════════════╗${reset}`);
  console.log(`${cyan}║     DREAMSTATE PLUGIN INSTALLER          ║${reset}`);
  console.log(`${cyan}╚══════════════════════════════════════════╝${reset}`);
  console.log('');

  // Ensure Claude directory exists
  ensureDir(CLAUDE_DIR);

  // Copy commands
  const commandsSrc = join(projectRoot, 'src', 'plugin', 'commands', 'ds');
  if (existsSync(commandsSrc)) {
    const count = copyDir(commandsSrc, COMMANDS_DIR);
    console.log(`${green}✓${reset} Installed ${count} commands to ~/.claude/commands/ds/`);
  } else {
    console.log(`${yellow}⚠${reset} Commands directory not found: ${commandsSrc}`);
  }

  // Copy agents
  const agentsSrc = join(projectRoot, 'src', 'plugin', 'agents');
  if (existsSync(agentsSrc)) {
    ensureDir(AGENTS_DIR);
    const agents = readdirSync(agentsSrc).filter(f => f.endsWith('.md'));
    for (const agent of agents) {
      copyFileSync(join(agentsSrc, agent), join(AGENTS_DIR, agent));
    }
    console.log(`${green}✓${reset} Installed ${agents.length} agents to ~/.claude/agents/`);
  } else {
    console.log(`${yellow}⚠${reset} Agents directory not found: ${agentsSrc}`);
  }

  // Configure SessionStart hook
  const hookAdded = configureHook();
  if (hookAdded) {
    console.log(`${green}✓${reset} Added SessionStart hook to ~/.claude/settings.json`);
  } else {
    console.log(`${green}✓${reset} Updated SessionStart hook in ~/.claude/settings.json`);
  }

  // List installed commands
  console.log('');
  console.log('Commands:');
  if (existsSync(COMMANDS_DIR)) {
    const commands = readdirSync(COMMANDS_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
    for (const cmd of commands) {
      console.log(`  ${cyan}/ds:${cmd}${reset}`);
    }
  }

  // List installed agents
  console.log('');
  console.log('Agents:');
  if (existsSync(AGENTS_DIR)) {
    const agents = readdirSync(AGENTS_DIR)
      .filter(f => f.startsWith('ds-') && f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
    for (const agent of agents) {
      console.log(`  ${cyan}${agent}${reset}`);
    }
  }

  console.log('');
  console.log('Quick start:');
  console.log(`  ${cyan}Daemon auto-starts when Claude Code launches${reset}`);
  console.log(`  1. Test connection: ${cyan}/ds:ping${reset}`);
  console.log(`  2. Enter idle mode: ${cyan}/ds:idle${reset}`);
  console.log(`  3. Run a loop:      ${cyan}/ds:loop${reset}`);
  console.log('');
  console.log(`  Manual daemon:      ${cyan}npm run daemon${reset}`);
  console.log('');
}

main();
