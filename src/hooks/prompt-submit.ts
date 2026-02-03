#!/usr/bin/env node
/**
 * UserPromptSubmit hook for Claude Code.
 * Checks for daemon requests and injects them into the conversation.
 *
 * When the daemon detects idle and auto_plan is enabled, it writes a request file.
 * This hook reads that file and outputs a directive for Claude to act on.
 */

import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const workspace = process.cwd();
const requestFile = join(workspace, '.delegate', 'daemon-request.json');

interface DaemonRequest {
  id: string;
  action: 'start-plan' | 'stop-plan';
  model?: string;
  max_iterations?: number;
  prompt?: string;
  createdAt: string;
}

function main(): void {
  if (!existsSync(requestFile)) {
    return; // No pending request
  }

  try {
    const content = readFileSync(requestFile, 'utf-8');
    const request: DaemonRequest = JSON.parse(content);

    // Consume the request
    unlinkSync(requestFile);

    // Output directive for Claude
    if (request.action === 'start-plan') {
      const model = request.model || 'haiku';
      const maxIter = request.max_iterations || 10;
      const prompt = request.prompt ? ` "${request.prompt}"` : '';

      console.log(`<daemon-request>`);
      console.log(`The daemon has detected you are idle and auto-plan is enabled.`);
      console.log(`Please run: /dg:study ${model}${prompt}`);
      console.log(`Limit to ${maxIter} iterations, then stop.`);
      console.log(`</daemon-request>`);
    } else if (request.action === 'stop-plan') {
      console.log(`<daemon-request>`);
      console.log(`The daemon requests stopping plan mode.`);
      console.log(`Please run: /dg:wake`);
      console.log(`</daemon-request>`);
    }
  } catch (err) {
    // Silent fail - don't disrupt user's prompt
  }
}

main();
