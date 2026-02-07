// apps/api/src/routes/bootstrap.ts
// Bootstrap routes for initial system setup

import type { Request, Response } from 'express';
import { parseEnv } from '@habitrack/core-config';
import { makeLocalClassifier } from '@habitrack/net';
import { q } from '../db';
import { logAudit } from '../audit';
import { hashSecret } from '../crypto';
import { seedDefaultThemes } from './themes/seed';

const cfg = parseEnv(process.env);

function envList(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (v == null) return [];
  return String(v)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

const classify = makeLocalClassifier({
  trustedProxies: envList(cfg.trustedProxies),
  localCidrs: envList(cfg.localCidrs).length
    ? (cfg.localCidrs as any)
    : ['127.0.0.1/32', '::1/128', '10.0.0.0/8', '192.168.0.0/16'],
});

/**
 * GET /api/bootstrap/status
 * Check if the system has been bootstrapped
 */
export async function getBootstrapStatus(req: Request, res: Response) {
  const [row] = await q<Array<{ isBootstrapped: number }>>(
    `SELECT isBootstrapped FROM settings WHERE id=1`,
  );
  return res.json({ bootstrapped: Boolean(row?.isBootstrapped) });
}

/**
 * POST /api/bootstrap
 * Initial system bootstrap - creates admin user and marks system as bootstrapped
 */
export async function postBootstrap(req: Request, res: Response) {
  const info = classify(req);

  // DEV convenience: allow localhost/docker even if proxy classification disagrees
  const isDev = String(process.env.HABITRACK_ENV || '').toLowerCase() !== 'production';
  const clientIp = req.ip || '';
  const isLocalRequest =
    info.isLocal ||
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === '::ffff:127.0.0.1' ||
    clientIp.startsWith('::ffff:172.') || // Docker network
    clientIp.startsWith('172.') || // Docker network
    req.hostname === 'localhost' ||
    req.hostname === '127.0.0.1';

  if (!isLocalRequest && !isDev) {
    return res.status(403).json({
      error: { code: 'PERMISSION_DENIED', message: 'Local network required' },
    });
  }

  // Check if already bootstrapped
  const [row] = await q<Array<{ isBootstrapped: number }>>(
    `SELECT isBootstrapped FROM settings WHERE id=1`,
  );
  if (row?.isBootstrapped) {
    return res.status(409).json({
      error: { code: 'ALREADY_BOOTSTRAPPED', message: 'Already bootstrapped' },
    });
  }

  // Validate input
  const { adminName, adminEmail, adminPassword, householdName } = req.body;

  if (!adminName || typeof adminName !== 'string' || adminName.trim().length < 2) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'Admin name is required (min 2 characters)' },
    });
  }

  if (!adminEmail || typeof adminEmail !== 'string' || !adminEmail.includes('@')) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'Valid email is required' },
    });
  }

  if (!adminPassword || typeof adminPassword !== 'string' || adminPassword.length < 8) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'Password must be at least 8 characters' },
    });
  }

  // Create admin user
  const result: any = await q(
    `INSERT INTO users (displayName, email, roleId, kioskOnly, active) VALUES (?, ?, 'admin', 0, 1)`,
    [adminName.trim(), adminEmail.trim().toLowerCase()],
  );

  const userId = result.insertId as number;

  // Hash and store password
  const { salt, hash } = await hashSecret(adminPassword);
  await q(
    `INSERT INTO credentials (userId, provider, algo, salt, hash) VALUES (?, 'password', 'argon2id', ?, ?)`,
    [userId, salt, hash],
  );

  // Update household name if provided
  if (householdName && typeof householdName === 'string' && householdName.trim()) {
    await q(`UPDATE settings SET householdName = ? WHERE id = 1`, [householdName.trim()]);
  }

  // Mark as bootstrapped
  await q(`UPDATE settings SET isBootstrapped = 1, updatedAt = NOW(3) WHERE id = 1`);

  // Seed default themes with the new admin as creator
  try {
    await seedDefaultThemes(userId);
  } catch (err) {
    console.error('Failed to seed default themes:', err);
    // Non-fatal - continue with bootstrap
  }

  await logAudit({
    action: 'bootstrap.complete',
    result: 'ok',
    actorId: userId,
    ip: info.clientIp ?? undefined,
    ua: (req.headers['user-agent'] as string | undefined) ?? undefined,
    details: { adminEmail: adminEmail.trim().toLowerCase() },
  });

  return res.status(201).json({
    success: true,
    user: { id: userId, displayName: adminName.trim(), role: 'admin' },
  });
}

// Keep the old function for backwards compatibility
export { postBootstrap as postBootstrapAdmin };
