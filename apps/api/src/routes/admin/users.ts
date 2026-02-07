// apps/api/src/routes/admin/users.ts
// Admin user management routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { Notifier } from '../../notify';
import { makeOnboardToken } from '../../onboard/token';
import { hashSecret } from '../../crypto';

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export async function postAdminCreateUser(req: Request, res: Response) {
  const { displayName, roleId, email, tempPassword } = (req.body ?? {}) as {
    displayName?: string;
    roleId?: 'admin' | 'member' | 'kid' | 'kiosk';
    email?: string | null;
    tempPassword?: string;
  };

  if (!displayName || !roleId || !tempPassword) {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'displayName, roleId, tempPassword required' },
    });
  }

  // insert user
  const r: any = await q(
    `INSERT INTO users (displayName, roleId, kioskOnly, active, firstLoginRequired)
     VALUES (?, ?, 0, 1, 1)`,
    [displayName, roleId],
  );
  const userId = Number(r.insertId);

  // set temp password
  await updateUserSecret(userId, tempPassword);

  // optional welcome/onboard email
  if (email) {
    const exp = Date.now() + 10 * 60_000;
    const token = makeOnboardToken(userId, 'onboard', exp);
    const baseUrl = process.env.APP_WEB_BASE || 'http://localhost:5173';
    const link = `${baseUrl}/onboard?token=${encodeURIComponent(token)}`;

    await Notifier.enqueue({
      kind: 'generic',
      userId,
      toEmail: email,
      subject: 'Welcome to HabiTrack – set your password',
      text: `Hi ${displayName}, click to set your password & kiosk PIN: ${link} (valid 10 minutes)`,
      html: `<p>Hi ${displayName},</p><p>Click to set your password & kiosk PIN:</p><p><a href="${link}">${link}</a></p><p>Link valid 10 minutes.</p>`,
    });
  }

  return res.status(201).json({ user: { id: userId, displayName, roleId, email: email ?? null } });
}

async function updateUserSecret(userId: number, password: string) {
  const { salt, hash } = await hashSecret(password);

  // Check if credentials exist
  const [existing] = await q<Array<{ id: number }>>(
    `SELECT id FROM credentials WHERE userId = ? AND provider = 'password'`,
    [userId],
  );

  if (existing) {
    await q(
      `UPDATE credentials SET salt = ?, hash = ? WHERE userId = ? AND provider = 'password'`,
      [salt, hash, userId],
    );
  } else {
    await q(
      `INSERT INTO credentials (userId, provider, algo, salt, hash) VALUES (?, 'password', 'argon2id', ?, ?)`,
      [userId, salt, hash],
    );
  }
}
