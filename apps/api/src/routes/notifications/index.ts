// apps/api/src/routes/notifications/index.ts
// Notification routes

import { Router } from 'express';
import { requireAuth } from '../../middleware.auth';
import { getPreferences, updatePreferences } from './preferences';
import { getEmailSettings, updateEmailSettings, sendTestEmail } from './email-settings';

const router = Router();

// User notification preferences
router.get('/preferences', requireAuth(), getPreferences);
router.put('/preferences', requireAuth(), updatePreferences);

// Admin-only email settings
router.get('/email-settings', requireAuth('admin'), getEmailSettings);
router.put('/email-settings', requireAuth('admin'), updateEmailSettings);
router.post('/email-settings/test', requireAuth('admin'), sendTestEmail);

export default router;
