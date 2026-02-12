// apps/api/src/routes/paid-chores/crud.ts
// Paid Chores CRUD operations

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { q } from '../../db';
import { createAnnouncementInternal } from '../messages';
import { queueEmail, getActiveUsersWithEmail } from '../../email/queue';
import { getUser } from '../../utils/auth';
import { authRequired, forbidden, invalidInput, notFound, serverError } from '../../utils/errors';
import { createLogger } from '../../services/logger';

const log = createLogger('paid-chores');

// =============================================================================
// SHARED SQL FRAGMENT
// =============================================================================

const PAID_CHORE_SELECT = `
  SELECT
    pc.*,
    cc.name as categoryName,
    cc.icon as categoryIcon,
    cc.color as categoryColor,
    creator.displayName as creatorName,
    claimer.displayName as claimerName,
    claimer.color as claimerColor,
    verifier.displayName as verifierName
  FROM paid_chores pc
  LEFT JOIN chore_categories cc ON pc.categoryId = cc.id
  LEFT JOIN users creator ON pc.createdBy = creator.id
  LEFT JOIN users claimer ON pc.claimedBy = claimer.id
  LEFT JOIN users verifier ON pc.verifiedBy = verifier.id
`;

// =============================================================================
// LIST PAID CHORES
// =============================================================================

export async function listPaidChores(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { status } = req.query;

    let sql = `${PAID_CHORE_SELECT} WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      sql += ' AND pc.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY pc.createdAt DESC';

    const chores = await q<any[]>(sql, params);

    res.json({ chores });
  } catch (err) {
    console.error('Failed to list paid chores:', err);
    serverError(res, 'Failed to list paid chores');
  }
}

// =============================================================================
// GET SINGLE PAID CHORE
// =============================================================================

export async function getPaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    const chores = await q<any[]>(`${PAID_CHORE_SELECT} WHERE pc.id = ?`, [id]);

    if (chores.length === 0) {
      return notFound(res, 'Paid chore');
    }

    res.json({ chore: chores[0] });
  } catch (err) {
    console.error('Failed to get paid chore:', err);
    serverError(res, 'Failed to get paid chore');
  }
}

// =============================================================================
// CREATE PAID CHORE (Admin only)
// =============================================================================

export async function createPaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    if (user.roleId !== 'admin') {
      return forbidden(res, 'Only admins can create paid chores');
    }

    const {
      title,
      description,
      amount,
      categoryId,
      difficulty = 'medium',
      estimatedMinutes,
      requirePhoto = false,
      expiresAt,
    } = req.body;

    if (!title || typeof amount !== 'number' || amount <= 0) {
      return invalidInput(res, 'Title and positive amount are required');
    }

    const id = uuidv4();

    await q(`
      INSERT INTO paid_chores (id, title, description, amount, categoryId, difficulty, estimatedMinutes, requirePhoto, expiresAt, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, title, description, amount, categoryId, difficulty, estimatedMinutes, requirePhoto ? 1 : 0, expiresAt, user.id]);

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    log.info('Paid chore created', { choreId: id, title, amount, createdBy: user.id });

    // Create announcement for all users
    const amountFormatted = `$${Number(amount).toFixed(2)}`;
    await createAnnouncementInternal({
      fromUserId: user.id,
      title: `💰 New Paid Chore: ${title}`,
      body: `A new paid chore worth ${amountFormatted} is available! First one to claim it wins. ${description || ''}`.trim(),
      priority: 'high',
      link: '/paid-chores',
    });

    // Also send specific "paid chore available" email to all users (including admin)
    const allUsersWithEmail = await getActiveUsersWithEmail();
    for (const recipient of allUsersWithEmail) {
      await queueEmail({
        userId: recipient.id,
        toEmail: recipient.email,
        template: 'PAID_CHORE_AVAILABLE',
        variables: {
          userName: recipient.displayName,
          choreName: title,
          amount: amountFormatted,
          description: description || 'No description provided.',
        },
      });
    }

    res.status(201).json({ chore: chores[0] });
  } catch (err) {
    console.error('Failed to create paid chore:', err);
    serverError(res, 'Failed to create paid chore');
  }
}

// =============================================================================
// UPDATE PAID CHORE (Admin only)
// =============================================================================

export async function updatePaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    if (user.roleId !== 'admin') {
      return forbidden(res, 'Only admins can update paid chores');
    }

    const { id } = req.params;
    const {
      title,
      description,
      amount,
      categoryId,
      difficulty,
      estimatedMinutes,
      requirePhoto,
      expiresAt,
    } = req.body;

    // Check if chore exists and is still available
    const existing = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);
    if (existing.length === 0) {
      return notFound(res, 'Paid chore');
    }

    if (existing[0].status !== 'available') {
      return invalidInput(res, 'Can only update available chores');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (amount !== undefined) { updates.push('amount = ?'); params.push(amount); }
    if (categoryId !== undefined) { updates.push('categoryId = ?'); params.push(categoryId); }
    if (difficulty !== undefined) { updates.push('difficulty = ?'); params.push(difficulty); }
    if (estimatedMinutes !== undefined) { updates.push('estimatedMinutes = ?'); params.push(estimatedMinutes); }
    if (requirePhoto !== undefined) { updates.push('requirePhoto = ?'); params.push(requirePhoto ? 1 : 0); }
    if (expiresAt !== undefined) { updates.push('expiresAt = ?'); params.push(expiresAt); }

    if (updates.length === 0) {
      return invalidInput(res, 'No updates provided');
    }

    params.push(id);
    await q(`UPDATE paid_chores SET ${updates.join(', ')} WHERE id = ?`, params);

    log.info('Paid chore updated', { choreId: id, updatedBy: user.id });

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);
    res.json({ chore: chores[0] });
  } catch (err) {
    log.error('Failed to update paid chore', { choreId: id, error: String(err) });
    serverError(res, 'Failed to update paid chore');
  }
}

// =============================================================================
// DELETE PAID CHORE (Admin only)
// =============================================================================

export async function deletePaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    if (user.roleId !== 'admin') {
      return forbidden(res, 'Only admins can delete paid chores');
    }

    const { id } = req.params;

    const existing = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);
    if (existing.length === 0) {
      return notFound(res, 'Paid chore');
    }

    await q('DELETE FROM paid_chores WHERE id = ?', [id]);

    log.info('Paid chore deleted', { choreId: id, deletedBy: user.id });

    res.json({ success: true });
  } catch (err) {
    log.error('Failed to delete paid chore', { choreId: id, error: String(err) });
    serverError(res, 'Failed to delete paid chore');
  }
}
