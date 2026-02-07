#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, copyFileSync, rmSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const claude = join(homedir(), '.claude');
const cmd = process.argv[2];

function copyDir(src, dest) {
  if (!existsSync(src)) return 0;
  mkdirSync(dest, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      count += copyDir(srcPath, destPath);
    } else if (entry.endsWith('.md')) {
      copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

function copySkills(src, dest) {
  if (!existsSync(src)) return 0;
  let count = 0;
  for (const skill of readdirSync(src)) {
    const srcSkill = join(src, skill);
    if (!statSync(srcSkill).isDirectory()) continue;
    const destSkill = join(dest, skill);
    if (existsSync(destSkill)) rmSync(destSkill, { recursive: true });
    mkdirSync(destSkill, { recursive: true });
    const skillFile = join(srcSkill, 'SKILL.md');
    if (existsSync(skillFile)) {
      copyFileSync(skillFile, join(destSkill, 'SKILL.md'));
      count++;
    }
  }
  return count;
}

function cleanOldFiles() {
  // Remove old flat agents (dg-*.md)
  const agentDir = join(claude, 'agents');
  if (existsSync(agentDir)) {
    for (const f of readdirSync(agentDir)) {
      if (f.startsWith('dg-') && f.endsWith('.md')) {
        rmSync(join(agentDir, f), { force: true });
      }
    }
  }

  // Remove old skills (dg-*)
  const skillDir = join(claude, 'skills');
  if (existsSync(skillDir)) {
    for (const f of readdirSync(skillDir)) {
      if (f.startsWith('dg-')) {
        rmSync(join(skillDir, f), { recursive: true, force: true });
      }
    }
  }
}

if (cmd === 'install') {
  // Clean old files first
  cleanOldFiles();

  // Commands
  const cmdSrc = join(root, 'commands', 'dg');
  const cmdDest = join(claude, 'commands', 'dg');
  if (existsSync(cmdDest)) rmSync(cmdDest, { recursive: true });
  const cmds = copyDir(cmdSrc, cmdDest);

  // Agents (study/, work/ subfolders)
  const agentDest = join(claude, 'agents');
  // Remove old study/work folders
  if (existsSync(join(agentDest, 'study'))) rmSync(join(agentDest, 'study'), { recursive: true });
  if (existsSync(join(agentDest, 'work'))) rmSync(join(agentDest, 'work'), { recursive: true });
  const agents = copyDir(join(root, 'agents'), agentDest);

  // Skills
  const skills = copySkills(join(root, 'skills'), join(claude, 'skills'));

  console.log(`[delegate] Installed ${cmds} commands + ${agents} agents + ${skills} skills to ${claude}`);
} else if (cmd === 'uninstall') {
  // Commands
  rmSync(join(claude, 'commands', 'dg'), { recursive: true, force: true });

  // Agents
  const agentDir = join(claude, 'agents');
  if (existsSync(agentDir)) {
    rmSync(join(agentDir, 'study'), { recursive: true, force: true });
    rmSync(join(agentDir, 'work'), { recursive: true, force: true });
  }

  // Skills
  const skillDir = join(claude, 'skills');
  if (existsSync(skillDir)) {
    rmSync(join(skillDir, 'study-handoffs'), { recursive: true, force: true });
    rmSync(join(skillDir, 'work-handoffs'), { recursive: true, force: true });
  }

  // Clean old files too
  cleanOldFiles();

  console.log('[delegate] Uninstalled from ' + claude);
} else {
  console.log('Usage: delegate-claude <install|uninstall>');
}
