// apps/api/src/routes/notifications/preferences.ts
// API for managing user notification preferences

import type { Request, Response } from 'express';
import { q } from '../../db';
import { success, serverError, validationError } from '../../utils';

/**
 * Notification preferences type
 */
export interface NotificationPreferences {
  emailEnabled: boolean;
  choreReminders: boolean;
  choreAssignments: boolean;
  choreCompletions: boolean;
  eventReminders: boolean;
  shoppingUpdates: boolean;
  messageNotifications: boolean;
  achievementNotifications: boolean;
  reminderLeadTime: number;
  digestMode: 'instant' | 'daily' | 'weekly';
  digestTime: string;
  digestDayOfWeek: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  choreReminders: true,
  choreAssignments: true,
  choreCompletions: false,
  eventReminders: true,
  shoppingUpdates: false,
  messageNotifications: true,
  achievementNotifications: true,
  reminderLeadTime: 24,
  digestMode: 'instant',
  digestTime: '09:00:00',
  digestDayOfWeek: 1,
  quietHoursEnabled: false,
  quietHoursStart: '22:00:00',
  quietHoursEnd: '07:00:00',
};

/**
 * GET /api/notifications/preferences
 * Get current user's notification preferences
 */
export async function getPreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
    }

    const [prefs] = await q<Array<NotificationPreferences>>(
      `SELECT
        emailEnabled, choreReminders, choreAssignments, choreCompletions,
        eventReminders, shoppingUpdates, messageNotifications, achievementNotifications,
        reminderLeadTime, digestMode, digestTime, digestDayOfWeek,
        quietHoursEnabled, quietHoursStart, quietHoursEnd
       FROM notification_preferences
       WHERE userId = ?`,
      [userId],
    );

    // Return defaults if no preferences set yet
    if (!prefs) {
      return success(res, { preferences: DEFAULT_PREFERENCES });
    }

    // Convert booleans from tinyint
    const preferences: NotificationPreferences = {
      emailEnabled: !!prefs.emailEnabled,
      choreReminders: !!prefs.choreReminders,
      choreAssignments: !!prefs.choreAssignments,
      choreCompletions: !!prefs.choreCompletions,
      eventReminders: !!prefs.eventReminders,
      shoppingUpdates: !!prefs.shoppingUpdates,
      messageNotifications: !!prefs.messageNotifications,
      achievementNotifications: !!prefs.achievementNotifications,
      reminderLeadTime: prefs.reminderLeadTime,
      digestMode: prefs.digestMode,
      digestTime: prefs.digestTime,
      digestDayOfWeek: prefs.digestDayOfWeek,
      quietHoursEnabled: !!prefs.quietHoursEnabled,
      quietHoursStart: prefs.quietHoursStart,
      quietHoursEnd: prefs.quietHoursEnd,
    };

    return success(res, { preferences });
  } catch (err) {
    console.error('[getPreferences] error', err);
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/notifications/preferences
 * Update current user's notification preferences
 */
export async function updatePreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
    }

    const updates = req.body as Partial<NotificationPreferences>;

    // Validate input
    if (updates.reminderLeadTime !== undefined) {
      if (typeof updates.reminderLeadTime !== 'number' || updates.reminderLeadTime < 0 || updates.reminderLeadTime > 168) {
        return validationError(res, 'reminderLeadTime must be between 0 and 168 hours');
      }
    }

    if (updates.digestMode !== undefined) {
      if (!['instant', 'daily', 'weekly'].includes(updates.digestMode)) {
        return validationError(res, 'digestMode must be instant, daily, or weekly');
      }
    }

    if (updates.digestDayOfWeek !== undefined) {
      if (typeof updates.digestDayOfWeek !== 'number' || updates.digestDayOfWeek < 1 || updates.digestDayOfWeek > 7) {
        return validationError(res, 'digestDayOfWeek must be between 1 (Monday) and 7 (Sunday)');
      }
    }

    // Check if preferences exist
    const [existing] = await q<Array<{ id: number }>>(
      'SELECT id FROM notification_preferences WHERE userId = ?',
      [userId],
    );

    if (existing) {
      // Update existing preferences
      const fields: string[] = [];
      const values: any[] = [];

      const booleanFields = [
        'emailEnabled',
        'choreReminders',
        'choreAssignments',
        'choreCompletions',
        'eventReminders',
        'shoppingUpdates',
        'messageNotifications',
        'achievementNotifications',
        'quietHoursEnabled',
      ];

      const otherFields = [
        'reminderLeadTime',
        'digestMode',
        'digestTime',
        'digestDayOfWeek',
        'quietHoursStart',
        'quietHoursEnd',
      ];

      for (const field of booleanFields) {
        if ((updates as any)[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push((updates as any)[field] ? 1 : 0);
        }
      }

      for (const field of otherFields) {
        if ((updates as any)[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push((updates as any)[field]);
        }
      }

      if (fields.length > 0) {
        values.push(userId);
        await q(`UPDATE notification_preferences SET ${fields.join(', ')} WHERE userId = ?`, values);
      }
    } else {
      // Insert new preferences with defaults merged with updates
      const prefs = { ...DEFAULT_PREFERENCES, ...updates };

      await q(
        `INSERT INTO notification_preferences (
          userId, emailEnabled, choreReminders, choreAssignments, choreCompletions,
          eventReminders, shoppingUpdates, messageNotifications, achievementNotifications,
          reminderLeadTime, digestMode, digestTime, digestDayOfWeek,
          quietHoursEnabled, quietHoursStart, quietHoursEnd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          prefs.emailEnabled ? 1 : 0,
          prefs.choreReminders ? 1 : 0,
          prefs.choreAssignments ? 1 : 0,
          prefs.choreCompletions ? 1 : 0,
          prefs.eventReminders ? 1 : 0,
          prefs.shoppingUpdates ? 1 : 0,
          prefs.messageNotifications ? 1 : 0,
          prefs.achievementNotifications ? 1 : 0,
          prefs.reminderLeadTime,
          prefs.digestMode,
          prefs.digestTime,
          prefs.digestDayOfWeek,
          prefs.quietHoursEnabled ? 1 : 0,
          prefs.quietHoursStart,
          prefs.quietHoursEnd,
        ],
      );
    }

    // Fetch and return updated preferences
    const [updated] = await q<Array<NotificationPreferences>>(
      `SELECT
        emailEnabled, choreReminders, choreAssignments, choreCompletions,
        eventReminders, shoppingUpdates, messageNotifications, achievementNotifications,
        reminderLeadTime, digestMode, digestTime, digestDayOfWeek,
        quietHoursEnabled, quietHoursStart, quietHoursEnd
       FROM notification_preferences
       WHERE userId = ?`,
      [userId],
    );

    const preferences: NotificationPreferences = {
      emailEnabled: !!updated.emailEnabled,
      choreReminders: !!updated.choreReminders,
      choreAssignments: !!updated.choreAssignments,
      choreCompletions: !!updated.choreCompletions,
      eventReminders: !!updated.eventReminders,
      shoppingUpdates: !!updated.shoppingUpdates,
      messageNotifications: !!updated.messageNotifications,
      achievementNotifications: !!updated.achievementNotifications,
      reminderLeadTime: updated.reminderLeadTime,
      digestMode: updated.digestMode,
      digestTime: updated.digestTime,
      digestDayOfWeek: updated.digestDayOfWeek,
      quietHoursEnabled: !!updated.quietHoursEnabled,
      quietHoursStart: updated.quietHoursStart,
      quietHoursEnd: updated.quietHoursEnd,
    };

    return success(res, { preferences });
  } catch (err) {
    console.error('[updatePreferences] error', err);
    return serverError(res, err as Error);
  }
}
