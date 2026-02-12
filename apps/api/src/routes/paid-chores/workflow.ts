// apps/api/src/routes/paid-chores/workflow.ts
// Paid Chores workflow: claim, complete, verify, reject

import { Request, Response } from 'express';
import { q } from '../../db';
import { createNotification } from '../messages';
import { queueEmail, getUserEmail } from '../../email/queue';
import { getUser } from '../../utils/auth';
import { authRequired, forbidden, invalidInput, notFound, serverError } from '../../utils/errors';
import { createLogger } from '../../services/logger';

const log = createLogger('paid-chores');

// =============================================================================
// CLAIM PAID CHORE (Race - first wins!)
// =============================================================================

export async function claimPaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    // Use a transaction to ensure only one person can claim
    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ? FOR UPDATE', [id]);

    if (chores.length === 0) {
      return notFound(res, 'Paid chore');
    }

    const chore = chores[0];

    if (chore.status !== 'available') {
      return invalidInput(res, 'This chore has already been claimed!');
    }

    // Check if expired
    if (chore.expiresAt && new Date(chore.expiresAt) < new Date()) {
      await q('UPDATE paid_chores SET status = ? WHERE id = ?', ['cancelled', id]);
      return invalidInput(res, 'This chore has expired');
    }

    // Claim it!
    await q(`
      UPDATE paid_chores
      SET status = 'claimed', claimedBy = ?, claimedAt = NOW(3)
      WHERE id = ? AND status = 'available'
    `, [user.id, id]);

    // Verify the claim worked (race condition check)
    const updated = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    if (updated[0].claimedBy !== user.id) {
      return invalidInput(res, 'Someone else claimed this chore first!');
    }

    log.info('Paid chore claimed', { choreId: id, choreTitle: chore.title, claimedBy: user.id });

    // Notify admins that chore was claimed
    const admins = await q<Array<{ id: number; email: string | null; displayName: string }>>(
      `SELECT id, email, displayName FROM users WHERE roleId = 'admin' AND active = 1`,
    );
    const [claimerInfo] = await q<Array<{ displayName: string }>>(
      'SELECT displayName FROM users WHERE id = ?',
      [user.id],
    );

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'chore',
        title: 'Paid chore claimed!',
        body: `${claimerInfo?.displayName || 'Someone'} claimed "${updated[0].title}"`,
        link: '/paid-chores',
      });
    }

    res.json({ chore: updated[0], message: 'You claimed the chore! Complete it to earn the reward.' });
  } catch (err) {
    console.error('Failed to claim paid chore:', err);
    serverError(res, 'Failed to claim paid chore');
  }
}

// =============================================================================
// COMPLETE PAID CHORE (Mark as done by claimer)
// =============================================================================

export async function completePaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;
    const { notes, photoUrl } = req.body;

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    if (chores.length === 0) {
      return notFound(res, 'Paid chore');
    }

    const chore = chores[0];

    if (chore.status !== 'claimed') {
      return invalidInput(res, 'Chore must be claimed before completing');
    }

    if (chore.claimedBy !== user.id) {
      return forbidden(res, 'Only the person who claimed this chore can complete it');
    }

    if (chore.requirePhoto && !photoUrl) {
      return invalidInput(res, 'A photo is required to complete this chore');
    }

    await q(`
      UPDATE paid_chores
      SET status = 'completed', completedAt = NOW(3), completionNotes = ?, completionPhotoUrl = ?
      WHERE id = ?
    `, [notes, photoUrl, id]);

    const updated = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    log.info('Paid chore completed', { choreId: id, choreTitle: chore.title, completedBy: user.id });

    // Notify admins that chore was completed and needs verification
    const admins = await q<Array<{ id: number; email: string | null; displayName: string }>>(
      `SELECT id, email, displayName FROM users WHERE roleId = 'admin' AND active = 1`,
    );
    const [completerInfo] = await q<Array<{ displayName: string }>>(
      'SELECT displayName FROM users WHERE id = ?',
      [user.id],
    );

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'chore',
        title: 'Paid chore needs verification',
        body: `${completerInfo?.displayName || 'Someone'} completed "${updated[0].title}" - ready for review`,
        link: '/paid-chores',
      });

      if (admin.email) {
        await queueEmail({
          userId: admin.id,
          toEmail: admin.email,
          template: 'PAID_CHORE_UPDATE',
          variables: {
            userName: admin.displayName,
            choreName: updated[0].title,
            message: `${completerInfo?.displayName || 'Someone'} has completed this chore and it's ready for your verification.`,
          },
        });
      }
    }

    res.json({ chore: updated[0], message: 'Chore marked as complete! Waiting for admin verification.' });
  } catch (err) {
    console.error('Failed to complete paid chore:', err);
    serverError(res, 'Failed to complete paid chore');
  }
}

// =============================================================================
// VERIFY PAID CHORE (Admin approves and pays out)
// =============================================================================

export async function verifyPaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    if (user.roleId !== 'admin') {
      return forbidden(res, 'Only admins can verify paid chores');
    }

    const { id } = req.params;

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    if (chores.length === 0) {
      return notFound(res, 'Paid chore');
    }

    const chore = chores[0];

    if (chore.status !== 'completed') {
      return invalidInput(res, 'Chore must be completed before verification');
    }

    // Verify the chore
    await q(`
      UPDATE paid_chores
      SET status = 'verified', verifiedAt = NOW(3), verifiedBy = ?
      WHERE id = ?
    `, [user.id, id]);

    // Record the earning
    await q(`
      INSERT INTO paid_chore_earnings (userId, paidChoreId, amount)
      VALUES (?, ?, ?)
    `, [chore.claimedBy, id, chore.amount]);

    const updated = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    log.info('Paid chore verified', { choreId: id, choreTitle: chore.title, amount: chore.amount, earnerId: chore.claimedBy, verifiedBy: user.id });

    // Notify the user who completed it that they earned the money
    const earnerEmail = await getUserEmail(chore.claimedBy);
    if (earnerEmail) {
      const [earnerInfo] = await q<Array<{ displayName: string }>>(
        'SELECT displayName FROM users WHERE id = ?',
        [chore.claimedBy],
      );
      await queueEmail({
        userId: chore.claimedBy,
        toEmail: earnerEmail,
        template: 'PAID_CHORE_UPDATE',
        variables: {
          userName: earnerInfo?.displayName || 'there',
          choreName: chore.title,
          message: `Congratulations! Your chore has been verified and you earned $${Number(chore.amount).toFixed(2)}!`,
        },
      });
    }

    // Also send in-app notification
    await createNotification({
      userId: chore.claimedBy,
      type: 'chore',
      title: '💰 You earned money!',
      body: `Your completed "${chore.title}" was verified. +$${Number(chore.amount).toFixed(2)}`,
      link: '/paid-chores',
    });

    res.json({ chore: updated[0], message: 'Chore verified! Payment has been recorded.' });
  } catch (err) {
    console.error('Failed to verify paid chore:', err);
    serverError(res, 'Failed to verify paid chore');
  }
}

// =============================================================================
// REJECT PAID CHORE (Admin rejects, chore goes back to available or cancelled)
// =============================================================================

export async function rejectPaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    if (user.roleId !== 'admin') {
      return forbidden(res, 'Only admins can reject paid chores');
    }

    const { id } = req.params;
    const { reopen = true } = req.body; // Whether to make chore available again

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    if (chores.length === 0) {
      return notFound(res, 'Paid chore');
    }

    const chore = chores[0];

    if (chore.status !== 'completed' && chore.status !== 'claimed') {
      return invalidInput(res, 'Can only reject claimed or completed chores');
    }

    const newStatus = reopen ? 'available' : 'cancelled';

    // Notify the user who had claimed/completed it
    const previousClaimer = chore.claimedBy;

    await q(`
      UPDATE paid_chores
      SET status = ?, claimedBy = NULL, claimedAt = NULL, completedAt = NULL, completionNotes = NULL, completionPhotoUrl = NULL
      WHERE id = ?
    `, [newStatus, id]);

    const updated = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    log.info('Paid chore rejected', { choreId: id, choreTitle: chore.title, previousClaimer, reopened: reopen, rejectedBy: user.id });

    // Notify the user who was working on it
    if (previousClaimer) {
      await createNotification({
        userId: previousClaimer,
        type: 'chore',
        title: 'Paid chore rejected',
        body: reopen
          ? `"${chore.title}" was rejected and reopened for others.`
          : `"${chore.title}" was rejected and cancelled.`,
        link: '/paid-chores',
      });

      const claimerEmail = await getUserEmail(previousClaimer);
      if (claimerEmail) {
        const [claimerInfo] = await q<Array<{ displayName: string }>>(
          'SELECT displayName FROM users WHERE id = ?',
          [previousClaimer],
        );
        await queueEmail({
          userId: previousClaimer,
          toEmail: claimerEmail,
          template: 'PAID_CHORE_UPDATE',
          variables: {
            userName: claimerInfo?.displayName || 'there',
            choreName: chore.title,
            message: reopen
              ? 'Your work on this chore was not approved. The chore is now available for others to claim.'
              : 'Your work on this chore was not approved and the chore has been cancelled.',
          },
        });
      }
    }

    res.json({
      chore: updated[0],
      message: reopen ? 'Chore rejected and reopened for others to claim.' : 'Chore rejected and cancelled.'
    });
  } catch (err) {
    console.error('Failed to reject paid chore:', err);
    serverError(res, 'Failed to reject paid chore');
  }
}
