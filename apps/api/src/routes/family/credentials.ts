// apps/api/src/routes/family/credentials.ts
// Family member password and PIN management

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { hashSecret, verifyHash } from '../../crypto';
import { getUser, isValidPin, isValidPassword, success, notFound, serverError, validationError } from '../../utils';

/**
 * Check if PIN is already in use
 */
async function isPinTaken(pin: string, excludeUserId?: number): Promise<boolean> {
  const credentials = await q<Array<{ userId: number; salt: Buffer; hash: Buffer }>>(
    `SELECT userId, salt, hash FROM credentials WHERE provider = 'kiosk_pin'${excludeUserId ? ' AND userId != ?' : ''}`,
    excludeUserId ? [excludeUserId] : []
  );

  for (const cred of credentials) {
    const matches = await verifyHash(pin, cred.salt, cred.hash);
    if (matches) {
      return true;
    }
  }
  return false;
}

/**
 * POST /api/family/members/:id/password
 * Set password for a family member (admin only)
 */
export async function setPassword(req: Request, res: Response) {
  const admin = getUser(req);
  if (!admin) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const memberId = Number(req.params.id);
  const { password } = req.body;

  if (!memberId) {
    return validationError(res, 'Invalid member ID');
  }

  if (!isValidPassword(password, 8)) {
    return validationError(res, 'Password must be at least 8 characters');
  }

  try {
    const [existing] = await q<Array<{ id: number }>>(
      'SELECT id FROM users WHERE id = ? AND kioskOnly = 0',
      [memberId]
    );

    if (!existing) {
      return notFound(res, 'Member not found');
    }

    const { salt, hash } = await hashSecret(password);

    // Check if credential already exists
    const [existingCred] = await q<Array<{ id: number }>>(
      `SELECT id FROM credentials WHERE userId = ? AND provider = 'password' LIMIT 1`,
      [memberId]
    );

    if (existingCred) {
      await q(
        `UPDATE credentials SET algo = 'argon2id', salt = ?, hash = ? WHERE userId = ? AND provider = 'password'`,
        [salt, hash, memberId]
      );
    } else {
      await q(
        `INSERT INTO credentials (userId, provider, algo, salt, hash) VALUES (?, 'password', 'argon2id', ?, ?)`,
        [memberId, salt, hash]
      );
    }

    await logAudit({
      action: 'family.member.password.set',
      result: 'ok',
      actorId: admin.id,
      details: { memberId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/family/members/:id/pin
 * Set kiosk PIN for a family member (admin only)
 */
export async function setPin(req: Request, res: Response) {
  const admin = getUser(req);
  if (!admin) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const memberId = Number(req.params.id);
  const { pin } = req.body;

  if (!memberId) {
    return validationError(res, 'Invalid member ID');
  }

  // Allow clearing PIN
  if (pin === null || pin === '') {
    try {
      await q(`DELETE FROM credentials WHERE userId = ? AND provider = 'kiosk_pin'`, [memberId]);

      await logAudit({
        action: 'family.member.pin.clear',
        result: 'ok',
        actorId: admin.id,
        details: { memberId },
      });

      return success(res, { success: true, cleared: true });
    } catch (err) {
      return serverError(res, err as Error);
    }
  }

  if (!isValidPin(pin)) {
    return validationError(res, 'PIN must be 4-6 digits');
  }

  // Check PIN uniqueness
  const pinTaken = await isPinTaken(pin, memberId);
  if (pinTaken) {
    return res.status(409).json({
      error: { code: 'PIN_TAKEN', message: 'This PIN is already in use' },
    });
  }

  try {
    const [existing] = await q<Array<{ id: number }>>(
      'SELECT id FROM users WHERE id = ? AND kioskOnly = 0',
      [memberId]
    );

    if (!existing) {
      return notFound(res, 'Member not found');
    }

    const { salt, hash } = await hashSecret(pin);

    // Check if credential already exists
    const [existingCred] = await q<Array<{ id: number }>>(
      `SELECT id FROM credentials WHERE userId = ? AND provider = 'kiosk_pin' LIMIT 1`,
      [memberId]
    );

    if (existingCred) {
      await q(
        `UPDATE credentials SET algo = 'argon2id', salt = ?, hash = ? WHERE userId = ? AND provider = 'kiosk_pin'`,
        [salt, hash, memberId]
      );
    } else {
      await q(
        `INSERT INTO credentials (userId, provider, algo, salt, hash) VALUES (?, 'kiosk_pin', 'argon2id', ?, ?)`,
        [memberId, salt, hash]
      );
    }

    await logAudit({
      action: 'family.member.pin.set',
      result: 'ok',
      actorId: admin.id,
      details: { memberId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/family/members/:id/pin
 * Remove PIN for a family member (admin only)
 */
export async function removePin(req: Request, res: Response) {
  const admin = getUser(req);
  if (!admin) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const memberId = Number(req.params.id);

  try {
    await q(`DELETE FROM credentials WHERE userId = ? AND provider = 'kiosk_pin'`, [memberId]);

    await logAudit({
      action: 'family.member.pin.clear',
      result: 'ok',
      actorId: admin.id,
      details: { memberId },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
