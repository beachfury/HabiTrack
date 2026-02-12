// apps/api/src/routes/themes/preferences.ts
// User theme preferences

import type { Request, Response } from 'express';
import { q } from '../../db';
import { getUser } from '../../utils/auth';
import { authRequired, forbidden, invalidInput, notFound, serverError } from '../../utils/errors';
import { createLogger } from '../../services/logger';

const log = createLogger('themes');

// ============================================
// GET /api/settings/theme - Get user's theme preferences
// ============================================
export async function getUserThemePreferences(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    // Get user's preferences
    const prefs = await q<any[]>(
      `SELECT
        userId, themeId, mode, overrides, personalThemes, accentColorOverride, updatedAt
      FROM user_theme_preferences
      WHERE userId = ?`,
      [user.id],
    );

    let preferences;

    if (prefs.length === 0) {
      // Create default preferences if not exists
      await q(
        `INSERT INTO user_theme_preferences (userId, themeId, mode)
         VALUES (?, 'habitrack-classic', 'system')
         ON DUPLICATE KEY UPDATE userId = userId`,
        [user.id],
      );

      preferences = {
        userId: user.id,
        themeId: 'habitrack-classic',
        mode: 'system',
        overrides: null,
        personalThemes: null,
        accentColorOverride: null,
        updatedAt: new Date().toISOString(),
      };
    } else {
      preferences = parsePreferencesRow(prefs[0]);
    }

    // Get the active theme details
    let activeTheme = null;
    if (preferences && preferences.themeId) {
      const themes = await q<any[]>(
        `SELECT
          id, name, description, thumbnailUrl,
          layout, colorsLight, colorsDark, typography,
          sidebar, header, pageBackground, ui, icons,
          createdBy, isPublic, isApprovedForKids, isDefault,
          usageCount, createdAt, updatedAt
        FROM themes
        WHERE id = ?`,
        [preferences.themeId],
      );

      if (themes.length > 0) {
        activeTheme = parseThemeRow(themes[0]);
      }
    }

    res.json({
      ...preferences,
      activeTheme,
    });
  } catch (err) {
    console.error('Failed to get theme preferences:', err);
    serverError(res, 'Failed to get theme preferences');
  }
}

// ============================================
// PUT /api/settings/theme - Update user's theme preferences
// ============================================
export async function updateUserThemePreferences(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { themeId, mode, overrides, accentColorOverride } = req.body;

    // Validate themeId if provided
    if (themeId !== undefined && themeId !== null) {
      // Kids can only select kid-approved themes
      if (user.roleId === 'kid') {
        const themes = await q<any[]>('SELECT id FROM themes WHERE id = ? AND isApprovedForKids = 1', [
          themeId,
        ]);
        if (themes.length === 0) {
          return forbidden(res, 'Theme not available for kids');
        }
      } else {
        // Check theme exists and is accessible
        const themes = await q<any[]>('SELECT id FROM themes WHERE id = ? AND (isPublic = 1 OR createdBy = ?)', [
          themeId,
          user.id,
        ]);
        if (themes.length === 0) {
          return notFound(res, 'Theme');
        }
      }
    }

    // Validate mode
    const validModes = ['light', 'dark', 'system', 'auto'];
    if (mode !== undefined && !validModes.includes(mode)) {
      return invalidInput(res, 'Invalid mode');
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (themeId !== undefined) {
      updates.push('themeId = ?');
      params.push(themeId);

      // Increment usage count for selected theme
      if (themeId) {
        await q('UPDATE themes SET usageCount = usageCount + 1 WHERE id = ?', [themeId]);
      }
    }

    if (mode !== undefined) {
      updates.push('mode = ?');
      params.push(mode);

      // Also update the users table for backward compatibility
      await q('UPDATE users SET theme = ? WHERE id = ?', [mode, user.id]);
    }

    if (overrides !== undefined) {
      updates.push('overrides = ?');
      params.push(overrides ? JSON.stringify(overrides) : null);
    }

    if (accentColorOverride !== undefined) {
      updates.push('accentColorOverride = ?');
      params.push(accentColorOverride);

      // Also update the users table for backward compatibility
      if (accentColorOverride) {
        await q('UPDATE users SET accentColor = ? WHERE id = ?', [accentColorOverride, user.id]);
      }
    }

    if (updates.length === 0) {
      return invalidInput(res, 'No fields to update');
    }

    // Upsert preferences
    params.push(user.id);

    await q(
      `INSERT INTO user_theme_preferences (userId, ${updates.map((u) => u.split(' = ')[0]).join(', ')})
       VALUES (?, ${params.slice(0, -1).map(() => '?').join(', ')})
       ON DUPLICATE KEY UPDATE ${updates.join(', ')}`,
      [user.id, ...params.slice(0, -1), ...params.slice(0, -1)],
    );

    // Return updated preferences
    const updatedPrefs = await q<any[]>(
      `SELECT userId, themeId, mode, overrides, personalThemes, accentColorOverride, updatedAt
       FROM user_theme_preferences WHERE userId = ?`,
      [user.id],
    );

    const preferences = parsePreferencesRow(updatedPrefs[0]);

    // Get active theme
    let activeTheme = null;
    if (preferences && preferences.themeId) {
      const themes = await q<any[]>('SELECT * FROM themes WHERE id = ?', [preferences.themeId]);
      if (themes.length > 0) {
        activeTheme = parseThemeRow(themes[0]);
      }
    }

    log.info('Theme preferences updated', { userId: user.id, themeId, mode, accentColorOverride });

    res.json({
      ...preferences,
      activeTheme,
    });
  } catch (err) {
    log.error('Failed to update theme preferences', { userId: user?.id, error: String(err) });
    serverError(res, 'Failed to update theme preferences');
  }
}

// ============================================
// Helper: Parse preferences row
// ============================================
function parsePreferencesRow(row: any) {
  if (!row) return null;

  return {
    userId: row.userId,
    themeId: row.themeId,
    mode: row.mode,
    overrides: row.overrides ? (typeof row.overrides === 'string' ? JSON.parse(row.overrides) : row.overrides) : null,
    personalThemes: row.personalThemes
      ? typeof row.personalThemes === 'string'
        ? JSON.parse(row.personalThemes)
        : row.personalThemes
      : null,
    accentColorOverride: row.accentColorOverride,
    updatedAt: row.updatedAt,
  };
}

// ============================================
// Helper: Parse theme row (same as library.ts)
// ============================================
function parseThemeRow(row: any) {
  if (!row) return null;

  const layout = typeof row.layout === 'string' ? JSON.parse(row.layout) : row.layout;
  const colorsLight = typeof row.colorsLight === 'string' ? JSON.parse(row.colorsLight) : row.colorsLight;
  const colorsDark = typeof row.colorsDark === 'string' ? JSON.parse(row.colorsDark) : row.colorsDark;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    thumbnailUrl: row.thumbnailUrl,
    layout,
    colorsLight,
    colorsDark,
    typography: typeof row.typography === 'string' ? JSON.parse(row.typography) : row.typography,
    sidebar: row.sidebar ? (typeof row.sidebar === 'string' ? JSON.parse(row.sidebar) : row.sidebar) : null,
    header: row.header ? (typeof row.header === 'string' ? JSON.parse(row.header) : row.header) : null,
    pageBackground:
      typeof row.pageBackground === 'string' ? JSON.parse(row.pageBackground) : row.pageBackground,
    ui: typeof row.ui === 'string' ? JSON.parse(row.ui) : row.ui,
    icons: typeof row.icons === 'string' ? JSON.parse(row.icons) : row.icons,
    createdBy: row.createdBy,
    isPublic: Boolean(row.isPublic),
    isApprovedForKids: Boolean(row.isApprovedForKids),
    isDefault: Boolean(row.isDefault),
    usageCount: row.usageCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    // Flattened fields for list view (ThemeListItem)
    primaryColor: colorsLight?.primary || '#8b5cf6',
    accentColor: colorsLight?.accent || '#8b5cf6',
    layoutType: layout?.type || 'sidebar-left',
  };
}
