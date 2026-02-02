export interface DaemonStatus {
  pid: number;
  startedAt: string;
  lastActivity: string;
  uptime: number;
  watching: string[];
  tasksProcessed: number;
  tokenBudget?: {
    used: number;
    limit: number;
    remaining: number;
    isPaused: boolean;
  };
}

export interface Task {
  id: string;
  type: 'ping' | 'file-change' | 'reflect';
  payload: unknown;
  createdAt: string;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  completedAt: string;
}

export interface PingResult {
  pong: true;
  uptime: number;
  message: string;
}

export interface FileChangePayload {
  filePath: string;
}

export interface Config {
  daemon: {
    provider: ProviderName;    // LLM provider (claude, opencode, codex, auto)
    audit_timeout_minutes: number;
    token_budget_per_hour: number;
    model: string;
    auto_audit: {
      enabled: boolean;        // Whether to request audit mode when user is idle
      model: 'haiku' | 'sonnet' | 'opus';  // Model to use for auto-audit
      max_iterations: number;  // Max iterations per audit session (throttle)
      prompt?: string;         // Optional focus prompt for audit sessions
    };
  };
  watch: {
    patterns: string[];
    ignore: string[];
  };
  docs: {
    enabled: boolean;
    patterns: string[];
    ignore: string[];
  };
}

export interface DaemonRequest {
  id: string;
  action: 'start-audit' | 'stop-audit';
  model?: string;
  max_iterations?: number;
  prompt?: string;
  createdAt: string;
}

export interface LoopStatus {
  started: string;
  phase: 'planning' | 'implementing' | 'testing' | 'complete' | 'failed';
  updated: string;
  tasks: {
    total: number;
    completed: number;
  };
  notes: string[];
}

export interface ProjectState {
  lastUpdated: string;
  currentFocus: string;
  recentActivity: Array<{
    date: string;
    description: string;
  }>;
  openItems: string[];
  proposedNextSteps: string[];
}

export interface LoopDraft {
  id: string;
  name: string;
  description: string;
  dependencies: string[];  // IDs of loops that must complete first
  estimatedScope: 'small' | 'medium' | 'large';
  files: string[];         // Files likely to be affected
  inspiration?: string;    // Template or external repo that inspired this
}

export interface LoopPlan {
  created: string;
  overview: string;
  projectContext: string;
  loops: LoopDraft[];
  executionOrder: string[][]; // Groups of loop IDs that can run in parallel
}

export interface AuditState {
  active: boolean;
  startedAt: string | null;
  stoppedAt?: string | null;
  model: string;
  theme: string | null;  // User-provided focus/direction
  iterations: number;
  currentLoopPlan: string | null;  // Path to active loop_plan folder
  lastIteration: string | null;
  tokensUsed: number;
  session_summaries?: Array<{
    sessionId: string;
    iterations: number;
    summary: string;
  }>;
}

export type Model = 'haiku' | 'sonnet' | 'opus';

export type ProviderName = 'claude' | 'opencode' | 'codex' | 'auto';

export interface CommitInfo {
  hash: string;
  message: string;
  type: 'feat' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore';
  scope?: string;
  filesChanged: string[];
  createdAt: string;
}

export interface TestResult {
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  readyForCommit: boolean;
  summary: string;
  failures?: string[];
}

export interface TokenUsage {
  timestamp: string;
  operation: string;
  tokensUsed: number;
  model: string;
}

export interface TokenBudget {
  hourlyLimit: number;
  currentHourUsage: number;
  hourStartedAt: string;
  history: TokenUsage[];
  isPaused: boolean;
}

export interface FileTask {
  id: string;
  type: 'file-directive';
  filePath: string;
  directive: string;
  instruction: string;
  lineNumber: number;
  createdAt: string;
}

export interface FileTaskResult {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
  tokensUsed: number;
  completedAt: string;
}
