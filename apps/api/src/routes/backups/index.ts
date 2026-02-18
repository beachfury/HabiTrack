// apps/api/src/routes/backups/index.ts
// Database backup management — create, list, download, restore, delete
// All endpoints require admin authentication

import type { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, createReadStream } from 'fs';
import { join, basename } from 'path';
import { getUser } from '../../utils/auth';
import { authRequired, forbidden, serverError } from '../../utils/errors';
import { logAudit } from '../../audit';
import { createLogger } from '../../services/logger';

const execAsync = promisify(exec);
const log = createLogger('backups');

// Backup directory — Docker volume at /app/backups, fallback for dev
const BACKUP_DIR = process.env.BACKUP_DIR || '/app/backups';

// DB connection details from env (same vars as db.ts)
const DB_HOST = process.env.HABITRACK_DB_HOST || '127.0.0.1';
const DB_PORT = process.env.HABITRACK_DB_PORT || '3306';
const DB_USER = process.env.HABITRACK_DB_USER || 'habitrack_app';
const DB_PASS = process.env.HABITRACK_DB_PASSWORD || '';
const DB_NAME = process.env.HABITRACK_DB_NAME || 'habitrack';

// Ensure backup directory exists
function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Validate filename to prevent path traversal
function isValidFilename(filename: string): boolean {
  const safe = /^habitrack_\d{4}-\d{2}-\d{2}_\d{6}\.sql\.gz$/.test(filename);
  return safe && !filename.includes('..') && !filename.includes('/') && !filename.includes('\\');
}

// Detect which dump command is available
async function getDumpCommand(): Promise<string> {
  try {
    await execAsync('which mariadb-dump');
    return 'mariadb-dump';
  } catch {
    try {
      await execAsync('which mysqldump');
      return 'mysqldump';
    } catch {
      throw new Error('Neither mariadb-dump nor mysqldump found. Install mariadb-client.');
    }
  }
}

// Detect which restore command is available
async function getRestoreCommand(): Promise<string> {
  try {
    await execAsync('which mariadb');
    return 'mariadb';
  } catch {
    try {
      await execAsync('which mysql');
      return 'mysql';
    } catch {
      throw new Error('Neither mariadb nor mysql client found. Install mariadb-client.');
    }
  }
}

/**
 * POST /api/backups/create
 * Create a gzipped database backup
 */
export async function createBackup(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    ensureBackupDir();

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, (m) => {
      if (m === 'T') return '_';
      if (m === ':') return '';
      return m;
    }).slice(0, 17).replace(/-/g, '-');
    // Format: habitrack_YYYY-MM-DD_HHmmss.sql.gz
    const pad = (n: number) => String(n).padStart(2, '0');
    const filename = `habitrack_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.sql.gz`;
    const filepath = join(BACKUP_DIR, filename);

    log.info('Creating database backup', { filename, userId: user.id });

    const dumpCmd = await getDumpCommand();

    // Build the dump command with gzip
    const cmd = `${dumpCmd} -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p'${DB_PASS}' --single-transaction --routines --triggers ${DB_NAME} | gzip > "${filepath}"`;

    await execAsync(cmd, { timeout: 120000 }); // 2 minute timeout

    const stats = statSync(filepath);

    await logAudit({
      action: 'system.backup.create',
      result: 'ok',
      actorId: user.id,
      details: { filename, sizeMB: (stats.size / 1024 / 1024).toFixed(2) },
    });

    log.info('Backup created successfully', { filename, size: stats.size });

    return res.json({
      success: true,
      backup: {
        filename,
        size: stats.size,
        createdAt: now.toISOString(),
      },
    });
  } catch (err: any) {
    log.error('Failed to create backup', { error: err.message });
    return serverError(res, `Failed to create backup: ${err.message}`);
  }
}

/**
 * GET /api/backups
 * List all available backups
 */
export async function listBackups(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    ensureBackupDir();

    const files = readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql.gz'))
      .map(f => {
        const stats = statSync(join(BACKUP_DIR, f));
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ backups: files });
  } catch (err: any) {
    log.error('Failed to list backups', { error: err.message });
    return serverError(res, 'Failed to list backups');
  }
}

/**
 * GET /api/backups/:filename/download
 * Stream a backup file to the client
 */
export async function downloadBackup(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const { filename } = req.params;
    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = join(BACKUP_DIR, filename);
    if (!existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    const stats = statSync(filepath);
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    const stream = createReadStream(filepath);
    stream.pipe(res);
  } catch (err: any) {
    log.error('Failed to download backup', { error: err.message });
    return serverError(res, 'Failed to download backup');
  }
}

/**
 * POST /api/backups/:filename/restore
 * Restore the database from a backup (DESTRUCTIVE)
 */
export async function restoreBackup(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const { filename } = req.params;
    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = join(BACKUP_DIR, filename);
    if (!existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    log.info('Starting database restore', { filename, userId: user.id });

    const restoreCmd = await getRestoreCommand();

    // Decompress and pipe into mariadb/mysql client
    const cmd = `gunzip -c "${filepath}" | ${restoreCmd} -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME}`;

    await execAsync(cmd, { timeout: 300000 }); // 5 minute timeout

    await logAudit({
      action: 'system.backup.restore',
      result: 'ok',
      actorId: user.id,
      details: { filename },
    });

    log.info('Database restored successfully', { filename });

    return res.json({
      success: true,
      message: 'Database restored successfully. Please restart the containers to ensure clean state.',
      instructions: [
        '1. Database has been restored from backup',
        '2. Restart containers for a clean state:',
        '   docker compose down && docker compose up -d',
        '3. You will be logged out and need to sign in again',
      ],
    });
  } catch (err: any) {
    log.error('Failed to restore backup', { error: err.message });

    await logAudit({
      action: 'system.backup.restore',
      result: 'error',
      actorId: getUser(req)?.id,
      details: { filename: req.params.filename, error: err.message },
    });

    return serverError(res, `Failed to restore backup: ${err.message}`);
  }
}

/**
 * DELETE /api/backups/:filename
 * Delete a backup file
 */
export async function deleteBackup(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const { filename } = req.params;
    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = join(BACKUP_DIR, filename);
    if (!existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    unlinkSync(filepath);

    await logAudit({
      action: 'system.backup.delete',
      result: 'ok',
      actorId: user.id,
      details: { filename },
    });

    log.info('Backup deleted', { filename });

    return res.json({ success: true });
  } catch (err: any) {
    log.error('Failed to delete backup', { error: err.message });
    return serverError(res, 'Failed to delete backup');
  }
}
