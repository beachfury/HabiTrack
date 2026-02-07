// apps/api/src/routes/colors.ts
// Color swatches and recent colors API

import { Router } from 'express';
import type { Request, Response } from 'express';
import { q } from '../db';
import { requireAuth } from '../middleware.auth';

// Helper to get user from request
function getUser(req: Request) {
  return (req as any).user as
    | {
        id: number;
        displayName: string;
        roleId: 'admin' | 'member' | 'kid' | 'kiosk';
      }
    | undefined;
}

const router = Router();

// All routes require authentication
router.use(requireAuth());

// =============================================================================
// GET /api/colors/swatches - Get all color swatches (default + user's custom)
// =============================================================================
router.get('/swatches', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const userId = user?.id || 0;

    // Get default swatches + user's custom swatches
    const rows = await q<any[]>(
      `SELECT id, name, hexColor, isDefault, sortOrder, createdBy, createdAt
       FROM color_swatches
       WHERE isDefault = 1 OR createdBy = ?
       ORDER BY isDefault DESC, sortOrder ASC, name ASC`,
      [userId],
    );

    res.json({ swatches: rows });
  } catch (err) {
    console.error('Failed to get swatches:', err);
    res.status(500).json({ error: 'Failed to get swatches' });
  }
});

// =============================================================================
// POST /api/colors/swatches - Create a custom swatch
// =============================================================================
router.post('/swatches', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, hexColor } = req.body;

    if (!hexColor || !/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
      return res.status(400).json({ error: 'Invalid hex color format' });
    }

    // Check if user already has this color
    const existing = await q<any[]>(
      'SELECT id FROM color_swatches WHERE hexColor = ? AND createdBy = ?',
      [hexColor.toUpperCase(), user.id],
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Color already saved' });
    }

    const result = await q<any>(
      `INSERT INTO color_swatches (name, hexColor, isDefault, createdBy, sortOrder)
       VALUES (?, ?, 0, ?, 999)`,
      [name || null, hexColor.toUpperCase(), user.id],
    );

    res.json({
      id: result.insertId,
      hexColor: hexColor.toUpperCase(),
      name,
    });
  } catch (err) {
    console.error('Failed to create swatch:', err);
    res.status(500).json({ error: 'Failed to create swatch' });
  }
});

// =============================================================================
// DELETE /api/colors/swatches/:id - Delete a custom swatch
// =============================================================================
router.delete('/swatches/:id', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Only allow deleting user's own non-default swatches
    const result = await q<any>(
      'DELETE FROM color_swatches WHERE id = ? AND createdBy = ? AND isDefault = 0',
      [id, user.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Swatch not found or cannot be deleted' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete swatch:', err);
    res.status(500).json({ error: 'Failed to delete swatch' });
  }
});

// =============================================================================
// GET /api/colors/recent - Get user's recent colors
// =============================================================================
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) {
      return res.json({ colors: [] });
    }

    const rows = await q<any[]>(
      `SELECT hexColor, usedAt
       FROM recent_colors
       WHERE userId = ?
       ORDER BY usedAt DESC
       LIMIT 10`,
      [user.id],
    );

    res.json({ colors: rows });
  } catch (err) {
    console.error('Failed to get recent colors:', err);
    res.status(500).json({ error: 'Failed to get recent colors' });
  }
});

// =============================================================================
// POST /api/colors/recent - Track a color usage
// =============================================================================
router.post('/recent', async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { hexColor } = req.body;

    if (!hexColor || !/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
      return res.status(400).json({ error: 'Invalid hex color format' });
    }

    const normalizedColor = hexColor.toUpperCase();

    // Delete existing entry for this color (if any)
    await q('DELETE FROM recent_colors WHERE userId = ? AND hexColor = ?', [
      user.id,
      normalizedColor,
    ]);

    // Insert new entry
    await q('INSERT INTO recent_colors (userId, hexColor, usedAt) VALUES (?, ?, NOW())', [
      user.id,
      normalizedColor,
    ]);

    // Keep only last 20 recent colors per user
    await q(
      `DELETE FROM recent_colors
       WHERE userId = ? AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM recent_colors WHERE userId = ? ORDER BY usedAt DESC LIMIT 20
         ) AS keep
       )`,
      [user.id, user.id],
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to track recent color:', err);
    res.status(500).json({ error: 'Failed to track recent color' });
  }
});

export default router;
