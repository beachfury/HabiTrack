// apps/api/src/server.ts
// Main Express server - uses modular router

import * as dotenv from 'dotenv';
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import { parseEnv } from '@habitrack/core-config';
import { getSettings, reloadSettings } from './settings';
import { refreshPermissions } from './permissions';
import { issueCsrf, csrfProtect } from './csrf';

// Import the centralized router
import router from './router';
import { setTimezone } from './utils/date';
import { q } from './db';
import { kioskRestrictions } from './middleware';

// Import and start calendar reminder service
import { startReminderService } from './services/calendarReminders';

// Import and start chore reminder service
import { startChoreReminderService } from './services/choreReminders';

// Import and start chore deadline reminder service
import { startChoreDeadlineService } from './services/choreDeadlineReminders';

// Import session janitor (cleans expired sessions)
import { startJanitor } from './janitor';

// Import logger service
import { configureLogger, createLogger } from './services/logger';
import { getVersionInfo } from './utils/version';

const appLogger = createLogger('server');

// Import email notification worker (starts automatically on import)
import './workers/send-notifications';

const cfg = parseEnv(process.env);
const app = express();

// =============================================================================
// DYNAMIC SETTINGS & PERMISSIONS REFRESH
// =============================================================================
reloadSettings().catch(console.error);
refreshPermissions().catch(console.error);
setInterval(() => reloadSettings().catch(() => {}), 5 * 60 * 1000);
setInterval(() => refreshPermissions().catch(() => {}), 5 * 60 * 1000);

// =============================================================================
// CORS
// =============================================================================
app.use(
  cors({
    origin(origin, cb) {
      const dyn = getSettings();
      const allowList = dyn.allowedOrigins.length
        ? dyn.allowedOrigins
        : cfg.allowedOrigins.length
          ? cfg.allowedOrigins
          : [cfg.HABITRACK_BASE_URL];

      if (!origin) return cb(null, true);
      cb(null, allowList.includes(origin));
    },
    credentials: true,
  }),
);

// =============================================================================
// MIDDLEWARE
// =============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Serve uploaded files - use UPLOAD_DIR env var or fall back to local uploads folder
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
console.log(`[uploads] Serving static files from: ${uploadDir}`);
app.use('/uploads', express.static(uploadDir));

// =============================================================================
// CSRF (for state-changing operations)
// =============================================================================
app.get('/api/csrf', issueCsrf);

// Debug CSRF endpoint
app.get('/api/_debug/csrf', (req, res) => {
  const cookieName = cfg.HABITRACK_CSRF_COOKIE_NAME ?? 'habitrack_csrf';
  res.json({
    cookieName,
    cookieValue: (req as any).cookies?.[cookieName] ?? null,
    headerName: cfg.HABITRACK_CSRF_HEADER_NAME ?? 'X-HabiTrack-CSRF',
    cookieSecure:
      String(process.env.HABITRACK_ENV || process.env.NODE_ENV || 'development').toLowerCase() ===
      'production',
    sameSite: String(cfg.HABITRACK_COOKIE_SAMESITE ?? 'Lax'),
  });
});

// =============================================================================
// CONTENT SECURITY POLICY
// =============================================================================
// Widgets and themes must not load external resources (except Open-Meteo for weather).
// CSP is the primary enforcement — even if code tries fetch(), the browser blocks it.
app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",            // inline styles needed for themes
      "img-src 'self' data: blob:",                   // data: for base64 theme assets
      "font-src 'self' data:",
      "connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com", // Weather widget only
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  );
  next();
});

// =============================================================================
// KIOSK RESTRICTIONS (applies to all API routes)
// =============================================================================
// SECURITY: Kiosk sessions have restricted access to certain routes
// This middleware checks if the session is a kiosk session and blocks
// access to admin, settings, and other sensitive endpoints
app.use('/api', kioskRestrictions);

// =============================================================================
// API ROUTES
// =============================================================================
app.use('/api', router);

// =============================================================================
// HEALTH CHECK
// =============================================================================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  res.status(status).json({
    error: {
      code,
      message: process.env.NODE_ENV === 'production' ? undefined : message,
    },
  });
});

// =============================================================================
// START SERVER
// =============================================================================

// Initialize timezone from settings
const PORT = parseInt(process.env.PORT || '4000', 10);
app.listen(PORT, '0.0.0.0', () => {
  const versionInfo = getVersionInfo();
  console.log(`🚀 HabiTrack API v${versionInfo.version} running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Base URL: ${cfg.HABITRACK_BASE_URL}`);
  appLogger.info('Server started', { port: PORT, version: versionInfo.version });
});

// Initialize timezone from settings
async function initializeTimezone() {
  try {
    const [setting] = await q<Array<{ value: string }>>(
      `SELECT value FROM settings WHERE \`key\` = 'timezone' LIMIT 1`,
    );
    if (setting?.value) {
      setTimezone(setting.value);
      console.log(`[timezone] Set to: ${setting.value}`);
    } else {
      console.log('[timezone] Using default: America/Los_Angeles');
    }
  } catch (err) {
    console.error('[timezone] Failed to load from database, using default');
  }
}

// Call it after database connection is established:
// e.g., after your app.listen() or database init:
initializeTimezone();
initializeLogger();

// Start calendar reminder service
startReminderService();

// Start chore reminder service
startChoreReminderService();

// Start chore deadline reminder service (checks every minute for configured times)
startChoreDeadlineService();

// Start session janitor (cleans expired sessions every 10 minutes)
startJanitor();

// Initialize logger from database settings
async function initializeLogger() {
  try {
    const [settings] = await q<Array<{
      debugMode: number;
      logLevel: 'error' | 'warn' | 'info' | 'debug';
      logToFile: number;
    }>>(
      `SELECT debugMode, logLevel, logToFile FROM settings WHERE id = 1 LIMIT 1`,
    );

    if (settings) {
      const isDebugMode = Boolean(settings.debugMode);
      const logLevel = settings.logLevel || 'info';

      configureLogger({
        enabled: true, // Always enabled - level controls what gets logged
        level: isDebugMode ? logLevel : 'info', // Use setting's level when debug mode is on
        writeToFile: Boolean(settings.logToFile),
      });

      console.log(`[logger] Initialized: debugMode=${isDebugMode}, level=${logLevel}, logToFile=${Boolean(settings.logToFile)}`);
      appLogger.info('Logger initialized from database settings', {
        debugMode: isDebugMode,
        logLevel: logLevel,
      });
    } else {
      // No settings row, use defaults but keep enabled
      configureLogger({
        enabled: true,
        level: 'info',
        writeToFile: false,
      });
      console.log('[logger] Using default settings (no settings row found)');
    }
  } catch (err) {
    // Columns might not exist yet if migration hasn't run
    // Enable with default settings anyway
    configureLogger({
      enabled: true,
      level: 'info',
      writeToFile: false,
    });
    console.log('[logger] Using default settings (migration may not have run yet)');
  }
}

// Refresh logger settings periodically (every 30 seconds)
setInterval(async () => {
  try {
    const [settings] = await q<Array<{
      debugMode: number;
      logLevel: 'error' | 'warn' | 'info' | 'debug';
      logToFile: number;
    }>>(
      `SELECT debugMode, logLevel, logToFile FROM settings WHERE id = 1 LIMIT 1`,
    );

    if (settings) {
      const isDebugMode = Boolean(settings.debugMode);
      configureLogger({
        enabled: true,
        level: isDebugMode ? (settings.logLevel || 'info') : 'info',
        writeToFile: Boolean(settings.logToFile),
      });
    }
  } catch {
    // Silently fail - keep existing settings
  }
}, 30 * 1000);

export default app;
