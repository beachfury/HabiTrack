// apps/api/src/lockout.ts
// Account lockout system to prevent brute force attacks

import { q } from './db';
import { parseEnv } from '@habitrack/core-config';

const cfg = parseEnv(process.env);

// Configuration from environment
const LOCKOUT_THRESHOLD = Number(cfg.HABITRACK_CRED_LOCKOUT_THRESHOLD ?? 5);
const LOCKOUT_WINDOW_MINUTES = Number(cfg.HABITRACK_CRED_LOCKOUT_WINDOW_MIN ?? 15);

console.log('[lockout] config:', {
  threshold: LOCKOUT_THRESHOLD,
  windowMinutes: LOCKOUT_WINDOW_MINUTES,
});

// =============================================================================
// Database Schema Addition (add to a migration)
// =============================================================================
/*
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `ip` VARCHAR(45) NULL,
  `success` BOOLEAN NOT NULL DEFAULT 0,
  `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_attempts_user` (`userId`),
  KEY `idx_attempts_time` (`attemptedAt`),
  KEY `idx_attempts_user_time` (`userId`, `attemptedAt`),
  CONSTRAINT `fk_attempts_user`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

// =============================================================================
// Lockout Functions
// =============================================================================

export interface LockoutStatus {
  isLocked: boolean;
  failedAttempts: number;
  lockoutExpiresAt?: Date;
  remainingAttempts: number;
}

/**
 * Check if a user account is currently locked out
 */
export async function checkLockout(userId: number): Promise<LockoutStatus> {
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000);
  
  try {
    // Count failed attempts in the lockout window
    const rows = await q<Array<{ failedCount: number; lastFailed: Date | null }>>(
      `SELECT 
         COUNT(*) as failedCount,
         MAX(attemptedAt) as lastFailed
       FROM login_attempts 
       WHERE userId = ? 
         AND success = 0 
         AND attemptedAt > ?`,
      [userId, windowStart]
    );
    
    const failedCount = rows[0]?.failedCount ?? 0;
    const lastFailed = rows[0]?.lastFailed;
    
    const isLocked = failedCount >= LOCKOUT_THRESHOLD;
    const remainingAttempts = Math.max(0, LOCKOUT_THRESHOLD - failedCount);
    
    let lockoutExpiresAt: Date | undefined;
    if (isLocked && lastFailed) {
      lockoutExpiresAt = new Date(new Date(lastFailed).getTime() + LOCKOUT_WINDOW_MINUTES * 60_000);
    }
    
    return {
      isLocked,
      failedAttempts: failedCount,
      lockoutExpiresAt,
      remainingAttempts,
    };
  } catch (err) {
    // If the table doesn't exist yet, don't lock anyone out
    console.warn('[lockout] checkLockout error (table may not exist):', err);
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: LOCKOUT_THRESHOLD,
    };
  }
}

/**
 * Record a login attempt (successful or failed)
 */
export async function recordLoginAttempt(
  userId: number,
  success: boolean,
  ip?: string
): Promise<void> {
  try {
    await q(
      `INSERT INTO login_attempts (userId, ip, success, attemptedAt)
       VALUES (?, ?, ?, NOW(3))`,
      [userId, ip ?? null, success ? 1 : 0]
    );
    
    // If successful login, clear previous failed attempts for this user
    if (success) {
      await q(
        `DELETE FROM login_attempts 
         WHERE userId = ? AND success = 0`,
        [userId]
      );
    }
  } catch (err) {
    // Non-fatal: log and continue
    console.warn('[lockout] recordLoginAttempt error:', err);
  }
}

/**
 * Clear all failed attempts for a user (e.g., after password reset)
 */
export async function clearFailedAttempts(userId: number): Promise<void> {
  try {
    await q(
      `DELETE FROM login_attempts WHERE userId = ? AND success = 0`,
      [userId]
    );
  } catch (err) {
    console.warn('[lockout] clearFailedAttempts error:', err);
  }
}

/**
 * Cleanup old login attempts (run periodically)
 */
export async function cleanupOldAttempts(): Promise<number> {
  try {
    // Keep successful logins for audit, delete old failed attempts
    const cutoff = new Date(Date.now() - 24 * 60 * 60_000); // 24 hours
    const result: any = await q(
      `DELETE FROM login_attempts 
       WHERE success = 0 AND attemptedAt < ?`,
      [cutoff]
    );
    return result.affectedRows ?? 0;
  } catch (err) {
    console.warn('[lockout] cleanupOldAttempts error:', err);
    return 0;
  }
}

// =============================================================================
// Error Class for Locked Accounts
// =============================================================================

export class AccountLockedError extends Error {
  code = 'ACCOUNT_LOCKED' as const;
  lockoutExpiresAt?: Date;
  remainingSeconds?: number;
  
  constructor(status: LockoutStatus) {
    const remaining = status.lockoutExpiresAt 
      ? Math.ceil((status.lockoutExpiresAt.getTime() - Date.now()) / 1000)
      : LOCKOUT_WINDOW_MINUTES * 60;
    
    super(`Account is locked. Try again in ${Math.ceil(remaining / 60)} minutes.`);
    this.lockoutExpiresAt = status.lockoutExpiresAt;
    this.remainingSeconds = remaining;
  }
}
