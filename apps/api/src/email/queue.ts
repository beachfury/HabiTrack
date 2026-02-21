// apps/api/src/email/queue.ts
// Helper functions to queue emails for sending via the notification worker

import { q } from '../db';
import { renderTemplate, EmailTemplate, EMAIL_TEMPLATES, EmailTemplateType } from './templates';
import { getCurrentTime } from '../utils/date';

interface QueueEmailOptions {
  userId: number;
  toEmail: string;
  template: EmailTemplateType;
  variables: Record<string, string | number>;
  scheduledAt?: Date;
}

/**
 * Queue an email for sending via the notification worker
 * Checks user preferences before queueing
 */
export async function queueEmail(options: QueueEmailOptions): Promise<{ queued: boolean; reason?: string }> {
  const { userId, toEmail, template, variables, scheduledAt } = options;

  console.log(`[email-queue] Attempting to queue ${template} email for user ${userId} to ${toEmail}`);

  // Get the template
  const emailTemplate = EMAIL_TEMPLATES[template];
  if (!emailTemplate) {
    console.error(`[email-queue] Unknown template: ${template}`);
    return { queued: false, reason: 'Unknown template' };
  }

  // Check user notification preferences
  const prefsOk = await checkUserPreferences(userId, template);
  if (!prefsOk.enabled) {
    console.log(`[email-queue] Skipped: ${prefsOk.reason}`);
    return { queued: false, reason: prefsOk.reason };
  }

  // Check if email is enabled globally
  const emailEnabled = await isEmailEnabled();
  if (!emailEnabled) {
    console.log(`[email-queue] Skipped: Email not configured (no SMTP host in email_settings)`);
    return { queued: false, reason: 'Email not configured' };
  }

  // Render the template
  const rendered = renderTemplate(emailTemplate, variables);

  try {
    // If no scheduledAt provided, send immediately (use NOW())
    if (scheduledAt) {
      await q(
        `INSERT INTO notifications_outbox (kind, userId, to_email, subject, body_text, body_html, scheduledAt, attempts)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          template,
          userId,
          toEmail,
          rendered.subject,
          rendered.text,
          rendered.html,
          scheduledAt,
        ],
      );
    } else {
      await q(
        `INSERT INTO notifications_outbox (kind, userId, to_email, subject, body_text, body_html, scheduledAt, attempts)
         VALUES (?, ?, ?, ?, ?, ?, NOW(3), 0)`,
        [
          template,
          userId,
          toEmail,
          rendered.subject,
          rendered.text,
          rendered.html,
        ],
      );
    }

    console.log(`[email-queue] Queued ${template} email for user ${userId} to ${toEmail}`);
    return { queued: true };
  } catch (err) {
    console.error('[email-queue] Failed to queue email:', err);
    return { queued: false, reason: 'Database error' };
  }
}

/**
 * Queue emails for multiple recipients
 */
export async function queueBulkEmails(
  recipients: Array<{ userId: number; toEmail: string; variables: Record<string, string | number> }>,
  template: EmailTemplateType,
  scheduledAt?: Date,
): Promise<{ queued: number; skipped: number }> {
  let queued = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    const result = await queueEmail({
      userId: recipient.userId,
      toEmail: recipient.toEmail,
      template,
      variables: recipient.variables,
      scheduledAt,
    });

    if (result.queued) {
      queued++;
    } else {
      skipped++;
    }
  }

  return { queued, skipped };
}

/**
 * Check if user has enabled notifications for a specific type
 */
async function checkUserPreferences(
  userId: number,
  template: EmailTemplateType,
): Promise<{ enabled: boolean; reason?: string }> {
  try {
    const [prefs] = await q<
      Array<{
        emailEnabled: boolean;
        choreReminders: boolean;
        choreAssignments: boolean;
        choreCompletions: boolean;
        eventReminders: boolean;
        shoppingUpdates: boolean;
        messageNotifications: boolean;
        achievementNotifications: boolean;
        quietHoursEnabled: number;
        quietHoursStart: string;
        quietHoursEnd: string;
      }>
    >('SELECT * FROM notification_preferences WHERE userId = ?', [userId]);

    // Default to enabled if no preferences set
    if (!prefs) {
      return { enabled: true };
    }

    // Check if email is globally disabled for user
    if (!prefs.emailEnabled) {
      return { enabled: false, reason: 'User disabled email notifications' };
    }

    // Check quiet hours (Do Not Disturb) — skip for critical emails
    const bypassQuietHours = ['WELCOME_MEMBER', 'PASSWORD_RESET_REQUIRED', 'TEST_EMAIL'];
    if (prefs.quietHoursEnabled && !bypassQuietHours.includes(template)) {
      if (isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)) {
        return { enabled: false, reason: 'Quiet hours active (Do Not Disturb)' };
      }
    }

    // Map templates to preference fields
    const templateToPreference: Record<EmailTemplateType, string | null> = {
      CHORE_REMINDER: 'choreReminders',
      CHORE_ASSIGNED: 'choreAssignments',
      CHORE_COMPLETED: 'choreCompletions',
      EVENT_REMINDER: 'eventReminders',
      EVENT_CREATED: 'eventReminders',
      EVENT_UPDATED: 'eventReminders',
      EVENT_CANCELLED: 'eventReminders',
      SHOPPING_ITEM_ADDED: 'shoppingUpdates',
      NEW_MESSAGE: 'messageNotifications',
      ANNOUNCEMENT: 'messageNotifications',
      ACHIEVEMENT_EARNED: 'achievementNotifications',
      POINTS_ADJUSTED: 'choreCompletions', // Use chore completions for points
      MEAL_FINALIZED: 'eventReminders', // Use event reminders for meals
      RECIPE_STATUS: 'eventReminders',
      VOTING_OPENED: 'eventReminders',
      STORE_REQUEST: 'shoppingUpdates',
      NEW_FAMILY_MEMBER: 'messageNotifications',
      WELCOME_MEMBER: null, // Always send welcome emails
      PASSWORD_RESET_REQUIRED: null, // Always send password reset emails
      PAID_CHORE_AVAILABLE: 'choreAssignments',
      PAID_CHORE_UPDATE: 'choreCompletions',
      TEST_EMAIL: null, // Always send test emails
    };

    const prefField = templateToPreference[template];
    if (prefField && !(prefs as any)[prefField]) {
      return { enabled: false, reason: `User disabled ${prefField} notifications` };
    }

    return { enabled: true };
  } catch (err) {
    // If preferences table doesn't exist, default to enabled
    console.warn('[email-queue] Failed to check user preferences:', err);
    return { enabled: true };
  }
}

/**
 * Check if the current time falls within quiet hours (Do Not Disturb)
 * Handles wrap-around times (e.g., 22:00 to 07:00 crossing midnight)
 */
function isInQuietHours(startTime: string, endTime: string): boolean {
  const now = getCurrentTime(); // HH:MM in configured timezone

  // Normalize to HH:MM format (database may store as HH:MM:SS)
  const start = startTime.slice(0, 5);
  const end = endTime.slice(0, 5);

  if (start <= end) {
    // Same-day range (e.g., 09:00 to 17:00)
    return now >= start && now < end;
  } else {
    // Wrap-around range (e.g., 22:00 to 07:00)
    return now >= start || now < end;
  }
}

/**
 * Check if email is configured and enabled globally
 */
async function isEmailEnabled(): Promise<boolean> {
  try {
    const [settings] = await q<Array<{ smtpHost: string | null }>>(
      'SELECT smtpHost FROM email_settings WHERE id = 1',
    );

    // Email is enabled if SMTP host is configured
    return !!(settings?.smtpHost);
  } catch {
    // If settings table doesn't exist, email is not configured
    return false;
  }
}

/**
 * Get user's email address
 */
export async function getUserEmail(userId: number): Promise<string | null> {
  try {
    const [user] = await q<Array<{ email: string | null }>>(
      'SELECT email FROM users WHERE id = ? AND active = 1',
      [userId],
    );
    return user?.email || null;
  } catch {
    return null;
  }
}

/**
 * Get all active users with email addresses for bulk notifications
 */
export async function getActiveUsersWithEmail(): Promise<
  Array<{ id: number; displayName: string; email: string }>
> {
  try {
    const users = await q<Array<{ id: number; displayName: string; email: string }>>(
      `SELECT id, displayName, email
       FROM users
       WHERE active = 1 AND email IS NOT NULL AND email != ''
         AND roleId != 'kiosk'`,
    );
    return users;
  } catch {
    return [];
  }
}
