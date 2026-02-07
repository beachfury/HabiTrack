// apps/api/src/routes/settings/user.ts
// User settings routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { hashSecret, verifyHash } from '../../crypto';
import { getUser, isValidPassword, success, serverError, validationError } from '../../utils';

interface UserSettings {
  id: number;
  displayName: string;
  nickname: string | null;
  email: string | null;
  color: string | null;
  theme: string | null;
  accentColor: string | null;
  avatarUrl: string | null;
}

/**
 * GET /api/settings/user
 * Get current user settings
 */
export async function getUserSettings(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    const [settings] = await q<UserSettings[]>(
      `SELECT id, displayName, nickname, email, color, theme, accentColor, avatarUrl
       FROM users WHERE id = ?`,
      [user.id]
    );

    return success(res, { user: settings });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/settings/user
 * Update current user settings
 */
export async function updateUserSettings(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { nickname, email, color, theme, accentColor } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (nickname !== undefined) {
      updates.push('nickname = ?');
      params.push(nickname?.trim() || null);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email?.trim().toLowerCase() || null);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color || null);
    }
    if (theme !== undefined) {
      updates.push('theme = ?');
      params.push(theme || null);
    }
    if (accentColor !== undefined) {
      updates.push('accentColor = ?');
      params.push(accentColor || null);
    }

    if (updates.length > 0) {
      params.push(user.id);
      await q(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    await logAudit({
      action: 'settings.user.update',
      result: 'ok',
      actorId: user.id,
      details: { updates: req.body },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/settings/password
 * Change current user's password
 */
export async function changePassword(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { currentPassword, newPassword } = req.body;

  if (!isValidPassword(newPassword, 8)) {
    return validationError(res, 'New password must be at least 8 characters');
  }

  try {
    // Verify current password
    const [credential] = await q<Array<{ salt: Buffer; hash: Buffer }>>(
      `SELECT salt, hash FROM credentials WHERE userId = ? AND provider = 'password'`,
      [user.id]
    );

    if (!credential) {
      return validationError(res, 'No password set for this account');
    }

    const isValid = await verifyHash(currentPassword, credential.salt, credential.hash);
    if (!isValid) {
      return validationError(res, 'Current password is incorrect');
    }

    // Set new password
    const { salt, hash } = await hashSecret(newPassword);
    await q(
      `UPDATE credentials SET salt = ?, hash = ? WHERE userId = ? AND provider = 'password'`,
      [salt, hash, user.id]
    );

    await logAudit({
      action: 'settings.password.change',
      result: 'ok',
      actorId: user.id,
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/settings/avatar
 * Update user avatar URL
 */
export async function updateAvatar(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { avatarUrl } = req.body;

  try {
    await q(`UPDATE users SET avatarUrl = ? WHERE id = ?`, [avatarUrl || null, user.id]);

    await logAudit({
      action: 'settings.avatar.update',
      result: 'ok',
      actorId: user.id,
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/settings/avatar
 * Remove user avatar
 */
export async function removeAvatar(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    await q(`UPDATE users SET avatarUrl = NULL WHERE id = ?`, [user.id]);

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
