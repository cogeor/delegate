#!/usr/bin/env node

import { existsSync, writeFileSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { copyDir } from './lib/copy.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = join(homedir(), '.codex', 'skills', 'delegate');
const cmd = process.argv[2];

if (cmd === 'install') {
  if (existsSync(skillDir)) rmSync(skillDir, { recursive: true });

  // Commands
  const cmds = copyDir(join(root, 'commands', 'dg'), join(skillDir, 'commands', 'dg'));

  // Agents (with subfolders)
  const agents = copyDir(join(root, 'agents'), join(skillDir, 'agents'));

  // Skills
  const skills = copyDir(join(root, 'skills'), join(skillDir, 'skills'));

  writeFileSync(join(skillDir, 'SKILL.md'), `---
name: delegate
description: Delegate workflows for spec-driven planning and execution loops.
---

# Delegate Skill

Use these references:
- \`commands/dg/study.md\`
- \`commands/dg/work.md\`
- \`commands/dg/init.md\`

When asked to plan and implement work:
1. Use study workflow to create TASKs in \`.delegate/study/\`.
2. Use work workflow to implement loops in \`.delegate/work/\`.
`);
  console.log(`[delegate] Installed ${cmds} commands + ${agents} agents + ${skills} skills to ${skillDir}`);
} else if (cmd === 'uninstall') {
  rmSync(skillDir, { recursive: true, force: true });
  console.log('[delegate] Uninstalled from ' + skillDir);
} else {
  console.log('Usage: delegate-codex <install|uninstall>');
}
