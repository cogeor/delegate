import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const CLAUDE_DIR = join(homedir(), '.claude');
const COMMANDS_DIR = join(CLAUDE_DIR, 'commands', 'ds');
const AGENTS_DIR = join(CLAUDE_DIR, 'agents');

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
  console.log(`  1. Start daemon:    ${cyan}npm run daemon${reset}`);
  console.log(`  2. Test connection: ${cyan}/ds:ping${reset}`);
  console.log(`  3. Plan future:     ${cyan}/ds:idle${reset}`);
  console.log(`  4. Run a loop:      ${cyan}/ds:loop${reset}`);
  console.log('');
}

main();
