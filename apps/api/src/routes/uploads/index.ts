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

// Ensure upload directories exist - use UPLOAD_DIR env var if available (Docker)
const UPLOAD_BASE = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const THEME_UPLOAD_DIR = path.join(UPLOAD_BASE, 'themes');

if (!existsSync(UPLOAD_BASE)) {
  mkdirSync(UPLOAD_BASE, { recursive: true });
}
if (!existsSync(THEME_UPLOAD_DIR)) {
  mkdirSync(THEME_UPLOAD_DIR, { recursive: true });
}

// Configure multer for memory storage (we'll process with sharp)
const storage = multer.memoryStorage();

const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter,
});

// Image size presets for different use cases
const IMAGE_PRESETS = {
  thumbnail: { width: 400, height: 300, fit: 'cover' as const },
  sidebar: { width: 400, height: 800, fit: 'cover' as const },
  background: { width: 1920, height: 1080, fit: 'cover' as const },
  'background-pattern': { width: 200, height: 200, fit: 'cover' as const },
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
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Kids cannot upload images
      if (user.roleId === 'kid' || user.roleId === 'kiosk') {
        res.status(403).json({ error: 'Permission denied' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const { preset = 'background', themeId } = req.body as { preset?: string; themeId?: string };

      // Validate preset
      if (!Object.keys(IMAGE_PRESETS).includes(preset)) {
        res.status(400).json({ error: 'Invalid image preset' });
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

      // If themeId provided, save to theme_assets table
      if (themeId) {
        const assetType = preset === 'thumbnail' ? 'thumbnail' :
                         preset === 'sidebar' ? 'sidebar-image' :
                         'background-image';

        await q(
          `INSERT INTO theme_assets (id, themeId, uploadedBy, assetType, filename, url, mimeType, sizeBytes, width, height)
           VALUES (?, ?, ?, ?, ?, ?, 'image/webp', ?, ?, ?)`,
          [fileId, themeId, user.id, assetType, filename, url, stats.size, imagePreset.width, imagePreset.height]
        );
      }

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
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Upload failed' });
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
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Check if asset exists and user owns it (or is admin)
    const [asset] = await q<Array<{ id: string; uploadedBy: number; filename: string }>>(
      'SELECT id, uploadedBy, filename FROM theme_assets WHERE id = ?',
      [id]
    );

    if (!asset) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    if (asset.uploadedBy !== user.id && user.roleId !== 'admin') {
      res.status(403).json({ error: 'Permission denied' });
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
    res.status(500).json({ error: 'Delete failed' });
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
      res.status(401).json({ error: 'Authentication required' });
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
    res.status(500).json({ error: 'Failed to get assets' });
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
      res.status(401).json({ error: 'Authentication required' });
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
    res.status(500).json({ error: 'Failed to get assets' });
  }
}
