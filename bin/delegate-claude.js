#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, copyFileSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const claude = join(homedir(), '.claude');
const cmd = process.argv[2];

function copy(srcDir, destDir, prefix = '') {
  if (existsSync(destDir)) {
    for (const f of readdirSync(destDir)) {
      if ((!prefix || f.startsWith(prefix)) && f.endsWith('.md')) rmSync(join(destDir, f));
    }
  }
  mkdirSync(destDir, { recursive: true });
  const files = readdirSync(srcDir).filter(f => (!prefix || f.startsWith(prefix)) && f.endsWith('.md'));
  for (const f of files) copyFileSync(join(srcDir, f), join(destDir, f));
  return files.length;
}

if (cmd === 'install') {
  const cmds = copy(join(root, 'commands', 'dg'), join(claude, 'commands', 'dg'));
  const agents = copy(join(root, 'agents'), join(claude, 'agents'), 'dg-');
  console.log(`[delegate] Installed ${cmds} commands + ${agents} agents to ${claude}`);
} else if (cmd === 'uninstall') {
  rmSync(join(claude, 'commands', 'dg'), { recursive: true, force: true });
  for (const f of readdirSync(join(claude, 'agents')).filter(f => f.startsWith('dg-'))) {
    rmSync(join(claude, 'agents', f));
  }
  console.log('[delegate] Uninstalled from ' + claude);
} else {
  console.log('Usage: delegate-claude <install|uninstall>');
}
