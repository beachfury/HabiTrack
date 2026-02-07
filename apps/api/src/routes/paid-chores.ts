// apps/api/src/routes/paid-chores.ts
// Paid Chores / Chore Race feature - users race to claim paid chores

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { q } from '../db';
import { createAnnouncementInternal } from './messages';

// Helper to get user from request
function getUser(req: Request) {
  return (req as any).user as { id: number; roleId: string } | undefined;
}

// ============================================
// LIST PAID CHORES
// ============================================
export async function listPaidChores(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status } = req.query;

    let sql = `
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
      WHERE 1=1
    `;
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
    res.status(500).json({ error: 'Failed to list paid chores' });
  }
}

// ============================================
// GET SINGLE PAID CHORE
// ============================================
export async function getPaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const chores = await q<any[]>(`
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
      WHERE pc.id = ?
    `, [id]);

    if (chores.length === 0) {
      return res.status(404).json({ error: 'Paid chore not found' });
    }

    res.json({ chore: chores[0] });
  } catch (err) {
    console.error('Failed to get paid chore:', err);
    res.status(500).json({ error: 'Failed to get paid chore' });
  }
}

// ============================================
// CREATE PAID CHORE (Admin only)
// ============================================
export async function createPaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (user.roleId !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create paid chores' });
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
      return res.status(400).json({ error: 'Title and positive amount are required' });
    }

    const id = uuidv4();

    await q(`
      INSERT INTO paid_chores (id, title, description, amount, categoryId, difficulty, estimatedMinutes, requirePhoto, expiresAt, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, title, description, amount, categoryId, difficulty, estimatedMinutes, requirePhoto ? 1 : 0, expiresAt, user.id]);

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    // Create announcement for all users
    const amountFormatted = `$${Number(amount).toFixed(2)}`;
    await createAnnouncementInternal({
      fromUserId: user.id,
      title: `💰 New Paid Chore: ${title}`,
      body: `A new paid chore worth ${amountFormatted} is available! First one to claim it wins. ${description || ''}`.trim(),
      priority: 'high',
      link: '/paid-chores',
    });

    res.status(201).json({ chore: chores[0] });
  } catch (err) {
    console.error('Failed to create paid chore:', err);
    res.status(500).json({ error: 'Failed to create paid chore' });
  }
}

// ============================================
// UPDATE PAID CHORE (Admin only)
// ============================================
export async function updatePaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (user.roleId !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update paid chores' });
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
      return res.status(404).json({ error: 'Paid chore not found' });
    }

    if (existing[0].status !== 'available') {
      return res.status(400).json({ error: 'Can only update available chores' });
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
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(id);
    await q(`UPDATE paid_chores SET ${updates.join(', ')} WHERE id = ?`, params);

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);
    res.json({ chore: chores[0] });
  } catch (err) {
    console.error('Failed to update paid chore:', err);
    res.status(500).json({ error: 'Failed to update paid chore' });
  }
}

// ============================================
// DELETE PAID CHORE (Admin only)
// ============================================
export async function deletePaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (user.roleId !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete paid chores' });
    }

    const { id } = req.params;

    const existing = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Paid chore not found' });
    }

    await q('DELETE FROM paid_chores WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete paid chore:', err);
    res.status(500).json({ error: 'Failed to delete paid chore' });
  }
}

// ============================================
// CLAIM PAID CHORE (Race - first wins!)
// ============================================
export async function claimPaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Use a transaction to ensure only one person can claim
    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ? FOR UPDATE', [id]);

    if (chores.length === 0) {
      return res.status(404).json({ error: 'Paid chore not found' });
    }

    const chore = chores[0];

    if (chore.status !== 'available') {
      return res.status(400).json({ error: 'This chore has already been claimed!' });
    }

    // Check if expired
    if (chore.expiresAt && new Date(chore.expiresAt) < new Date()) {
      await q('UPDATE paid_chores SET status = ? WHERE id = ?', ['cancelled', id]);
      return res.status(400).json({ error: 'This chore has expired' });
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
      return res.status(400).json({ error: 'Someone else claimed this chore first!' });
    }

    res.json({ chore: updated[0], message: 'You claimed the chore! Complete it to earn the reward.' });
  } catch (err) {
    console.error('Failed to claim paid chore:', err);
    res.status(500).json({ error: 'Failed to claim paid chore' });
  }
}

// ============================================
// COMPLETE PAID CHORE (Mark as done by claimer)
// ============================================
export async function completePaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { notes, photoUrl } = req.body;

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    if (chores.length === 0) {
      return res.status(404).json({ error: 'Paid chore not found' });
    }

    const chore = chores[0];

    if (chore.status !== 'claimed') {
      return res.status(400).json({ error: 'Chore must be claimed before completing' });
    }

    if (chore.claimedBy !== user.id) {
      return res.status(403).json({ error: 'Only the person who claimed this chore can complete it' });
    }

    if (chore.requirePhoto && !photoUrl) {
      return res.status(400).json({ error: 'A photo is required to complete this chore' });
    }

    await q(`
      UPDATE paid_chores
      SET status = 'completed', completedAt = NOW(3), completionNotes = ?, completionPhotoUrl = ?
      WHERE id = ?
    `, [notes, photoUrl, id]);

    const updated = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    res.json({ chore: updated[0], message: 'Chore marked as complete! Waiting for admin verification.' });
  } catch (err) {
    console.error('Failed to complete paid chore:', err);
    res.status(500).json({ error: 'Failed to complete paid chore' });
  }
}

// ============================================
// VERIFY PAID CHORE (Admin approves and pays out)
// ============================================
export async function verifyPaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (user.roleId !== 'admin') {
      return res.status(403).json({ error: 'Only admins can verify paid chores' });
    }

    const { id } = req.params;

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    if (chores.length === 0) {
      return res.status(404).json({ error: 'Paid chore not found' });
    }

    const chore = chores[0];

    if (chore.status !== 'completed') {
      return res.status(400).json({ error: 'Chore must be completed before verification' });
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

    res.json({ chore: updated[0], message: 'Chore verified! Payment has been recorded.' });
  } catch (err) {
    console.error('Failed to verify paid chore:', err);
    res.status(500).json({ error: 'Failed to verify paid chore' });
  }
}

// ============================================
// REJECT PAID CHORE (Admin rejects, chore goes back to available or cancelled)
// ============================================
export async function rejectPaidChore(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (user.roleId !== 'admin') {
      return res.status(403).json({ error: 'Only admins can reject paid chores' });
    }

    const { id } = req.params;
    const { reopen = true } = req.body; // Whether to make chore available again

    const chores = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    if (chores.length === 0) {
      return res.status(404).json({ error: 'Paid chore not found' });
    }

    const chore = chores[0];

    if (chore.status !== 'completed' && chore.status !== 'claimed') {
      return res.status(400).json({ error: 'Can only reject claimed or completed chores' });
    }

    const newStatus = reopen ? 'available' : 'cancelled';

    await q(`
      UPDATE paid_chores
      SET status = ?, claimedBy = NULL, claimedAt = NULL, completedAt = NULL, completionNotes = NULL, completionPhotoUrl = NULL
      WHERE id = ?
    `, [newStatus, id]);

    const updated = await q<any[]>('SELECT * FROM paid_chores WHERE id = ?', [id]);

    res.json({
      chore: updated[0],
      message: reopen ? 'Chore rejected and reopened for others to claim.' : 'Chore rejected and cancelled.'
    });
  } catch (err) {
    console.error('Failed to reject paid chore:', err);
    res.status(500).json({ error: 'Failed to reject paid chore' });
  }
}

// ============================================
// GET EARNINGS (User's total earnings)
// ============================================
export async function getEarnings(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.query;

    // Admins can view anyone's earnings, others can only view their own
    const targetUserId = user.roleId === 'admin' && userId ? userId : user.id;

    // Get total earnings
    const totals = await q<any[]>(`
      SELECT COALESCE(SUM(amount), 0) as totalEarnings
      FROM paid_chore_earnings
      WHERE userId = ?
    `, [targetUserId]);

    // Get earnings history
    const history = await q<any[]>(`
      SELECT
        pce.*,
        pc.title as choreTitle,
        pc.description as choreDescription
      FROM paid_chore_earnings pce
      JOIN paid_chores pc ON pce.paidChoreId = pc.id
      WHERE pce.userId = ?
      ORDER BY pce.earnedAt DESC
      LIMIT 50
    `, [targetUserId]);

    // Get user info
    const users = await q<any[]>('SELECT id, displayName, color FROM users WHERE id = ?', [targetUserId]);

    res.json({
      user: users[0],
      totalEarnings: parseFloat(totals[0].totalEarnings),
      history,
    });
  } catch (err) {
    console.error('Failed to get earnings:', err);
    res.status(500).json({ error: 'Failed to get earnings' });
  }
}

// ============================================
// GET LEADERBOARD (Top earners)
// ============================================
export async function getEarningsLeaderboard(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const leaderboard = await q<any[]>(`
      SELECT
        u.id,
        u.displayName,
        u.nickname,
        u.color,
        u.avatarUrl,
        COALESCE(SUM(pce.amount), 0) as totalEarnings,
        COUNT(pce.id) as choresCompleted
      FROM users u
      LEFT JOIN paid_chore_earnings pce ON u.id = pce.userId
      WHERE u.active = 1
      GROUP BY u.id
      ORDER BY totalEarnings DESC
      LIMIT 20
    `);

    res.json({ leaderboard });
  } catch (err) {
    console.error('Failed to get earnings leaderboard:', err);
    res.status(500).json({ error: 'Failed to get earnings leaderboard' });
  }
}
