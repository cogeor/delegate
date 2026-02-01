#!/usr/bin/env node
/**
 * LLM-based documentation validator for pre-commit hooks.
 *
 * Uses Claude to validate that documentation claims match the actual codebase.
 * Exit codes:
 *   0 - All checks pass
 *   1 - Validation failed (discrepancies found)
 *   2 - Error running validator
 */

import { execSync, spawnSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const DOC_FILES = ['CLAUDE.md', 'ARCHITECTURE.md', 'WORKFLOW.md'];
const AGENTS_DIR = 'src/plugin/agents';
const CONFIG_FILE = '.dreamstate/config.json';

interface ValidationContext {
  stagedFiles: string[];
  docFiles: string[];
  sourceFiles: string[];
  docsContent: Map<string, string>;
  agentFiles: string[];
  configSchema: string | null;
}

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

function readFileOrNull(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

function getAgentFiles(): string[] {
  try {
    const output = execSync(`git ls-files "${AGENTS_DIR}/*.md"`, { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

function buildContext(): ValidationContext {
  const stagedFiles = getStagedFiles();
  const docFiles = stagedFiles.filter(f => DOC_FILES.includes(f));
  const sourceFiles = stagedFiles.filter(f =>
    f.startsWith('src/') && (f.endsWith('.ts') || f.endsWith('.tsx'))
  );

  const docsContent = new Map<string, string>();
  for (const docFile of DOC_FILES) {
    const content = readFileOrNull(docFile);
    if (content) {
      docsContent.set(docFile, content);
    }
  }

  const agentFiles = getAgentFiles();
  const configSchema = readFileOrNull(CONFIG_FILE);

  return {
    stagedFiles,
    docFiles,
    sourceFiles,
    docsContent,
    agentFiles,
    configSchema
  };
}

function buildValidationPrompt(ctx: ValidationContext): string {
  const parts: string[] = [];

  parts.push(`You are a documentation validator. Check if the documentation accurately reflects the codebase.

TASK: Validate documentation claims against actual files.

STAGED FILES:
${ctx.stagedFiles.join('\n') || '(none)'}

EXISTING AGENT FILES:
${ctx.agentFiles.join('\n') || '(none)'}

CONFIG FILE (${CONFIG_FILE}):
${ctx.configSchema || '(not found)'}

DOCUMENTATION TO VALIDATE:
`);

  for (const [file, content] of ctx.docsContent) {
    parts.push(`\n--- ${file} ---\n${content}\n`);
  }

  parts.push(`
VALIDATION RULES:
1. Agent names in tables must have corresponding .md files in ${AGENTS_DIR}/
2. Config options documented must exist in the config schema
3. File paths mentioned must be valid
4. Component names must match actual implementations

OUTPUT FORMAT (exactly):
If all checks pass:
RESULT: PASS

If any check fails:
RESULT: FAIL
- [file:line] Description of discrepancy

Be strict. Only output PASS if everything matches.
`);

  return parts.join('');
}

function runClaudeValidation(prompt: string): { pass: boolean; output: string } {
  try {
    // Use claude CLI with --print for single response
    // Pass prompt via stdin to avoid command line length limits
    const result = spawnSync('claude', [
      '-p',
      '--model', 'haiku'
    ], {
      input: prompt,
      encoding: 'utf-8',
      timeout: 120000, // 120 second timeout
      maxBuffer: 1024 * 1024,
      shell: true // Required for Windows and to find claude in PATH
    });

    if (result.error) {
      return { pass: false, output: `Error running claude: ${result.error.message}` };
    }

    if (result.status !== 0 && result.stderr) {
      return { pass: false, output: `Claude error: ${result.stderr}` };
    }

    const output = result.stdout || '';
    const pass = output.includes('RESULT: PASS');

    return { pass, output };
  } catch (err) {
    return { pass: false, output: `Validation error: ${err}` };
  }
}

function main(): void {
  console.log('[validate-docs] Checking documentation...');

  const ctx = buildContext();

  // Skip if no doc files exist
  if (ctx.docsContent.size === 0) {
    console.log('[validate-docs] No documentation files found, skipping.');
    process.exit(0);
  }

  // Skip if no relevant files staged
  if (ctx.stagedFiles.length === 0) {
    console.log('[validate-docs] No staged files, skipping.');
    process.exit(0);
  }

  // Only validate if docs or source files are staged
  const hasRelevantChanges = ctx.docFiles.length > 0 || ctx.sourceFiles.length > 0;
  if (!hasRelevantChanges) {
    console.log('[validate-docs] No doc or source changes, skipping.');
    process.exit(0);
  }

  const prompt = buildValidationPrompt(ctx);
  const { pass, output } = runClaudeValidation(prompt);

  if (pass) {
    console.log('[validate-docs] PASS - Documentation matches codebase');
    process.exit(0);
  } else {
    console.log('[validate-docs] FAIL - Documentation discrepancies found:');
    console.log(output);
    console.log('\nUse --no-verify to bypass, or fix the discrepancies.');
    process.exit(1);
  }
}

main();
