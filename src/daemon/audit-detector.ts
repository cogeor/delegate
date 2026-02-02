import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getDreamstateDir } from '../shared/config.js';
import type { AuditState } from '../shared/types.js';

const AUDIT_STATE_FILE = 'audit.state';
const ACTIVITY_FILE = 'last-activity.txt';

export interface AuditDetectorConfig {
  auditTimeoutMinutes: number;
  model: string;
  onAuditStart?: () => void;
  onAuditEnd?: () => void;
}

export class AuditDetector {
  private workspaceRoot: string;
  private config: AuditDetectorConfig;
  private lastActivityTime: number;
  private isAuditing: boolean = false;
  private checkIntervalId: NodeJS.Timeout | null = null;

  constructor(workspaceRoot: string, config: AuditDetectorConfig) {
    this.workspaceRoot = workspaceRoot;
    this.config = config;
    this.lastActivityTime = Date.now();
    this.loadLastActivity();
  }

  private getActivityPath(): string {
    return join(getDreamstateDir(this.workspaceRoot), ACTIVITY_FILE);
  }

  private getAuditStatePath(): string {
    return join(getDreamstateDir(this.workspaceRoot), AUDIT_STATE_FILE);
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

    // If we were auditing, transition out
    if (this.isAuditing) {
      this.isAuditing = false;
      console.log('[AuditDetector] Activity detected, exiting audit state');
      this.config.onAuditEnd?.();
    }
  }

  /**
   * Check if system is idle (no activity for N minutes)
   */
  checkIdle(): boolean {
    const idleMs = this.config.auditTimeoutMinutes * 60 * 1000;
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    return timeSinceActivity >= idleMs;
  }

  /**
   * Get current audit state from file
   */
  getAuditState(): AuditState | null {
    const path = this.getAuditStatePath();
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as AuditState;
    } catch {
      return null;
    }
  }

  /**
   * Check if audit mode is manually active (via /ds:audit)
   */
  isManualAuditActive(): boolean {
    const state = this.getAuditState();
    return state?.active === true;
  }

  /**
   * Get minutes until audit triggers (or 0 if already idle)
   */
  getMinutesUntilAudit(): number {
    const idleMs = this.config.auditTimeoutMinutes * 60 * 1000;
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
      if (this.checkIdle() && !this.isAuditing && !this.isManualAuditActive()) {
        this.isAuditing = true;
        console.log(`[AuditDetector] System idle for ${this.config.auditTimeoutMinutes} minutes`);
        this.config.onAuditStart?.();
      }
    }, 30000);

    console.log(`[AuditDetector] Started (timeout: ${this.config.auditTimeoutMinutes} minutes)`);
  }

  /**
   * Stop idle checking
   */
  stop(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    console.log('[AuditDetector] Stopped');
  }
}
