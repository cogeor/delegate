import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const CLAUDE_DIR = join(homedir(), '.claude');
const COMMANDS_DIR = join(CLAUDE_DIR, 'commands', 'ds');

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

  // List installed commands
  console.log('');
  console.log('Available commands:');
  if (existsSync(COMMANDS_DIR)) {
    const commands = readdirSync(COMMANDS_DIR)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
    for (const cmd of commands) {
      console.log(`  ${cyan}/ds:${cmd}${reset}`);
    }
  }

  console.log('');
  console.log('Next steps:');
  console.log(`  1. Start the daemon: ${cyan}npm run daemon${reset}`);
  console.log(`  2. In another terminal, run Claude Code`);
  console.log(`  3. Test with: ${cyan}/ds:ping${reset}`);
  console.log('');
}

main();
