// apps/api/src/routes/themes/library.ts
// Theme library CRUD operations

import type { Request, Response } from 'express';
import { q } from '../../db';
import { v4 as uuidv4 } from 'uuid';
import { getUser } from '../../utils/auth';
import { authRequired, forbidden, invalidInput, notFound, serverError } from '../../utils/errors';

// ============================================
// GET /api/themes - List all themes
// ============================================
export async function listThemes(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { filter } = req.query;

    let sql = `
      SELECT
        id, name, description, thumbnailUrl,
        layout, colorsLight, colorsDark, typography,
        sidebar, header, pageBackground, ui, icons,
        elementStyles, widgetOverrides, loginPage, lcarsMode,
        createdBy, isPublic, isApprovedForKids, isDefault, isSystemTheme,
        usageCount, createdAt, updatedAt
      FROM themes
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter logic
    if (filter === 'mine') {
      // User's own themes only
      sql += ' AND createdBy = ?';
      params.push(user.id);
    } else if (filter === 'kid-approved') {
      // Kid-approved themes only
      sql += ' AND isApprovedForKids = 1';
    } else {
      // Default: public themes + user's own
      sql += ' AND (isPublic = 1 OR createdBy = ?)';
      params.push(user.id);
    }

    sql += ' ORDER BY isSystemTheme DESC, isDefault DESC, usageCount DESC, name ASC';

    const themes = await q<any[]>(sql, params);

    // Parse JSON columns
    const parsedThemes = themes.map(parseThemeRow);

    res.json({ themes: parsedThemes });
  } catch (err) {
    console.error('Failed to list themes:', err);
    serverError(res, 'Failed to list themes');
  }
}

// ============================================
// GET /api/themes/:id - Get single theme
// ============================================
export async function getTheme(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    const themes = await q<any[]>(
      `SELECT
        id, name, description, thumbnailUrl,
        layout, colorsLight, colorsDark, typography,
        sidebar, header, pageBackground, ui, icons,
        elementStyles, widgetOverrides, loginPage, lcarsMode,
        createdBy, isPublic, isApprovedForKids, isDefault, isSystemTheme,
        usageCount, createdAt, updatedAt
      FROM themes
      WHERE id = ? AND (isPublic = 1 OR createdBy = ?)`,
      [id, user.id],
    );

    if (themes.length === 0) {
      return notFound(res, 'Theme');
    }

    const theme = parseThemeRow(themes[0]);
    res.json({ theme });
  } catch (err) {
    console.error('Failed to get theme:', err);
    serverError(res, 'Failed to get theme');
  }
}

// ============================================
// POST /api/themes - Create new theme
// ============================================
export async function createTheme(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    // Only member and admin can create themes
    if (user.roleId === 'kid' || user.roleId === 'kiosk') {
      return forbidden(res, 'Permission denied');
    }

    const {
      name,
      description,
      thumbnailUrl,
      layout,
      colorsLight,
      colorsDark,
      typography,
      sidebar,
      header,
      pageBackground,
      ui,
      icons,
      isPublic = true,
      // Extended theme fields
      elementStyles,
      widgetOverrides,
      loginPage,
      lcarsMode,
    } = req.body;

    // Validate required fields
    if (!name || !layout || !colorsLight || !colorsDark || !typography || !pageBackground || !ui || !icons) {
      return invalidInput(res, 'Missing required fields');
    }

    const id = uuidv4();

    await q(
      `INSERT INTO themes (
        id, name, description, thumbnailUrl,
        layout, colorsLight, colorsDark, typography,
        sidebar, header, pageBackground, ui, icons,
        elementStyles, widgetOverrides, loginPage, lcarsMode,
        createdBy, isPublic, isApprovedForKids, isDefault
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        id,
        name,
        description || null,
        thumbnailUrl || null,
        JSON.stringify(layout),
        JSON.stringify(colorsLight),
        JSON.stringify(colorsDark),
        JSON.stringify(typography),
        sidebar ? JSON.stringify(sidebar) : null,
        header ? JSON.stringify(header) : null,
        JSON.stringify(pageBackground),
        JSON.stringify(ui),
        JSON.stringify(icons),
        elementStyles ? JSON.stringify(elementStyles) : null,
        widgetOverrides ? JSON.stringify(widgetOverrides) : null,
        loginPage ? JSON.stringify(loginPage) : null,
        lcarsMode ? JSON.stringify(lcarsMode) : null,
        user.id,
        isPublic ? 1 : 0,
      ],
    );

    // Fetch the created theme
    const themes = await q<any[]>('SELECT * FROM themes WHERE id = ?', [id]);
    const theme = parseThemeRow(themes[0]);

    res.status(201).json({ theme });
  } catch (err) {
    console.error('Failed to create theme:', err);
    serverError(res, 'Failed to create theme');
  }
}

// ============================================
// PUT /api/themes/:id - Update theme
// ============================================
export async function updateTheme(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    // Check ownership or admin
    const existing = await q<any[]>('SELECT createdBy, isDefault, isSystemTheme FROM themes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return notFound(res, 'Theme');
    }

    // Cannot edit system themes (HabiTrack Classic)
    if (existing[0].isSystemTheme) {
      return forbidden(res, 'Cannot modify system themes');
    }

    const isOwner = existing[0].createdBy === user.id;
    const isAdmin = user.roleId === 'admin';

    // Only admins can edit default themes (like Household Brand)
    if (existing[0].isDefault && !isAdmin) {
      return forbidden(res, 'Only administrators can modify the household theme');
    }

    if (!isOwner && !isAdmin) {
      return forbidden(res, 'Permission denied');
    }

    const {
      name,
      description,
      thumbnailUrl,
      layout,
      colorsLight,
      colorsDark,
      typography,
      sidebar,
      header,
      pageBackground,
      ui,
      icons,
      isPublic,
      isApprovedForKids,
      // Extended theme fields
      elementStyles,
      widgetOverrides,
      loginPage,
      lcarsMode,
    } = req.body;

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    // Cannot rename default themes (Household Brand)
    if (name !== undefined) {
      if (existing[0].isDefault) {
        // Silently ignore name change for default themes
      } else {
        updates.push('name = ?');
        params.push(name);
      }
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (thumbnailUrl !== undefined) {
      updates.push('thumbnailUrl = ?');
      params.push(thumbnailUrl);
    }
    if (layout !== undefined) {
      updates.push('layout = ?');
      params.push(JSON.stringify(layout));
    }
    if (colorsLight !== undefined) {
      updates.push('colorsLight = ?');
      params.push(JSON.stringify(colorsLight));
    }
    if (colorsDark !== undefined) {
      updates.push('colorsDark = ?');
      params.push(JSON.stringify(colorsDark));
    }
    if (typography !== undefined) {
      updates.push('typography = ?');
      params.push(JSON.stringify(typography));
    }
    if (sidebar !== undefined) {
      updates.push('sidebar = ?');
      params.push(sidebar ? JSON.stringify(sidebar) : null);
    }
    if (header !== undefined) {
      updates.push('header = ?');
      params.push(header ? JSON.stringify(header) : null);
    }
    if (pageBackground !== undefined) {
      updates.push('pageBackground = ?');
      params.push(JSON.stringify(pageBackground));
    }
    if (ui !== undefined) {
      updates.push('ui = ?');
      params.push(JSON.stringify(ui));
    }
    if (icons !== undefined) {
      updates.push('icons = ?');
      params.push(JSON.stringify(icons));
    }
    if (isPublic !== undefined) {
      updates.push('isPublic = ?');
      params.push(isPublic ? 1 : 0);
    }
    // Only admin can change kid approval
    if (isApprovedForKids !== undefined && isAdmin) {
      updates.push('isApprovedForKids = ?');
      params.push(isApprovedForKids ? 1 : 0);
    }
    // Extended theme fields
    if (elementStyles !== undefined) {
      updates.push('elementStyles = ?');
      params.push(elementStyles ? JSON.stringify(elementStyles) : null);
    }
    if (widgetOverrides !== undefined) {
      updates.push('widgetOverrides = ?');
      params.push(widgetOverrides ? JSON.stringify(widgetOverrides) : null);
    }
    if (loginPage !== undefined) {
      updates.push('loginPage = ?');
      params.push(loginPage ? JSON.stringify(loginPage) : null);
    }
    if (lcarsMode !== undefined) {
      updates.push('lcarsMode = ?');
      params.push(lcarsMode ? JSON.stringify(lcarsMode) : null);
    }

    if (updates.length === 0) {
      return invalidInput(res, 'No fields to update');
    }

    params.push(id);
    await q(`UPDATE themes SET ${updates.join(', ')} WHERE id = ?`, params);

    // Fetch updated theme
    const themes = await q<any[]>('SELECT * FROM themes WHERE id = ?', [id]);
    const theme = parseThemeRow(themes[0]);

    res.json({ theme });
  } catch (err) {
    console.error('Failed to update theme:', err);
    serverError(res, 'Failed to update theme');
  }
}

// ============================================
// DELETE /api/themes/:id - Delete theme
// ============================================
export async function deleteTheme(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { id } = req.params;

    // Check ownership or admin
    const existing = await q<any[]>('SELECT createdBy, isDefault, isSystemTheme FROM themes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return notFound(res, 'Theme');
    }

    // Cannot delete system themes (HabiTrack Classic)
    if (existing[0].isSystemTheme) {
      return invalidInput(res, 'Cannot delete system themes');
    }

    // Cannot delete default theme (Household Brand)
    if (existing[0].isDefault) {
      return invalidInput(res, 'Cannot delete the household default theme');
    }

    const isOwner = existing[0].createdBy === user.id;
    const isAdmin = user.roleId === 'admin';

    if (!isOwner && !isAdmin) {
      return forbidden(res, 'Permission denied');
    }

    await q('DELETE FROM themes WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete theme:', err);
    serverError(res, 'Failed to delete theme');
  }
}

// ============================================
// POST /api/themes/:id/duplicate - Duplicate theme
// ============================================
export async function duplicateTheme(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    if (user.roleId === 'kid' || user.roleId === 'kiosk') {
      return forbidden(res, 'Permission denied');
    }

    const { id } = req.params;
    const { name } = req.body;

    // Get original theme
    const themes = await q<any[]>('SELECT * FROM themes WHERE id = ? AND (isPublic = 1 OR createdBy = ?)', [
      id,
      user.id,
    ]);

    if (themes.length === 0) {
      return notFound(res, 'Theme');
    }

    const original = themes[0];
    const newId = uuidv4();
    const newName = name || `${original.name} (Copy)`;

    await q(
      `INSERT INTO themes (
        id, name, description, thumbnailUrl,
        layout, colorsLight, colorsDark, typography,
        sidebar, header, pageBackground, ui, icons,
        elementStyles, widgetOverrides, loginPage, lcarsMode,
        createdBy, isPublic, isApprovedForKids, isDefault
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [
        newId,
        newName,
        original.description,
        null, // Don't copy thumbnail
        original.layout,
        original.colorsLight,
        original.colorsDark,
        original.typography,
        original.sidebar,
        original.header,
        original.pageBackground,
        original.ui,
        original.icons,
        original.elementStyles,
        original.widgetOverrides,
        original.loginPage,
        original.lcarsMode,
        user.id,
      ],
    );

    // Fetch the new theme
    const newThemes = await q<any[]>('SELECT * FROM themes WHERE id = ?', [newId]);
    const theme = parseThemeRow(newThemes[0]);

    res.status(201).json({ theme });
  } catch (err) {
    console.error('Failed to duplicate theme:', err);
    serverError(res, 'Failed to duplicate theme');
  }
}

// ============================================
// PUT /api/themes/:id/kid-approval - Toggle kid approval (admin only)
// ============================================
export async function toggleKidApproval(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    // Only admins can approve themes for kids
    if (user.roleId !== 'admin') {
      return forbidden(res, 'Only administrators can approve themes for kids');
    }

    const { id } = req.params;
    const { approved } = req.body;

    if (typeof approved !== 'boolean') {
      return invalidInput(res, 'approved field must be a boolean');
    }

    // Check theme exists
    const existing = await q<any[]>('SELECT id FROM themes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return notFound(res, 'Theme');
    }

    await q('UPDATE themes SET isApprovedForKids = ? WHERE id = ?', [approved ? 1 : 0, id]);

    // Fetch updated theme
    const themes = await q<any[]>('SELECT * FROM themes WHERE id = ?', [id]);
    const theme = parseThemeRow(themes[0]);

    res.json({ theme });
  } catch (err) {
    console.error('Failed to toggle kid approval:', err);
    serverError(res, 'Failed to toggle kid approval');
  }
}

// ============================================
// Helper: Parse JSON columns in theme row
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
    // Extended theme fields
    elementStyles: row.elementStyles
      ? typeof row.elementStyles === 'string'
        ? JSON.parse(row.elementStyles)
        : row.elementStyles
      : null,
    widgetOverrides: row.widgetOverrides
      ? typeof row.widgetOverrides === 'string'
        ? JSON.parse(row.widgetOverrides)
        : row.widgetOverrides
      : null,
    loginPage: row.loginPage
      ? typeof row.loginPage === 'string'
        ? JSON.parse(row.loginPage)
        : row.loginPage
      : null,
    lcarsMode: row.lcarsMode
      ? typeof row.lcarsMode === 'string'
        ? JSON.parse(row.lcarsMode)
        : row.lcarsMode
      : null,
    createdBy: row.createdBy,
    isPublic: Boolean(row.isPublic),
    isApprovedForKids: Boolean(row.isApprovedForKids),
    isDefault: Boolean(row.isDefault),
    isSystemTheme: Boolean(row.isSystemTheme),
    usageCount: row.usageCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    // Flattened fields for list view (ThemeListItem)
    primaryColor: colorsLight?.primary || '#3cb371',
    accentColor: colorsLight?.accent || '#3cb371',
    layoutType: layout?.type || 'sidebar-left',
  };
}
