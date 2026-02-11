// apps/api/src/routes/upload.ts
// File upload routes for avatars, logos, and backgrounds

import type { Request, Response } from 'express';
import { q } from '../db';
import { logAudit } from '../audit';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

// Ensure upload directory exists
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const LOGO_DIR = path.join(UPLOAD_DIR, 'logos');
const BACKGROUND_DIR = path.join(UPLOAD_DIR, 'backgrounds');
const RECIPE_DIR = path.join(UPLOAD_DIR, 'recipes');

// Create directories if they don't exist
[AVATAR_DIR, LOGO_DIR, BACKGROUND_DIR, RECIPE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// =============================================================================
// POST /api/upload/avatar
// Upload user avatar
// =============================================================================
export async function uploadAvatar(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  try {
    if (!req.body || !req.body.image) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'No image provided' },
      });
    }

    const { image, mimeType } = req.body;

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP',
        },
      });
    }

    // Decode base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Image too large. Maximum size is 5MB' },
      });
    }

    // Generate unique filename
    const ext = mimeType.split('/')[1];
    const filename = `${user.id}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filepath = path.join(AVATAR_DIR, filename);

    // Delete old avatar if exists
    const [existingUser] = await q<Array<{ avatarUrl: string | null }>>(
      'SELECT avatarUrl FROM users WHERE id = ?',
      [user.id],
    );
    if (existingUser?.avatarUrl) {
      const oldPath = path.join(UPLOAD_DIR, existingUser.avatarUrl.replace('/uploads/', ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new avatar
    fs.writeFileSync(filepath, buffer);

    // Update database
    const avatarUrl = `/uploads/avatars/${filename}`;
    await q('UPDATE users SET avatarUrl = ? WHERE id = ?', [avatarUrl, user.id]);

    await logAudit({
      action: 'upload.avatar',
      result: 'ok',
      actorId: user.id,
    });

    return res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('[uploadAvatar] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

// =============================================================================
// DELETE /api/upload/avatar
// Remove user avatar
// =============================================================================
export async function deleteAvatar(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  try {
    const [existingUser] = await q<Array<{ avatarUrl: string | null }>>(
      'SELECT avatarUrl FROM users WHERE id = ?',
      [user.id],
    );

    if (existingUser?.avatarUrl) {
      const oldPath = path.join(UPLOAD_DIR, existingUser.avatarUrl.replace('/uploads/', ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    await q('UPDATE users SET avatarUrl = NULL WHERE id = ?', [user.id]);

    await logAudit({
      action: 'upload.avatar.delete',
      result: 'ok',
      actorId: user.id,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('[deleteAvatar] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

// =============================================================================
// POST /api/upload/logo
// Upload household logo (admin only)
// =============================================================================
export async function uploadLogo(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  try {
    if (!req.body || !req.body.image) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'No image provided' },
      });
    }

    const { image, mimeType } = req.body;

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP',
        },
      });
    }

    // Decode base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Image too large. Maximum size is 5MB' },
      });
    }

    // Generate unique filename
    const ext = mimeType.split('/')[1];
    const filename = `logo-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filepath = path.join(LOGO_DIR, filename);

    // Delete old logo if exists
    const [existingSettings] = await q<Array<{ logoUrl: string | null }>>(
      'SELECT logoUrl FROM settings WHERE id = 1',
    );
    if (existingSettings?.logoUrl) {
      const oldPath = path.join(UPLOAD_DIR, existingSettings.logoUrl.replace('/uploads/', ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new logo
    fs.writeFileSync(filepath, buffer);

    // Update database
    const logoUrl = `/uploads/logos/${filename}`;
    await q('UPDATE settings SET logoUrl = ? WHERE id = 1', [logoUrl]);

    await logAudit({
      action: 'upload.logo',
      result: 'ok',
      actorId: user.id,
    });

    return res.json({ success: true, logoUrl });
  } catch (err) {
    console.error('[uploadLogo] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

// =============================================================================
// POST /api/upload/background
// Upload login background image (admin only)
// =============================================================================
export async function uploadBackground(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  try {
    if (!req.body || !req.body.image) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'No image provided' },
      });
    }

    const { image, mimeType } = req.body;

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP',
        },
      });
    }

    // Decode base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Image too large. Maximum size is 5MB' },
      });
    }

    // Generate unique filename
    const ext = mimeType.split('/')[1];
    const filename = `bg-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filepath = path.join(BACKGROUND_DIR, filename);

    // Delete old background if exists
    const [existingSettings] = await q<Array<{ loginBackgroundValue: string | null }>>(
      'SELECT loginBackgroundValue FROM settings WHERE id = 1',
    );
    if (existingSettings?.loginBackgroundValue?.startsWith('/uploads/')) {
      const oldPath = path.join(
        UPLOAD_DIR,
        existingSettings.loginBackgroundValue.replace('/uploads/', ''),
      );
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new background
    fs.writeFileSync(filepath, buffer);

    // Update database
    const backgroundUrl = `/uploads/backgrounds/${filename}`;
    await q('UPDATE settings SET loginBackground = ?, loginBackgroundValue = ? WHERE id = 1', [
      'image',
      backgroundUrl,
    ]);

    await logAudit({
      action: 'upload.background',
      result: 'ok',
      actorId: user.id,
    });

    return res.json({ success: true, backgroundUrl });
  } catch (err) {
    console.error('[uploadBackground] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

// =============================================================================
// POST /api/upload/recipe/:id
// Upload recipe image
// =============================================================================
export async function uploadRecipeImage(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  const recipeId = parseInt(req.params.id);
  if (isNaN(recipeId)) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid recipe ID' } });
  }

  try {
    // Check if recipe exists and user has permission
    const [recipe] = await q<Array<{ id: number; createdBy: number | null; imageUrl: string | null }>>(
      'SELECT id, createdBy, imageUrl FROM recipes WHERE id = ? AND active = 1',
      [recipeId],
    );

    if (!recipe) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recipe not found' } });
    }

    // Only admin or recipe creator can upload image
    if (user.roleId !== 'admin' && recipe.createdBy !== user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot edit this recipe' } });
    }

    if (!req.body || !req.body.image) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'No image provided' },
      });
    }

    const { image, mimeType } = req.body;

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP',
        },
      });
    }

    // Decode base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Image too large. Maximum size is 5MB' },
      });
    }

    // Generate unique filename
    const ext = mimeType.split('/')[1];
    const filename = `recipe-${recipeId}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filepath = path.join(RECIPE_DIR, filename);

    // Delete old recipe image if exists
    if (recipe.imageUrl) {
      const oldPath = path.join(UPLOAD_DIR, recipe.imageUrl.replace('/uploads/', ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new image
    fs.writeFileSync(filepath, buffer);

    // Update database
    const imageUrl = `/uploads/recipes/${filename}`;
    await q('UPDATE recipes SET imageUrl = ? WHERE id = ?', [imageUrl, recipeId]);

    await logAudit({
      action: 'upload.recipe',
      result: 'ok',
      actorId: user.id,
      details: { recipeId },
    });

    return res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('[uploadRecipeImage] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

// =============================================================================
// DELETE /api/upload/recipe/:id
// Delete recipe image
// =============================================================================
export async function deleteRecipeImage(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  const recipeId = parseInt(req.params.id);
  if (isNaN(recipeId)) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid recipe ID' } });
  }

  try {
    // Check if recipe exists and user has permission
    const [recipe] = await q<Array<{ id: number; createdBy: number | null; imageUrl: string | null }>>(
      'SELECT id, createdBy, imageUrl FROM recipes WHERE id = ? AND active = 1',
      [recipeId],
    );

    if (!recipe) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recipe not found' } });
    }

    // Only admin or recipe creator can delete image
    if (user.roleId !== 'admin' && recipe.createdBy !== user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot edit this recipe' } });
    }

    // Delete old recipe image if exists
    if (recipe.imageUrl) {
      const oldPath = path.join(UPLOAD_DIR, recipe.imageUrl.replace('/uploads/', ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update database
    await q('UPDATE recipes SET imageUrl = NULL WHERE id = ?', [recipeId]);

    await logAudit({
      action: 'upload.recipe.delete',
      result: 'ok',
      actorId: user.id,
      details: { recipeId },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('[deleteRecipeImage] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

// =============================================================================
// GET /api/uploads
// List all uploaded files (admin only)
// =============================================================================
export async function listUploads(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  try {
    const allFiles: Array<{
      type: string;
      filename: string;
      url: string;
      size: number;
      createdAt: Date;
    }> = [];

    for (const type of ['logos', 'backgrounds', 'avatars']) {
      const dir = path.join(UPLOAD_DIR, type);

      if (!fs.existsSync(dir)) continue;

      const files = fs
        .readdirSync(dir)
        .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
        .map((filename) => {
          const filepath = path.join(dir, filename);
          const stats = fs.statSync(filepath);
          return {
            type,
            filename,
            url: `/uploads/${type}/${filename}`,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        });

      allFiles.push(...files);
    }

    // Sort by creation date, newest first
    allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ files: allFiles });
  } catch (err) {
    console.error('[listUploads] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}

// =============================================================================
// DELETE /api/uploads/:id
// Delete a specific uploaded file (admin only)
// =============================================================================
export async function deleteUpload(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  // The :id param is expected to be in format "type/filename" or just parsed from URL
  const fileId = req.params.id;

  // Try to find the file in any of the upload directories
  for (const type of ['logos', 'backgrounds', 'avatars']) {
    const filepath = path.join(UPLOAD_DIR, type, fileId);

    if (fs.existsSync(filepath)) {
      const fileUrl = `/uploads/${type}/${fileId}`;

      // Check if file is currently in use and clear references
      if (type === 'logos') {
        const [settings] = await q<Array<{ logoUrl: string | null }>>(
          'SELECT logoUrl FROM settings WHERE id = 1',
        );
        if (settings?.logoUrl === fileUrl) {
          await q('UPDATE settings SET logoUrl = NULL WHERE id = 1');
        }
      } else if (type === 'backgrounds') {
        const [settings] = await q<Array<{ loginBackgroundValue: string | null }>>(
          'SELECT loginBackgroundValue FROM settings WHERE id = 1',
        );
        if (settings?.loginBackgroundValue === fileUrl) {
          await q(
            "UPDATE settings SET loginBackground = 'gradient', loginBackgroundValue = NULL WHERE id = 1",
          );
        }
      } else if (type === 'avatars') {
        await q('UPDATE users SET avatarUrl = NULL WHERE avatarUrl = ?', [fileUrl]);
      }

      // Delete the file
      fs.unlinkSync(filepath);

      await logAudit({
        action: `upload.${type}.delete`,
        result: 'ok',
        actorId: user.id,
        details: { filename: fileId },
      });

      return res.json({ success: true });
    }
  }

  return res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'File not found' },
  });
}

// =============================================================================
// POST /api/uploads/:id/select
// Select an existing uploaded file to use (admin only)
// =============================================================================
export async function selectUpload(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
  }

  const { url, type } = req.body;

  if (!url || !type) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'URL and type are required' },
    });
  }

  try {
    if (type === 'logo') {
      await q('UPDATE settings SET logoUrl = ? WHERE id = 1', [url]);
    } else if (type === 'background') {
      await q(
        "UPDATE settings SET loginBackground = 'image', loginBackgroundValue = ? WHERE id = 1",
        [url],
      );
    } else {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Invalid type for selection' },
      });
    }

    await logAudit({
      action: `upload.${type}.select`,
      result: 'ok',
      actorId: user.id,
      details: { url },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('[selectUpload] error', err);
    return res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}
