export interface DaemonStatus {
  pid: number;
  startedAt: string;
  lastActivity: string;
  uptime: number;
  watching: string[];
  tasksProcessed: number;
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
    idle_timeout_minutes: number;
    token_budget_per_hour: number;
    model: string;
  };
  watch: {
    patterns: string[];
    ignore: string[];
  };
}
