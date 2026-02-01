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

// Paths to compiled hooks (use forward slashes for JSON)
const DAEMON_HOOK = join(projectRoot, 'dist', 'bin', 'daemon-hook.js').replace(/\\/g, '/');
const PROMPT_HOOK = join(projectRoot, 'dist', 'bin', 'prompt-hook.js').replace(/\\/g, '/');

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

interface HookEntry {
  matcher?: string;
  hooks: Array<{ type: string; command: string }>;
}

interface ClaudeSettings {
  hooks?: {
    SessionStart?: HookEntry[];
    UserPromptSubmit?: HookEntry[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function configureHooks(): { sessionStart: boolean; promptSubmit: boolean } {
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

  const result = { sessionStart: false, promptSubmit: false };

  // Configure SessionStart hook (daemon auto-start)
  if (!settings.hooks.SessionStart) {
    settings.hooks.SessionStart = [];
  }
  const daemonCommand = `node "${DAEMON_HOOK}"`;
  const existingDaemon = settings.hooks.SessionStart.find(entry =>
    entry.hooks?.some(h => h.command?.includes('daemon-hook'))
  );
  if (existingDaemon) {
    const hook = existingDaemon.hooks.find(h => h.command?.includes('daemon-hook'));
    if (hook) hook.command = daemonCommand;
  } else {
    settings.hooks.SessionStart.push({
      hooks: [{ type: 'command', command: daemonCommand }]
    });
    result.sessionStart = true;
  }

  // Configure UserPromptSubmit hook (daemon request injection)
  if (!settings.hooks.UserPromptSubmit) {
    settings.hooks.UserPromptSubmit = [];
  }
  const promptCommand = `node "${PROMPT_HOOK}"`;
  const existingPrompt = settings.hooks.UserPromptSubmit.find(entry =>
    entry.hooks?.some(h => h.command?.includes('prompt-hook'))
  );
  if (existingPrompt) {
    const hook = existingPrompt.hooks.find(h => h.command?.includes('prompt-hook'));
    if (hook) hook.command = promptCommand;
  } else {
    settings.hooks.UserPromptSubmit.push({
      hooks: [{ type: 'command', command: promptCommand }]
    });
    result.promptSubmit = true;
  }

  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  return result;
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

  // Configure hooks
  const hooksResult = configureHooks();
  if (hooksResult.sessionStart) {
    console.log(`${green}✓${reset} Added SessionStart hook (daemon auto-start)`);
  } else {
    console.log(`${green}✓${reset} Updated SessionStart hook (daemon auto-start)`);
  }
  if (hooksResult.promptSubmit) {
    console.log(`${green}✓${reset} Added UserPromptSubmit hook (auto-idle trigger)`);
  } else {
    console.log(`${green}✓${reset} Updated UserPromptSubmit hook (auto-idle trigger)`);
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
  console.log('Auto-idle (disabled by default):');
  console.log(`  Enable in ${cyan}.dreamstate/config.json${reset}:`);
  console.log(`  ${yellow}"daemon": { "auto_idle": { "enabled": true } }${reset}`);
  console.log('');
  console.log(`  Manual daemon:      ${cyan}npm run daemon${reset}`);
  console.log('');
}

main();
