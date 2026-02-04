#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readdirSync, copyFileSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = join(homedir(), '.codex', 'skills', 'delegate');
const cmd = process.argv[2];

function copy(srcDir, destDir, prefix = '') {
  mkdirSync(destDir, { recursive: true });
  const files = readdirSync(srcDir).filter(f => (!prefix || f.startsWith(prefix)) && f.endsWith('.md'));
  for (const f of files) copyFileSync(join(srcDir, f), join(destDir, f));
  return files.length;
}

if (cmd === 'install') {
  if (existsSync(skillDir)) rmSync(skillDir, { recursive: true });
  const cmds = copy(join(root, 'commands', 'dg'), join(skillDir, 'commands', 'dg'));
  const agents = copy(join(root, 'agents'), join(skillDir, 'agents'), 'dg-');
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
1. Use the study workflow to propose drafts in \`.delegate/loop_plans/\`.
2. Use the work workflow to implement loops in \`.delegate/loops/\`.
`);
  console.log(`[delegate] Installed ${cmds} commands + ${agents} agents to ${skillDir}`);
} else if (cmd === 'uninstall') {
  rmSync(skillDir, { recursive: true, force: true });
  console.log('[delegate] Uninstalled from ' + skillDir);
} else {
  console.log('Usage: delegate-codex <install|uninstall>');
}
