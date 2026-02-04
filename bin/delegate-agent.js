#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readdirSync, copyFileSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginRoot = resolve(__dirname, '..');

const command = process.argv[2];
const claudeDir = join(homedir(), '.claude');
const codexDir = join(homedir(), '.codex');
const target = process.argv[3] || null;

function printUsage() {
  console.log(`delegate-agent - install/uninstall the delegate plugin for coding agents

Usage:
  delegate-agent install <target>    Install files for a target
  delegate-agent uninstall <target>  Remove installed files for a target
  delegate-agent path                Print the plugin root path

Targets:
  claude    Install to ~/.claude (commands + agents)
  codex     Install to ~/.codex (skill)

Examples:
  delegate-agent install claude
  delegate-agent install codex`);
}

function copyCommands(commandsDest) {
  const commandsSrc = join(pluginRoot, 'commands', 'dg');
  if (existsSync(commandsDest)) {
    rmSync(commandsDest, { recursive: true });
  }
  mkdirSync(commandsDest, { recursive: true });

  const commandFiles = readdirSync(commandsSrc).filter(f => f.endsWith('.md'));
  for (const file of commandFiles) {
    copyFileSync(join(commandsSrc, file), join(commandsDest, file));
  }
  return commandFiles.length;
}

function copyAgents(agentsDest) {
  const agentsSrc = join(pluginRoot, 'agents');
  mkdirSync(agentsDest, { recursive: true });

  if (existsSync(agentsDest)) {
    for (const file of readdirSync(agentsDest)) {
      if (file.startsWith('dg-') && file.endsWith('.md')) {
        rmSync(join(agentsDest, file));
      }
    }
  }

  const agentFiles = readdirSync(agentsSrc).filter(f => f.startsWith('dg-') && f.endsWith('.md'));
  for (const file of agentFiles) {
    copyFileSync(join(agentsSrc, file), join(agentsDest, file));
  }
  return agentFiles.length;
}

function installClaude() {
  console.log(`[delegate] Plugin root: ${pluginRoot}`);
  console.log(`[delegate] Target: ${claudeDir}`);
  console.log();

  const commandsDest = join(claudeDir, 'commands', 'dg');
  const commandCount = copyCommands(commandsDest);
  console.log(`  [ok] Installed ${commandCount} commands to commands/dg/`);

  const agentsDest = join(claudeDir, 'agents');
  const agentCount = copyAgents(agentsDest);
  console.log(`  [ok] Installed ${agentCount} agents`);

  console.log();
  console.log('Done! Restart your coding agent to pick up delegate commands.');
}

function getCodexSkillContent() {
  return `---
name: delegate
description: Delegate workflows for spec-driven planning and execution loops.
---

# Delegate Skill

This skill mirrors the delegate plugin commands for coding-agent sessions.

Use these references:
- \`commands/dg/study.md\`
- \`commands/dg/do.md\`
- \`commands/dg/init.md\`

When asked to plan and implement work:
1. Use the study workflow to propose loop plans in \`.delegate/loop_plans/\`.
2. Use the do workflow to execute one loop at a time.
`;
}

function installCodex() {
  console.log(`[delegate] Plugin root: ${pluginRoot}`);
  console.log(`[delegate] Target: ${codexDir}`);
  console.log();

  const skillDir = join(codexDir, 'skills', 'delegate');
  if (existsSync(skillDir)) {
    rmSync(skillDir, { recursive: true });
  }

  const commandsDest = join(skillDir, 'commands', 'dg');
  const commandCount = copyCommands(commandsDest);
  console.log(`  [ok] Installed ${commandCount} command references`);

  const agentsDest = join(skillDir, 'agents');
  const agentCount = copyAgents(agentsDest);
  console.log(`  [ok] Installed ${agentCount} agent references`);

  writeFileSync(join(skillDir, 'SKILL.md'), getCodexSkillContent());
  console.log('  [ok] Installed skill manifest at skills/delegate/SKILL.md');
  console.log();
  console.log('Done! Restart Codex to pick up the delegate skill.');
}

function uninstallClaude() {
  console.log(`[delegate] Removing from ${claudeDir}`);
  console.log();

  const commandsDest = join(claudeDir, 'commands', 'dg');
  if (existsSync(commandsDest)) {
    rmSync(commandsDest, { recursive: true });
    console.log('  [ok] Removed commands/dg/');
  }

  const agentsDest = join(claudeDir, 'agents');
  if (existsSync(agentsDest)) {
    let count = 0;
    for (const file of readdirSync(agentsDest)) {
      if (file.startsWith('dg-') && file.endsWith('.md')) {
        rmSync(join(agentsDest, file));
        count++;
      }
    }
    if (count > 0) {
      console.log(`  [ok] Removed ${count} agents`);
    }
  }

  console.log();
  console.log('Done! Delegate has been uninstalled.');
}

function uninstallCodex() {
  const skillDir = join(codexDir, 'skills', 'delegate');
  console.log(`[delegate] Removing from ${skillDir}`);
  console.log();

  if (existsSync(skillDir)) {
    rmSync(skillDir, { recursive: true });
    console.log('  [ok] Removed Codex skill delegate');
  }

  console.log();
  console.log('Done! Delegate has been uninstalled.');
}

function printPath() {
  console.log(pluginRoot);
}

function runInstall(selectedTarget) {
  switch (selectedTarget) {
    case 'claude':
      installClaude();
      break;
    case 'codex':
      installCodex();
      break;
    default:
      console.error(`[delegate] Unknown target: ${selectedTarget}`);
      printUsage();
      process.exitCode = 1;
  }
}

function runUninstall(selectedTarget) {
  switch (selectedTarget) {
    case 'claude':
      uninstallClaude();
      break;
    case 'codex':
      uninstallCodex();
      break;
    default:
      console.error(`[delegate] Unknown target: ${selectedTarget}`);
      printUsage();
      process.exitCode = 1;
  }
}

switch (command) {
  case 'install':
    if (!target) {
      console.error('[delegate] Missing target. Use: delegate-agent install <claude|codex>');
      printUsage();
      process.exitCode = 1;
      break;
    }
    runInstall(target);
    break;
  case 'uninstall':
    if (!target) {
      console.error('[delegate] Missing target. Use: delegate-agent uninstall <claude|codex>');
      printUsage();
      process.exitCode = 1;
      break;
    }
    runUninstall(target);
    break;
  case 'path':
    printPath();
    break;
  default:
    printUsage();
    break;
}
