// apps/api/src/routes/themes/importExport.ts
// Theme import/export endpoints

import type { Request, Response } from 'express';
import { q } from '../../db';
import { v4 as uuidv4 } from 'uuid';
import { getUser } from '../../utils/auth';
import { authRequired, forbidden, invalidInput, notFound, serverError } from '../../utils/errors';
import { validateThemeImport, sanitizeElementStyles } from '../../utils/themeSanitization';

// ============================================
// GET /api/themes/:id/export
// Export a theme as a .habi-theme JSON file
// ============================================
export async function exportTheme(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);

    const { id } = req.params;

    // Fetch theme
    const themes = await q<any[]>(
      `SELECT * FROM themes WHERE id = ? AND (isPublic = 1 OR createdBy = ?)`,
      [id, user.id]
    );

    if (!themes.length) return notFound(res, 'Theme not found');

    const theme = themes[0];

    // Parse JSON columns
    const parseJSON = (val: any) => {
      if (!val) return null;
      return typeof val === 'string' ? JSON.parse(val) : val;
    };

    // Fetch associated assets
    const assets = await q<any[]>(
      `SELECT assetType, filename, mimeType, url FROM theme_assets WHERE themeId = ?`,
      [id]
    );

    // Build export payload
    const exportData = {
      formatVersion: '1.0',
      manifest: {
        name: theme.name,
        description: theme.description || '',
        author: theme.author || 'Unknown',
        version: theme.semver || '1.0.0',
        tags: parseJSON(theme.tags) || [],
        category: 'custom',
        previewColors: {
          primary: parseJSON(theme.colorsLight)?.primary || '#3cb371',
          accent: parseJSON(theme.colorsLight)?.accent || '#3cb371',
          background: parseJSON(theme.colorsLight)?.background || '#ffffff',
        },
      },
      theme: {
        layout: parseJSON(theme.layout),
        colorsLight: parseJSON(theme.colorsLight),
        colorsDark: parseJSON(theme.colorsDark),
        typography: parseJSON(theme.typography),
        sidebar: parseJSON(theme.sidebar),
        header: parseJSON(theme.header),
        pageBackground: parseJSON(theme.pageBackground),
        ui: parseJSON(theme.ui),
        icons: parseJSON(theme.icons),
        elementStyles: parseJSON(theme.elementStyles),
        widgetOverrides: parseJSON(theme.widgetOverrides),
        loginPage: parseJSON(theme.loginPage),
        lcarsMode: parseJSON(theme.lcarsMode),
      },
      assets: assets.length > 0
        ? assets.map((a) => ({
            assetType: a.assetType,
            filename: a.filename,
            mimeType: a.mimeType,
            // Note: actual base64 data would require reading files from disk.
            // For now, we include the URL reference for local assets.
            url: a.url,
            data: null,
          }))
        : null,
    };

    const filename = `${theme.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.habi-theme`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (err) {
    console.error('Failed to export theme:', err);
    serverError(res, 'Failed to export theme');
  }
}

// ============================================
// POST /api/themes/import
// Import a .habi-theme file
// ============================================
export async function importTheme(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);

    // Only admins can import themes
    if (user.roleId !== 'admin') {
      return forbidden(res, 'Only admins can import themes');
    }

    const data = req.body;

    // Validate
    const validation = validateThemeImport(data);
    if (!validation.valid) {
      return invalidInput(res, `Invalid theme file: ${validation.errors.join(', ')}`);
    }

    const { manifest, theme: themeData } = data;

    // Sanitize element styles
    let elementStyles = themeData.elementStyles || null;
    const sanitizationWarnings: string[] = [];
    if (elementStyles) {
      const result = sanitizeElementStyles(elementStyles);
      elementStyles = result.sanitized;
      sanitizationWarnings.push(...result.warnings);
    }

    // Generate new ID
    const id = uuidv4();
    const now = new Date();

    // Check for name conflicts
    const existing = await q<any[]>(
      `SELECT id FROM themes WHERE name = ?`,
      [manifest.name]
    );
    const themeName = existing.length > 0
      ? `${manifest.name} (Imported)`
      : manifest.name;

    // Insert theme
    await q(
      `INSERT INTO themes (
        id, name, description, semver, author,
        layout, colorsLight, colorsDark, typography,
        sidebar, header, pageBackground, ui, icons,
        elementStyles, widgetOverrides, loginPage, lcarsMode,
        createdBy, isPublic, isApprovedForKids, isDefault, isSystemTheme,
        source, tags, importedFrom,
        usageCount, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, 1, 0, 0, 0,
        'imported', ?, ?,
        0, ?, ?
      )`,
      [
        id,
        themeName,
        manifest.description || '',
        manifest.version || '1.0.0',  // maps to semver column
        manifest.author || 'Unknown',
        JSON.stringify(themeData.layout),
        JSON.stringify(themeData.colorsLight),
        JSON.stringify(themeData.colorsDark),
        JSON.stringify(themeData.typography),
        themeData.sidebar ? JSON.stringify(themeData.sidebar) : null,
        themeData.header ? JSON.stringify(themeData.header) : null,
        JSON.stringify(themeData.pageBackground),
        JSON.stringify(themeData.ui),
        JSON.stringify(themeData.icons),
        elementStyles ? JSON.stringify(elementStyles) : null,
        themeData.widgetOverrides ? JSON.stringify(themeData.widgetOverrides) : null,
        themeData.loginPage ? JSON.stringify(themeData.loginPage) : null,
        themeData.lcarsMode ? JSON.stringify(themeData.lcarsMode) : null,
        user.id,
        manifest.tags ? JSON.stringify(manifest.tags) : null,
        manifest.name,
        now,
        now,
      ]
    );

    res.json({
      success: true,
      themeId: id,
      name: themeName,
      warnings: [...validation.warnings, ...sanitizationWarnings],
    });
  } catch (err) {
    console.error('Failed to import theme:', err);
    serverError(res, 'Failed to import theme');
  }
}
