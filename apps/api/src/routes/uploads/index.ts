// apps/api/src/routes/uploads/index.ts
// File upload routes for theme images

import type { Request, Response, RequestHandler } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { q } from '../../db';
import { getUser } from '../../utils/auth';
import { authRequired, forbidden, invalidInput, notFound, serverError } from '../../utils/errors';
import { UPLOAD } from '../../utils/constants';

// Ensure upload directories exist - use UPLOAD_DIR env var if available (Docker)
const UPLOAD_BASE = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const THEME_UPLOAD_DIR = path.join(UPLOAD_BASE, 'themes');

console.log('[uploads] UPLOAD_BASE:', UPLOAD_BASE);
console.log('[uploads] THEME_UPLOAD_DIR:', THEME_UPLOAD_DIR);

if (!existsSync(UPLOAD_BASE)) {
  console.log('[uploads] Creating UPLOAD_BASE directory...');
  mkdirSync(UPLOAD_BASE, { recursive: true });
}
if (!existsSync(THEME_UPLOAD_DIR)) {
  console.log('[uploads] Creating THEME_UPLOAD_DIR directory...');
  mkdirSync(THEME_UPLOAD_DIR, { recursive: true });
}

// Configure multer for memory storage (we'll process with sharp)
const storage = multer.memoryStorage();

const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if ((UPLOAD.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD.MAX_IMAGE_SIZE,
  },
  fileFilter: imageFilter,
});

// Image size presets for different use cases
const IMAGE_PRESETS = {
  thumbnail: { ...UPLOAD.PRESETS.thumbnail, fit: 'cover' as const },
  sidebar: { ...UPLOAD.PRESETS.sidebar, fit: 'cover' as const },
  background: { ...UPLOAD.PRESETS.background, fit: 'cover' as const },
  'background-pattern': { ...UPLOAD.PRESETS['background-pattern'], fit: 'cover' as const },
};

type ImagePreset = keyof typeof IMAGE_PRESETS;

/**
 * POST /api/uploads/theme-image
 * Upload an image for theme customization
 */
export const uploadThemeImage: RequestHandler[] = [
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = getUser(req);
      if (!user) {
        authRequired(res);
        return;
      }

      // Kids cannot upload images
      if (user.roleId === 'kid' || user.roleId === 'kiosk') {
        forbidden(res, 'Permission denied');
        return;
      }

      if (!req.file) {
        invalidInput(res, 'No file uploaded');
        return;
      }

      const { preset = 'background', themeId, category, name } = req.body as {
        preset?: string;
        themeId?: string;
        category?: string;
        name?: string;
      };

      // Validate preset
      if (!Object.keys(IMAGE_PRESETS).includes(preset)) {
        invalidInput(res, 'Invalid image preset');
        return;
      }

      const imagePreset = IMAGE_PRESETS[preset as ImagePreset];
      const fileId = uuidv4();
      const filename = `${fileId}.webp`;
      const filepath = path.join(THEME_UPLOAD_DIR, filename);

      // Process image with sharp
      await sharp(req.file.buffer)
        .resize(imagePreset.width, imagePreset.height, {
          fit: imagePreset.fit,
          position: 'center',
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      // Get file stats
      const stats = await fs.stat(filepath);

      // Generate URL path
      const url = `/uploads/themes/${filename}`;

      // Determine asset type from preset
      const assetType = preset === 'thumbnail' ? 'thumbnail' :
                       preset === 'sidebar' ? 'sidebar-image' :
                       'background-image';

      // Always save to theme_assets table so images can be reused from library
      // themeId is optional - NULL means it's a general library image not tied to a specific theme
      // category and name help organize images in the library
      await q(
        `INSERT INTO theme_assets (id, themeId, uploadedBy, assetType, category, name, filename, url, mimeType, sizeBytes, width, height)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'image/webp', ?, ?, ?)`,
        [fileId, themeId || null, user.id, assetType, category || null, name || null, filename, url, stats.size, imagePreset.width, imagePreset.height]
      );

      res.json({
        success: true,
        image: {
          id: fileId,
          url,
          filename,
          width: imagePreset.width,
          height: imagePreset.height,
          sizeBytes: stats.size,
        },
      });
    } catch (err: any) {
      console.error('Upload failed:', err);
      if (err.message?.includes('Invalid file type')) {
        invalidInput(res, err.message);
        return;
      }
      serverError(res);
    }
  },
];

/**
 * DELETE /api/uploads/theme-image/:id
 * Delete an uploaded theme image
 */
export async function deleteThemeImage(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    if (!user) {
      authRequired(res);
      return;
    }

    const { id } = req.params;

    // Check if asset exists and user owns it (or is admin)
    const [asset] = await q<Array<{ id: string; uploadedBy: number; filename: string }>>(
      'SELECT id, uploadedBy, filename FROM theme_assets WHERE id = ?',
      [id]
    );

    if (!asset) {
      notFound(res, 'Image');
      return;
    }

    if (asset.uploadedBy !== user.id && user.roleId !== 'admin') {
      forbidden(res, 'Permission denied');
      return;
    }

    // Delete file
    const filepath = path.join(THEME_UPLOAD_DIR, asset.filename);
    try {
      await fs.unlink(filepath);
    } catch {
      // File might already be deleted, continue
    }

    // Delete from database
    await q('DELETE FROM theme_assets WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete failed:', err);
    serverError(res);
  }
}

/**
 * GET /api/uploads/theme-assets/:themeId
 * Get all assets for a theme
 */
export async function getThemeAssets(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    if (!user) {
      authRequired(res);
      return;
    }

    const { themeId } = req.params;

    const assets = await q<Array<{
      id: string;
      assetType: string;
      filename: string;
      url: string;
      width: number;
      height: number;
      sizeBytes: number;
      createdAt: string;
    }>>(
      `SELECT id, assetType, filename, url, width, height, sizeBytes, createdAt
       FROM theme_assets
       WHERE themeId = ?
       ORDER BY createdAt DESC`,
      [themeId]
    );

    res.json({ assets });
  } catch (err) {
    console.error('Failed to get assets:', err);
    serverError(res);
  }
}

/**
 * GET /api/uploads/my-assets
 * Get all assets uploaded by the current user
 */
export async function getMyAssets(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    if (!user) {
      authRequired(res);
      return;
    }

    const assets = await q<Array<{
      id: string;
      themeId: string | null;
      assetType: string;
      filename: string;
      url: string;
      width: number;
      height: number;
      sizeBytes: number;
      createdAt: string;
    }>>(
      `SELECT id, themeId, assetType, filename, url, width, height, sizeBytes, createdAt
       FROM theme_assets
       WHERE uploadedBy = ?
       ORDER BY createdAt DESC
       LIMIT 50`,
      [user.id]
    );

    res.json({ assets });
  } catch (err) {
    console.error('Failed to get assets:', err);
    serverError(res);
  }
}

/**
 * GET /api/uploads/theme-library
 * Get all theme images available in the library (for media picker)
 * Returns all images uploaded by anyone, organized for easy browsing
 * Supports filtering by type and category
 */
export async function getThemeLibrary(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    if (!user) {
      authRequired(res);
      return;
    }

    const { type, category, limit = '100' } = req.query;

    let sql = `
      SELECT
        ta.id, ta.themeId, ta.assetType, ta.category, ta.name, ta.filename, ta.url,
        ta.width, ta.height, ta.sizeBytes, ta.createdAt,
        ta.uploadedBy, u.displayName as uploaderName
      FROM theme_assets ta
      LEFT JOIN users u ON ta.uploadedBy = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Filter by asset type if specified
    if (type) {
      conditions.push('ta.assetType = ?');
      params.push(type);
    }

    // Filter by category if specified
    if (category) {
      if (category === 'uncategorized') {
        conditions.push('ta.category IS NULL');
      } else {
        conditions.push('ta.category = ?');
        params.push(category);
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY ta.createdAt DESC LIMIT ?';
    params.push(parseInt(limit as string, 10));

    const assets = await q<Array<{
      id: string;
      themeId: string | null;
      assetType: string;
      category: string | null;
      name: string | null;
      filename: string;
      url: string;
      width: number;
      height: number;
      sizeBytes: number;
      createdAt: string;
      uploadedBy: number;
      uploaderName: string | null;
    }>>(sql, params);

    res.json({ assets });
  } catch (err) {
    console.error('Failed to get theme library:', err);
    serverError(res);
  }
}

/**
 * GET /api/uploads/categories
 * Get all unique categories used in the theme library
 */
export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    if (!user) {
      authRequired(res);
      return;
    }

    const categories = await q<Array<{ category: string | null; count: number }>>(
      `SELECT category, COUNT(*) as count
       FROM theme_assets
       GROUP BY category
       ORDER BY category ASC`
    );

    // Predefined categories that users can choose from
    const predefinedCategories = [
      { id: 'sidebar', label: 'Sidebar', description: 'Images for sidebar backgrounds' },
      { id: 'page-background', label: 'Page Background', description: 'Full page backgrounds' },
      { id: 'card-background', label: 'Card Background', description: 'Card and widget backgrounds' },
      { id: 'header', label: 'Header', description: 'Header area images' },
      { id: 'cyberpunk', label: 'Cyberpunk', description: 'Cyberpunk/neon themed images' },
      { id: 'modern', label: 'Modern', description: 'Clean modern style images' },
      { id: 'nature', label: 'Nature', description: 'Nature and outdoor images' },
      { id: 'abstract', label: 'Abstract', description: 'Abstract patterns and designs' },
      { id: 'fun', label: 'Fun', description: 'Fun and playful images' },
      { id: 'minimal', label: 'Minimal', description: 'Minimalist designs' },
    ];

    res.json({
      categories: categories.map(c => ({
        id: c.category || 'uncategorized',
        count: c.count,
      })),
      predefinedCategories,
    });
  } catch (err) {
    console.error('Failed to get categories:', err);
    serverError(res);
  }
}

/**
 * PATCH /api/uploads/theme-image/:id
 * Update an image's category and/or name
 */
export async function updateThemeImage(req: Request, res: Response): Promise<void> {
  try {
    const user = getUser(req);
    if (!user) {
      authRequired(res);
      return;
    }

    const { id } = req.params;
    const { category, name } = req.body as { category?: string; name?: string };

    // Check if asset exists and user owns it (or is admin)
    const [asset] = await q<Array<{ id: string; uploadedBy: number }>>(
      'SELECT id, uploadedBy FROM theme_assets WHERE id = ?',
      [id]
    );

    if (!asset) {
      notFound(res, 'Image');
      return;
    }

    if (asset.uploadedBy !== user.id && user.roleId !== 'admin') {
      forbidden(res, 'Permission denied');
      return;
    }

    // Update category and/or name
    const updates: string[] = [];
    const params: any[] = [];

    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category || null);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name || null);
    }

    if (updates.length > 0) {
      params.push(id);
      await q(`UPDATE theme_assets SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update failed:', err);
    serverError(res);
  }
}
