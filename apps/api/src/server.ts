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

// Import and start calendar reminder service
import { startReminderService } from './services/calendarReminders';

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

// Serve uploaded files
app.use('/uploads', express.static(process.env.UPLOAD_DIR || '/app/uploads'));

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
  console.log(`🚀 HabiTrack API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Base URL: ${cfg.HABITRACK_BASE_URL}`);
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

// Start calendar reminder service
startReminderService();

export default app;
