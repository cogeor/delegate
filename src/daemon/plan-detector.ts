import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getDelegateDir } from '../shared/config.js';
import type { PlanState } from '../shared/types.js';

const PLAN_STATE_FILE = 'plan.state';
const ACTIVITY_FILE = 'last-activity.txt';

export interface PlanDetectorConfig {
  planTimeoutMinutes: number;
  model: string;
  onPlanStart?: () => void;
  onPlanEnd?: () => void;
}

export class PlanDetector {
  private workspaceRoot: string;
  private config: PlanDetectorConfig;
  private lastActivityTime: number;
  private isPlanning: boolean = false;
  private checkIntervalId: NodeJS.Timeout | null = null;

  constructor(workspaceRoot: string, config: PlanDetectorConfig) {
    this.workspaceRoot = workspaceRoot;
    this.config = config;
    this.lastActivityTime = Date.now();
    this.loadLastActivity();
  }

  private getActivityPath(): string {
    return join(getDelegateDir(this.workspaceRoot), ACTIVITY_FILE);
  }

  private getPlanStatePath(): string {
    return join(getDelegateDir(this.workspaceRoot), PLAN_STATE_FILE);
  }

  private loadLastActivity(): void {
    const path = this.getActivityPath();
    if (existsSync(path)) {
      try {
        const timestamp = parseInt(readFileSync(path, 'utf-8').trim(), 10);
        if (!isNaN(timestamp)) {
          this.lastActivityTime = timestamp;
        }
      } catch {
        // Ignore errors, use current time
      }
    }
  }

  /**
   * Record activity (call this when user does something)
   */
  recordActivity(): void {
    this.lastActivityTime = Date.now();
    writeFileSync(this.getActivityPath(), String(this.lastActivityTime));

    // If we were planning, transition out
    if (this.isPlanning) {
      this.isPlanning = false;
      console.log('[PlanDetector] Activity detected, exiting plan state');
      this.config.onPlanEnd?.();
    }
  }

  /**
   * Check if system is idle (no activity for N minutes)
   */
  checkIdle(): boolean {
    const idleMs = this.config.planTimeoutMinutes * 60 * 1000;
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    return timeSinceActivity >= idleMs;
  }

  /**
   * Get current plan state from file
   */
  getPlanState(): PlanState | null {
    const path = this.getPlanStatePath();
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as PlanState;
    } catch {
      return null;
    }
  }

  /**
   * Check if plan mode is manually active (via /dg:study)
   */
  isManualPlanActive(): boolean {
    const state = this.getPlanState();
    return state?.active === true;
  }

  /**
   * Get minutes until plan triggers (or 0 if already idle)
   */
  getMinutesUntilPlan(): number {
    const idleMs = this.config.planTimeoutMinutes * 60 * 1000;
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    const remaining = idleMs - timeSinceActivity;
    return Math.max(0, Math.ceil(remaining / 60000));
  }

  /**
   * Get time since last activity in minutes
   */
  getIdleMinutes(): number {
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    return Math.floor(timeSinceActivity / 60000);
  }

  /**
   * Start periodic idle checking
   */
  start(): void {
    // Check every 30 seconds
    this.checkIntervalId = setInterval(() => {
      if (this.checkIdle() && !this.isPlanning && !this.isManualPlanActive()) {
        this.isPlanning = true;
        console.log(`[PlanDetector] System idle for ${this.config.planTimeoutMinutes} minutes`);
        this.config.onPlanStart?.();
      }
    }, 30000);

    console.log(`[PlanDetector] Started (timeout: ${this.config.planTimeoutMinutes} minutes)`);
  }

  /**
   * Stop idle checking
   */
  stop(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    console.log('[PlanDetector] Stopped');
  }
}
