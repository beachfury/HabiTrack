// apps/api/src/crypto.ts
// Unified cryptographic helpers - single source of truth for password hashing

import crypto from 'node:crypto';
import argon2 from 'argon2';
import { q } from './db';

// =============================================================================
// Argon2 Configuration (OWASP recommended for argon2id)
// =============================================================================

const ARGON2_OPTS: argon2.Options & { raw: true } = {
  type: argon2.argon2id,
  timeCost: 3,           // iterations
  memoryCost: 64 * 1024, // 64 MB
  parallelism: 1,        // threads
  raw: true,             // return Buffer, not encoded string
};

const SALT_BYTES = 16;

// =============================================================================
// Core Hashing Functions
// =============================================================================

/**
 * Timing-safe buffer comparison to prevent timing attacks
 */
export function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Hash a secret (password or PIN) with a fresh random salt
 */
export async function hashSecret(secret: string): Promise<{ salt: Buffer; hash: Buffer }> {
  const salt = crypto.randomBytes(SALT_BYTES);
  const hash = (await argon2.hash(secret, { ...ARGON2_OPTS, salt })) as Buffer;
  return { salt, hash };
}

/**
 * Verify a secret against stored salt and hash
 */
export async function verifyHash(secret: string, salt: Buffer, storedHash: Buffer): Promise<boolean> {
  const computed = (await argon2.hash(secret, { ...ARGON2_OPTS, salt })) as Buffer;
  return timingSafeEqual(computed, storedHash);
}

// =============================================================================
// User Credential Operations
// =============================================================================

export type CredentialProvider = 'password' | 'kiosk_pin';

/**
 * Update or insert a user's credential (password or kiosk PIN)
 * Uses explicit check-then-update to avoid reliance on UNIQUE constraint alone.
 */
export async function updateUserCredential(
  userId: number,
  provider: CredentialProvider,
  secret: string
): Promise<void> {
  const { salt, hash } = await hashSecret(secret);

  // Check if credentials already exist for this user+provider
  const [existing] = await q<Array<{ id: number }>>(
    `SELECT id FROM credentials WHERE userId = ? AND provider = ? LIMIT 1`,
    [userId, provider]
  );

  if (existing) {
    // Update existing credential
    await q(
      `UPDATE credentials SET algo = 'argon2id', salt = ?, hash = ?, updatedAt = NOW(3)
       WHERE userId = ? AND provider = ?`,
      [salt, hash, userId, provider]
    );
  } else {
    // Insert new credential
    await q(
      `INSERT INTO credentials (userId, provider, algo, salt, hash, updatedAt)
       VALUES (?, ?, 'argon2id', ?, ?, NOW(3))`,
      [userId, provider, salt, hash]
    );
  }
}

/**
 * Convenience wrapper for password updates
 */
export async function updateUserPassword(userId: number, password: string): Promise<void> {
  return updateUserCredential(userId, 'password', password);
}

/**
 * Convenience wrapper for kiosk PIN updates
 */
export async function updateUserKioskPin(userId: number, pin: string): Promise<void> {
  return updateUserCredential(userId, 'kiosk_pin', pin);
}

/**
 * Verify a user's credential (password or kiosk PIN)
 */
export async function verifyUserCredential(
  userId: number,
  provider: CredentialProvider,
  secret: string
): Promise<boolean> {
  const rows = await q<Array<{ algo: string; salt: Buffer; hash: Buffer }>>(
    `SELECT algo, salt, hash
       FROM credentials
      WHERE userId = ? AND provider = ?
      LIMIT 1`,
    [userId, provider]
  );
  
  const row = rows?.[0];
  if (!row || String(row.algo).toLowerCase() !== 'argon2id') {
    return false;
  }
  
  return verifyHash(secret, row.salt, row.hash);
}

/**
 * Convenience wrapper for password verification
 */
export async function verifyUserPassword(userId: number, password: string): Promise<boolean> {
  return verifyUserCredential(userId, 'password', password);
}

/**
 * Convenience wrapper for kiosk PIN verification
 */
export async function verifyUserKioskPin(userId: number, pin: string): Promise<boolean> {
  return verifyUserCredential(userId, 'kiosk_pin', pin);
}

// =============================================================================
// User Role Lookup
// =============================================================================

export type RoleId = 'admin' | 'member' | 'kid' | 'kiosk';

/**
 * Get a user's role from the database
 */
export async function getUserRole(userId: number): Promise<RoleId> {
  const rows = await q<Array<{ roleId: RoleId }>>(
    'SELECT roleId FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  return rows[0]?.roleId ?? 'member';
}

// =============================================================================
// Token Generation
// =============================================================================

/**
 * Generate a cryptographically secure random code (for password resets, etc.)
 */
export function generateSecureCode(length: number = 6): string {
  // Generate numeric code
  const digits = '0123456789';
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[bytes[i] % 10];
  }
  return code;
}

/**
 * Generate a secure random token (hex string)
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a code for storage (SHA-256)
 */
export function hashCode(code: string): Buffer {
  return crypto.createHash('sha256').update(code).digest();
}
