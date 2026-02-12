// apps/api/src/routes/debug/index.ts
// Debug and diagnostics API endpoints (admin only)
// SECURITY: Debug mode is off by default and auto-disables after timeout

import type { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { q } from '../../db';
import { getUser } from '../../utils/auth';
import { authRequired, forbidden, serverError } from '../../utils/errors';
import { getVersionInfo } from '../../utils/version';
import {
  configureLogger,
  getLoggerConfig,
  getRecentLogs,
  exportLogs,
  clearLogBuffer,
  getLogFiles,
  type LogLevel,
} from '../../services/logger';

// =============================================================================
// HELPER: Check and auto-disable debug mode if expired
// =============================================================================

async function checkDebugModeTimeout(): Promise<boolean> {
  try {
    const [settings] = await q<Array<{
      debugMode: number;
      debugModeEnabledAt: string | null;
      debugModeAutoDisableHours: number;
    }>>(
      `SELECT debugMode, debugModeEnabledAt, debugModeAutoDisableHours FROM settings WHERE id = 1`
    );

    if (!settings?.debugMode || !settings.debugModeEnabledAt) {
      return Boolean(settings?.debugMode);
    }

    const enabledAt = new Date(settings.debugModeEnabledAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - enabledAt.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed >= settings.debugModeAutoDisableHours) {
      // Auto-disable debug mode
      await q(`UPDATE settings SET debugMode = 0, debugModeEnabledAt = NULL WHERE id = 1`);
      configureLogger({ enabled: false });
      console.log(`[debug] Auto-disabled debug mode after ${settings.debugModeAutoDisableHours} hours`);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// HELPER: Sanitize version string to hide patch details
// =============================================================================

function sanitizeVersion(version: string): string {
  // Convert "10.5.18-MariaDB" to "10.x" or "8.0.35" to "8.x"
  const match = version.match(/^(\d+)\./);
  return match ? `${match[1]}.x` : 'unknown';
}

// =============================================================================
// GET /api/version - Public version info
// =============================================================================

export async function getVersion(req: Request, res: Response) {
  try {
    const versionInfo = getVersionInfo();

    res.json({
      version: versionInfo.version,
      name: versionInfo.name,
      environment: versionInfo.environment,
    });
  } catch (err) {
    console.error('Failed to get version:', err);
    serverError(res, 'Failed to get version');
  }
}

// =============================================================================
// GET /api/debug/settings - Get debug settings (admin only)
// =============================================================================

export async function getDebugSettings(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    // Check if debug mode should be auto-disabled
    await checkDebugModeTimeout();

    const [settings] = await q<Array<{
      debugMode: number;
      logLevel: LogLevel;
      logToFile: number;
      logRetentionDays: number;
      debugModeEnabledAt: string | null;
      debugModeAutoDisableHours: number;
    }>>(
      `SELECT debugMode, logLevel, logToFile, logRetentionDays, debugModeEnabledAt, debugModeAutoDisableHours FROM settings WHERE id = 1`
    );

    const loggerConfig = getLoggerConfig();
    const versionInfo = getVersionInfo();

    // Calculate time remaining if debug mode is active
    let debugModeExpiresAt: string | null = null;
    if (settings?.debugMode && settings.debugModeEnabledAt) {
      const enabledAt = new Date(settings.debugModeEnabledAt);
      const expiresAt = new Date(enabledAt.getTime() + settings.debugModeAutoDisableHours * 60 * 60 * 1000);
      debugModeExpiresAt = expiresAt.toISOString();
    }

    res.json({
      version: versionInfo,
      settings: {
        debugMode: Boolean(settings?.debugMode),
        logLevel: settings?.logLevel || 'error',
        logToFile: Boolean(settings?.logToFile),
        logRetentionDays: settings?.logRetentionDays || 7,
        debugModeAutoDisableHours: settings?.debugModeAutoDisableHours || 4,
        debugModeEnabledAt: settings?.debugModeEnabledAt || null,
        debugModeExpiresAt,
      },
      logger: loggerConfig,
      logFiles: getLogFiles().map(f => ({
        name: f.name,
        size: f.size,
        modified: f.modified.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Failed to get debug settings:', err);
    serverError(res, 'Failed to get debug settings');
  }
}

// =============================================================================
// PUT /api/debug/settings - Update debug settings (admin only)
// =============================================================================

export async function updateDebugSettings(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const { debugMode, logLevel, logToFile, logRetentionDays, debugModeAutoDisableHours } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    // Get current debug mode state to detect changes
    const [currentSettings] = await q<Array<{ debugMode: number }>>(
      `SELECT debugMode FROM settings WHERE id = 1`
    );
    const wasEnabled = Boolean(currentSettings?.debugMode);

    if (debugMode !== undefined) {
      updates.push('debugMode = ?');
      params.push(debugMode ? 1 : 0);

      // Track when debug mode is enabled (for auto-disable)
      if (debugMode && !wasEnabled) {
        updates.push('debugModeEnabledAt = NOW(3)');
      } else if (!debugMode) {
        updates.push('debugModeEnabledAt = NULL');
      }
    }

    if (logLevel !== undefined) {
      const validLevels = ['error', 'warn', 'info', 'debug'];
      if (!validLevels.includes(logLevel)) {
        return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid log level' } });
      }
      updates.push('logLevel = ?');
      params.push(logLevel);
    }

    if (logToFile !== undefined) {
      updates.push('logToFile = ?');
      params.push(logToFile ? 1 : 0);
    }

    if (logRetentionDays !== undefined) {
      updates.push('logRetentionDays = ?');
      params.push(Math.max(1, Math.min(30, logRetentionDays)));
    }

    if (debugModeAutoDisableHours !== undefined) {
      updates.push('debugModeAutoDisableHours = ?');
      params.push(Math.max(1, Math.min(24, debugModeAutoDisableHours)));
    }

    if (updates.length > 0) {
      await q(`UPDATE settings SET ${updates.join(', ')} WHERE id = 1`, params);

      // Fetch updated settings to configure logger correctly
      const [updatedSettings] = await q<Array<{
        debugMode: number;
        logLevel: LogLevel;
        logToFile: number;
      }>>(
        `SELECT debugMode, logLevel, logToFile FROM settings WHERE id = 1`
      );

      // Apply to logger immediately
      const isDebugMode = Boolean(updatedSettings?.debugMode);
      const effectiveLevel = updatedSettings?.logLevel || 'info';

      configureLogger({
        enabled: true, // Always enabled - level controls filtering
        level: isDebugMode ? effectiveLevel : 'info',
        writeToFile: Boolean(updatedSettings?.logToFile),
      });

      console.log(`[debug] Logger configured: enabled=true, level=${isDebugMode ? effectiveLevel : 'info'}, writeToFile=${Boolean(updatedSettings?.logToFile)}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update debug settings:', err);
    serverError(res, 'Failed to update debug settings');
  }
}

// =============================================================================
// GET /api/debug/logs - Get recent logs (admin only)
// =============================================================================

export async function getLogs(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const { limit = '100', level } = req.query;
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit as string, 10) || 100));

    const logs = getRecentLogs(limitNum, level as LogLevel | undefined);

    res.json({ logs, count: logs.length });
  } catch (err) {
    console.error('Failed to get logs:', err);
    serverError(res, 'Failed to get logs');
  }
}

// =============================================================================
// GET /api/debug/logs/export - Export logs as downloadable file (admin only)
// =============================================================================

export async function exportLogsFile(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const { level, format = 'txt' } = req.query;

    const logs = getRecentLogs(10000, level as LogLevel | undefined);
    const versionInfo = getVersionInfo();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `habitrack-debug-${timestamp}.${format === 'json' ? 'json' : 'log'}`;

    if (format === 'json') {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: versionInfo,
        logCount: logs.length,
        logs,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(exportData, null, 2));
    } else {
      // Text format
      const header = [
        '='.repeat(80),
        `HabiTrack Debug Log Export`,
        `Version: ${versionInfo.version}`,
        `Environment: ${versionInfo.environment}`,
        `Exported: ${new Date().toISOString()}`,
        `Log Count: ${logs.length}`,
        '='.repeat(80),
        '',
      ].join('\n');

      const logText = logs.map(l =>
        `${l.timestamp} [${l.level.toUpperCase()}] [${l.category}] ${l.message}${l.data ? ' ' + JSON.stringify(l.data) : ''}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(header + logText);
    }
  } catch (err) {
    console.error('Failed to export logs:', err);
    serverError(res, 'Failed to export logs');
  }
}

// =============================================================================
// DELETE /api/debug/logs - Clear log buffer (admin only)
// =============================================================================

export async function clearLogs(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    clearLogBuffer();

    res.json({ success: true, message: 'Log buffer cleared' });
  } catch (err) {
    console.error('Failed to clear logs:', err);
    serverError(res, 'Failed to clear logs');
  }
}

// =============================================================================
// GET /api/debug/logs/file/:filename - Download a specific log file (admin only)
// =============================================================================

export async function downloadLogFile(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const { filename } = req.params;

    // Security: only allow downloading habitrack log files
    if (!filename.match(/^habitrack-\d{4}-\d{2}-\d{2}\.log$/)) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid filename' } });
    }

    const logFiles = getLogFiles();
    const file = logFiles.find(f => f.name === filename);

    if (!file) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Log file not found' } });
    }

    const content = readFileSync(file.path, 'utf-8');

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (err) {
    console.error('Failed to download log file:', err);
    serverError(res, 'Failed to download log file');
  }
}

// =============================================================================
// GET /api/debug/system - System diagnostics (admin only)
// SECURITY: Sanitizes version info to not expose exact patch versions
// =============================================================================

export async function getSystemInfo(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const versionInfo = getVersionInfo();

    // Get database info
    const [dbVersion] = await q<Array<{ version: string }>>(`SELECT VERSION() as version`);
    const [dbSize] = await q<Array<{ size_mb: number }>>(`
      SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `);

    // Get table counts (sanitized - only show count, not names that might reveal schema)
    const [tableCount] = await q<Array<{ count: number }>>(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `);

    // SECURITY: Sanitize versions to hide exact patch levels that could reveal vulnerabilities
    const sanitizedNodeVersion = sanitizeVersion(process.version.replace('v', ''));
    const sanitizedDbVersion = dbVersion?.version ? sanitizeVersion(dbVersion.version) : 'unknown';

    res.json({
      app: {
        version: versionInfo.version,
        name: versionInfo.name,
        // Don't expose exact environment details
      },
      server: {
        // Sanitized - only show major version and general info
        nodeVersion: sanitizedNodeVersion,
        platform: process.platform,
        uptime: Math.floor(process.uptime()),
        memory: {
          // Round to nearest 10MB to obscure exact memory layout
          heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 / 10) * 10,
          heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 / 10) * 10,
        },
      },
      database: {
        // Sanitized - hide exact version
        type: dbVersion?.version?.toLowerCase().includes('mariadb') ? 'MariaDB' : 'MySQL',
        version: sanitizedDbVersion,
        sizeMB: Math.round(dbSize?.size_mb || 0),
        tableCount: tableCount?.count || 0,
        // Don't expose table names or row counts
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to get system info:', err);
    serverError(res, 'Failed to get system info');
  }
}

// =============================================================================
// POST /api/debug/frontend-errors - Receive frontend errors (requires auth)
// =============================================================================

interface FrontendError {
  type: 'error' | 'unhandledrejection' | 'console' | 'react';
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  componentStack?: string;
  userAgent?: string;
  timestamp: string;
}

export async function receiveFrontendErrors(req: Request, res: Response) {
  try {
    const user = getUser(req);
    // Allow any authenticated user to report errors (not just admin)
    if (!user) return authRequired(res);

    // Check if debug mode is enabled
    const [settings] = await q<Array<{ debugMode: number }>>(
      `SELECT debugMode FROM settings WHERE id = 1`
    );

    if (!settings?.debugMode) {
      // Silently accept but don't log if debug mode is off
      return res.json({ received: 0 });
    }

    const { errors } = req.body as { errors: FrontendError[] };

    if (!Array.isArray(errors)) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Expected errors array' } });
    }

    // Log each frontend error
    const { createLogger } = await import('../../services/logger');
    const frontendLogger = createLogger('frontend');
    for (const error of errors.slice(0, 50)) { // Limit to 50 errors per request
      frontendLogger.error(`[${error.type}] ${error.message}`, {
        stack: error.stack,
        url: error.url,
        line: error.line,
        column: error.column,
        componentStack: error.componentStack,
        userAgent: error.userAgent,
        userId: user.id,
        originalTimestamp: error.timestamp,
      });
    }

    res.json({ received: Math.min(errors.length, 50) });
  } catch (err) {
    console.error('Failed to receive frontend errors:', err);
    serverError(res, 'Failed to receive frontend errors');
  }
}
