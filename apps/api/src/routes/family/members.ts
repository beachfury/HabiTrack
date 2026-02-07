// apps/api/src/routes/family/members.ts
// Family member management routes

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { hashSecret, verifyHash } from '../../crypto';
import { getUser, isValidString, isValidPin, success, created, notFound, forbidden, serverError, validationError } from '../../utils';

interface FamilyMember {
  id: number;
  displayName: string;
  nickname: string | null;
  email: string | null;
  role: string;
  color: string | null;
  active: boolean;
  hasPassword: boolean;
  hasPin: boolean;
  createdAt: Date;
}

/**
 * Check if PIN is already in use by another user
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
 * GET /api/family/members
 * Get all family members
 */
export async function getMembers(req: Request, res: Response) {
  try {
    const members = await q<Array<{
      id: number;
      displayName: string;
      nickname: string | null;
      email: string | null;
      roleId: string;
      color: string | null;
      active: number;
      createdAt: Date;
      hasPassword: number;
      hasPin: number;
    }>>(
      `SELECT
        u.id, u.displayName, u.nickname, u.email, u.roleId, u.color,
        u.active, u.createdAt,
        (SELECT COUNT(*) FROM credentials c WHERE c.userId = u.id AND c.provider = 'password') as hasPassword,
        (SELECT COUNT(*) FROM credentials c WHERE c.userId = u.id AND c.provider = 'kiosk_pin') as hasPin
       FROM users u
       WHERE u.kioskOnly = 0
       ORDER BY
         CASE u.roleId
           WHEN 'admin' THEN 1
           WHEN 'member' THEN 2
           WHEN 'kid' THEN 3
           ELSE 4
         END,
         u.displayName`
    );

    return success(res, {
      members: members.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        nickname: m.nickname,
        email: m.email,
        role: m.roleId,
        color: m.color,
        active: Boolean(m.active),
        hasPassword: Boolean(m.hasPassword),
        hasPin: Boolean(m.hasPin),
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/family/members/:id
 * Get a single family member
 */
export async function getMember(req: Request, res: Response) {
  const memberId = Number(req.params.id);

  try {
    const [member] = await q<Array<{
      id: number;
      displayName: string;
      nickname: string | null;
      email: string | null;
      roleId: string;
      color: string | null;
      active: number;
      createdAt: Date;
      hasPassword: number;
      hasPin: number;
    }>>(
      `SELECT
        u.id, u.displayName, u.nickname, u.email, u.roleId, u.color,
        u.active, u.createdAt,
        (SELECT COUNT(*) FROM credentials c WHERE c.userId = u.id AND c.provider = 'password') as hasPassword,
        (SELECT COUNT(*) FROM credentials c WHERE c.userId = u.id AND c.provider = 'kiosk_pin') as hasPin
       FROM users u
       WHERE u.id = ? AND u.kioskOnly = 0`,
      [memberId]
    );

    if (!member) {
      return notFound(res, 'Member not found');
    }

    return success(res, {
      member: {
        id: member.id,
        displayName: member.displayName,
        nickname: member.nickname,
        email: member.email,
        role: member.roleId,
        color: member.color,
        active: Boolean(member.active),
        hasPassword: Boolean(member.hasPassword),
        hasPin: Boolean(member.hasPin),
        createdAt: member.createdAt,
      },
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/family/members
 * Create a new family member (admin only)
 */
export async function createMember(req: Request, res: Response) {
  const admin = getUser(req);
  if (!admin) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { displayName, nickname, email, role, color, password, pin } = req.body;

  if (!isValidString(displayName, 2)) {
    return validationError(res, 'Display name is required (min 2 characters)');
  }

  const validRoles = ['admin', 'member', 'kid'];
  if (!role || !validRoles.includes(role)) {
    return validationError(res, 'Valid role is required (admin, member, kid)');
  }

  // Validate PIN if provided
  if (pin) {
    if (!isValidPin(pin)) {
      return validationError(res, 'PIN must be 4-6 digits');
    }
    const pinTaken = await isPinTaken(pin);
    if (pinTaken) {
      return res.status(409).json({
        error: { code: 'PIN_TAKEN', message: 'This PIN is already in use' },
      });
    }
  }

  try {
    const result: any = await q(
      `INSERT INTO users (displayName, nickname, email, roleId, color, kioskOnly, active)
       VALUES (?, ?, ?, ?, ?, 0, 1)`,
      [displayName.trim(), nickname?.trim() || null, email?.trim().toLowerCase() || null, role, color || null]
    );

    const userId = result.insertId as number;

    // Set password if provided
    if (password && password.length >= 8) {
      const { salt, hash } = await hashSecret(password);
      await q(
        `INSERT INTO credentials (userId, provider, algo, salt, hash) VALUES (?, 'password', 'argon2id', ?, ?)`,
        [userId, salt, hash]
      );
    }

    // Set PIN if provided
    if (pin && isValidPin(pin)) {
      const { salt, hash } = await hashSecret(pin);
      await q(
        `INSERT INTO credentials (userId, provider, algo, salt, hash) VALUES (?, 'kiosk_pin', 'argon2id', ?, ?)`,
        [userId, salt, hash]
      );
    }

    await logAudit({
      action: 'family.member.create',
      result: 'ok',
      actorId: admin.id,
      details: { userId, displayName: displayName.trim(), role },
    });

    return created(res, {
      member: {
        id: userId,
        displayName: displayName.trim(),
        nickname: nickname?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        role,
        color: color || null,
        active: true,
        hasPassword: Boolean(password && password.length >= 8),
        hasPin: Boolean(pin && isValidPin(pin)),
      },
    });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/family/members/:id
 * Update a family member (admin only)
 */
export async function updateMember(req: Request, res: Response) {
  const admin = getUser(req);
  if (!admin) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const memberId = Number(req.params.id);
  const { displayName, nickname, email, role, color, active } = req.body;

  if (!memberId) {
    return validationError(res, 'Invalid member ID');
  }

  try {
    // Check if the user exists and is not a kiosk-only user
    const [existing] = await q<Array<{ id: number; kioskOnly: number }>>(
      'SELECT id, kioskOnly FROM users WHERE id = ?',
      [memberId]
    );

    if (!existing) {
      return notFound(res, 'Member not found');
    }

    // Prevent editing kiosk-only users
    if (existing.kioskOnly === 1) {
      return forbidden(res, 'Cannot edit kiosk user');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (displayName !== undefined) {
      updates.push('displayName = ?');
      params.push(displayName.trim());
    }
    if (nickname !== undefined) {
      updates.push('nickname = ?');
      params.push(nickname?.trim() || null);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email?.trim().toLowerCase() || null);
    }
    if (role !== undefined) {
      updates.push('roleId = ?');
      params.push(role);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color || null);
    }
    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(memberId);
      await q(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    await logAudit({
      action: 'family.member.update',
      result: 'ok',
      actorId: admin.id,
      details: { memberId },
    });

    return res.status(204).end();
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/family/members/:id
 * Deactivate a family member (admin only)
 */
export async function deleteMember(req: Request, res: Response) {
  const admin = getUser(req);
  if (!admin) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const memberId = Number(req.params.id);

  if (!memberId) {
    return validationError(res, 'Invalid member ID');
  }

  // Prevent deleting yourself or kiosk user
  if (memberId === admin.id) {
    return forbidden(res, 'Cannot delete yourself');
  }
  if (memberId === 1) {
    return forbidden(res, 'Cannot delete kiosk user');
  }

  try {
    await q('UPDATE users SET active = 0 WHERE id = ?', [memberId]);

    await logAudit({
      action: 'family.member.delete',
      result: 'ok',
      actorId: admin.id,
      details: { memberId },
    });

    return res.status(204).end();
  } catch (err) {
    return serverError(res, err as Error);
  }
}
