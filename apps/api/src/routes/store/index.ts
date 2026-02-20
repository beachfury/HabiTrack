// apps/api/src/routes/store/index.ts
// Store/marketplace routes — browse catalog, request installs

import type { Request, Response } from 'express';
import { q } from '../../db';
import { getUser } from '../../utils/auth';
import { authRequired, forbidden, invalidInput, notFound, serverError } from '../../utils/errors';

// ============================================
// Built-in widget manifests (always available)
// ============================================
const BUILT_IN_WIDGETS = [
  { id: 'welcome', name: 'Welcome', description: 'Personalized greeting', category: 'general', icon: 'sparkles', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['greeting', 'welcome'] },
  { id: 'quick-stats', name: 'Quick Stats', description: 'At-a-glance summary', category: 'general', icon: 'bar-chart-3', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['stats', 'overview'] },
  { id: 'todays-events', name: "Today's Events", description: 'Calendar events for today', category: 'calendar', icon: 'calendar', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['calendar', 'events'] },
  { id: 'upcoming-events', name: 'Upcoming Events', description: 'Events in the next few days', category: 'calendar', icon: 'calendar', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['calendar', 'upcoming'] },
  { id: 'todays-chores', name: "Today's Chores", description: 'Chores assigned today', category: 'chores', icon: 'check-square', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['chores', 'tasks'] },
  { id: 'my-chores', name: 'My Chores', description: 'Your personal chore list', category: 'chores', icon: 'list-checks', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['chores', 'personal'] },
  { id: 'chore-leaderboard', name: 'Chore Leaderboard', description: 'Family rankings', category: 'chores', icon: 'trophy', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['leaderboard', 'points'] },
  { id: 'shopping-list', name: 'Shopping List', description: 'Quick shopping list view', category: 'shopping', icon: 'shopping-cart', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['shopping', 'groceries'] },
  { id: 'paid-chores', name: 'Paid Chores', description: 'Available paid chores', category: 'finance', icon: 'dollar-sign', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['chores', 'paid', 'money'] },
  { id: 'earnings', name: 'My Earnings', description: 'Total earnings from paid chores', category: 'finance', icon: 'wallet', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['earnings', 'finance'] },
  { id: 'family-members', name: 'Family Members', description: 'See who is in your family', category: 'family', icon: 'users', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['family', 'members'] },
  { id: 'announcements', name: 'Announcements', description: 'Family announcements', category: 'messages', icon: 'megaphone', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['announcements', 'messages'] },
  { id: 'weather', name: 'Weather', description: 'Current weather via Open-Meteo', category: 'general', icon: 'cloud-sun', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['weather', 'forecast'] },
  { id: 'upcoming-meals', name: 'Upcoming Meals', description: 'Meal plans and voting', category: 'meals', icon: 'utensils-crossed', version: '1.0.0', author: 'HabiTrack', builtIn: true, tags: ['meals', 'food'] },
];

// ============================================
// GET /api/store/catalog - Browse all items
// ============================================
export async function getCatalog(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    // Widgets: query from database (with hardcoded fallback)
    let widgets;
    try {
      const dbWidgets = await q<any[]>(`
        SELECT id, name, description, icon, category, version, author,
               defaultW, defaultH, configSchema IS NOT NULL as hasConfigSchema,
               tags, builtIn
        FROM dashboard_widgets
        WHERE active = 1
        ORDER BY sortOrder ASC
      `);
      widgets = dbWidgets.map((w: any) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        icon: w.icon,
        category: w.category,
        version: w.version,
        author: w.author,
        builtIn: Boolean(w.builtIn),
        tags: typeof w.tags === 'string' ? JSON.parse(w.tags) : (w.tags ?? []),
        size: { defaultW: w.defaultW, defaultH: w.defaultH },
        hasConfigSchema: Boolean(w.hasConfigSchema),
      }));
    } catch {
      // Table doesn't exist, use hardcoded fallback
      widgets = BUILT_IN_WIDGETS;
    }

    // Themes: public themes from the database
    let themeSql = `
      SELECT id, name, description, semver AS version, author, source, tags,
             isPublic, isApprovedForKids, colorsLight, createdAt
      FROM themes
      WHERE isPublic = 1
    `;
    const params: any[] = [];

    // Kids only see kid-approved themes
    if (user.roleId === 'kid') {
      themeSql += ' AND isApprovedForKids = 1';
    }

    themeSql += ' ORDER BY name ASC';

    const themes = await q<any[]>(themeSql, params);

    // Parse tags + extract preview colors + derive category from source
    const parsedThemes = themes.map((t: any) => {
      let previewColors = null;
      try {
        const colors = typeof t.colorsLight === 'string' ? JSON.parse(t.colorsLight) : (t.colorsLight || {});
        previewColors = {
          primary: colors.primary || '#3cb371',
          accent: colors.accent || '#3cb371',
          background: colors.background || '#ffffff',
          card: colors.card || '#ffffff',
          foreground: colors.foreground || '#3d4f5f',
        };
      } catch {
        // ignore parse errors
      }

      // Derive category from source column
      const category = t.source === 'built-in' ? 'official' : t.source === 'imported' ? 'imported' : 'custom';

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        version: t.version,
        author: t.author,
        source: t.source,
        category,
        tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : (t.tags ?? []),
        builtIn: t.source === 'built-in',
        isApprovedForKids: Boolean(t.isApprovedForKids),
        previewColors,
        createdAt: t.createdAt,
      };
    });

    res.json({ widgets, themes: parsedThemes });
  } catch (err) {
    console.error('Failed to fetch store catalog:', err);
    serverError(res, 'Failed to fetch store catalog');
  }
}

// ============================================
// POST /api/store/requests - Submit install request
// ============================================
export async function createRequest(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { itemType, itemId, itemName, message } = req.body;

    // Validate required fields
    if (!itemType || !itemId || !itemName) {
      return invalidInput(res, 'itemType, itemId, and itemName are required');
    }

    // Validate itemType
    if (itemType !== 'widget' && itemType !== 'theme') {
      return invalidInput(res, 'itemType must be "widget" or "theme"');
    }

    // Validate field lengths
    if (typeof itemId !== 'string' || itemId.length > 255) {
      return invalidInput(res, 'itemId must be a string of 255 characters or fewer');
    }
    if (typeof itemName !== 'string' || itemName.length > 255) {
      return invalidInput(res, 'itemName must be a string of 255 characters or fewer');
    }
    if (message && (typeof message !== 'string' || message.length > 1000)) {
      return invalidInput(res, 'message must be a string of 1000 characters or fewer');
    }

    const result = await q<any>(
      `INSERT INTO marketplace_requests (userId, itemType, itemId, itemName, message, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [user.id, itemType, itemId, itemName, message || null],
    );

    const insertId = result.insertId;

    // Fetch the created request
    const rows = await q<any[]>(
      `SELECT id, userId, itemType, itemId, itemName, message, status, reviewedBy, createdAt, reviewedAt
       FROM marketplace_requests WHERE id = ?`,
      [insertId],
    );

    res.status(201).json({ request: rows[0] });
  } catch (err) {
    console.error('Failed to create store request:', err);
    serverError(res, 'Failed to create store request');
  }
}

// ============================================
// GET /api/store/requests - List requests
// ============================================
export async function listRequests(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    let sql: string;
    const params: any[] = [];

    if (user.roleId === 'admin') {
      // Admins see all requests with requester info
      sql = `
        SELECT
          sr.id, sr.userId, u.displayName, sr.itemType, sr.itemId,
          sr.itemName, sr.message, sr.status, sr.reviewedBy,
          sr.createdAt, sr.reviewedAt
        FROM marketplace_requests sr
        JOIN users u ON u.id = sr.userId
        ORDER BY sr.createdAt DESC
      `;
    } else {
      // Non-admins see only their own requests
      sql = `
        SELECT
          sr.id, sr.userId, u.displayName, sr.itemType, sr.itemId,
          sr.itemName, sr.message, sr.status, sr.reviewedBy,
          sr.createdAt, sr.reviewedAt
        FROM marketplace_requests sr
        JOIN users u ON u.id = sr.userId
        WHERE sr.userId = ?
        ORDER BY sr.createdAt DESC
      `;
      params.push(user.id);
    }

    const requests = await q<any[]>(sql, params);

    res.json({ requests });
  } catch (err) {
    console.error('Failed to list store requests:', err);
    serverError(res, 'Failed to list store requests');
  }
}

// ============================================
// PUT /api/store/requests/:id - Approve/dismiss
// ============================================
export async function updateRequest(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    // Only admins can review requests
    if (user.roleId !== 'admin') {
      return forbidden(res, 'Admin access required');
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || (status !== 'approved' && status !== 'dismissed')) {
      return invalidInput(res, 'status must be "approved" or "dismissed"');
    }

    // Check request exists
    const existing = await q<any[]>(
      'SELECT id FROM marketplace_requests WHERE id = ?',
      [id],
    );
    if (existing.length === 0) {
      return notFound(res, 'Request');
    }

    // Update the request
    await q(
      `UPDATE marketplace_requests
       SET status = ?, reviewedBy = ?, reviewedAt = NOW()
       WHERE id = ?`,
      [status, user.id, id],
    );

    // Fetch updated record
    const rows = await q<any[]>(
      `SELECT sr.id, sr.userId, u.displayName, sr.itemType, sr.itemId,
              sr.itemName, sr.message, sr.status, sr.reviewedBy,
              sr.createdAt, sr.reviewedAt
       FROM marketplace_requests sr
       JOIN users u ON u.id = sr.userId
       WHERE sr.id = ?`,
      [id],
    );

    res.json({ request: rows[0] });
  } catch (err) {
    console.error('Failed to update store request:', err);
    serverError(res, 'Failed to update store request');
  }
}
