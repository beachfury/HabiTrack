// apps/api/src/services/choreDeadlineReminders.ts
// Service to send reminder emails when chores are not completed by configured times.
// Household-wide setting: admin configures up to 4 check times per day.
// At each check time, pending chores for today trigger reminders to:
//   1. The assigned user
//   2. All admin users

import { q } from '../db';
import { createNotification } from '../routes/messages';
import { queueEmail, getUserEmail } from '../email/queue';
import { getTodayLocal } from '../utils/date';

interface DeadlineSettings {
  choreDeadlineReminder1Enabled: number;
  choreDeadlineReminder1Time: string;
  choreDeadlineReminder2Enabled: number;
  choreDeadlineReminder2Time: string;
  choreDeadlineReminder3Enabled: number;
  choreDeadlineReminder3Time: string;
  choreDeadlineReminder4Enabled: number;
  choreDeadlineReminder4Time: string;
  timezone: string | null;
}

interface PendingChore {
  instanceId: number;
  choreId: number;
  title: string;
  dueDate: string;
  points: number;
  assignedTo: number;
  assignedToName: string;
}

interface AdminUser {
  id: number;
  displayName: string;
  email: string;
}

/**
 * Get current time in HH:MM format (household timezone)
 */
function getCurrentHHMM(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

/**
 * Normalize a TIME value from the database to HH:MM format
 */
function normalizeTime(timeStr: string): string {
  // DB TIME values come as "HH:MM:SS", we need "HH:MM"
  return timeStr.slice(0, 5);
}

/**
 * Check for pending chores and send deadline reminders
 */
async function checkDeadlineReminders() {
  try {
    // Load household settings
    const [settings] = await q<DeadlineSettings[]>(
      `SELECT choreDeadlineReminder1Enabled, choreDeadlineReminder1Time,
              choreDeadlineReminder2Enabled, choreDeadlineReminder2Time,
              choreDeadlineReminder3Enabled, choreDeadlineReminder3Time,
              choreDeadlineReminder4Enabled, choreDeadlineReminder4Time,
              timezone
       FROM settings WHERE id = 1`,
    );

    if (!settings) return;

    // Build list of enabled slots
    const slots = [
      { slot: 1, enabled: !!settings.choreDeadlineReminder1Enabled, time: settings.choreDeadlineReminder1Time },
      { slot: 2, enabled: !!settings.choreDeadlineReminder2Enabled, time: settings.choreDeadlineReminder2Time },
      { slot: 3, enabled: !!settings.choreDeadlineReminder3Enabled, time: settings.choreDeadlineReminder3Time },
      { slot: 4, enabled: !!settings.choreDeadlineReminder4Enabled, time: settings.choreDeadlineReminder4Time },
    ];

    const enabledSlots = slots.filter((s) => s.enabled);
    if (enabledSlots.length === 0) return;

    const currentTime = getCurrentHHMM();

    for (const { slot, time } of enabledSlots) {
      const slotTime = normalizeTime(time);

      // Only fire if current minute matches the configured time
      if (currentTime !== slotTime) continue;

      const today = getTodayLocal();

      // Find pending chores due today that haven't been reminded for this slot today
      const pendingChores = await q<PendingChore[]>(
        `SELECT
          ci.id as instanceId, ci.choreId, c.title, ci.dueDate,
          c.points, ci.assignedTo,
          u.displayName as assignedToName
         FROM chore_instances ci
         JOIN chores c ON ci.choreId = c.id
         LEFT JOIN users u ON ci.assignedTo = u.id
         WHERE DATE(ci.dueDate) = ?
           AND ci.status = 'pending'
           AND ci.assignedTo IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM chore_deadline_reminders_sent cdr
             WHERE cdr.instanceId = ci.id
               AND cdr.reminderSlot = ?
               AND cdr.sentDate = ?
           )`,
        [today, slot, today],
      );

      if (pendingChores.length === 0) continue;

      // Get all admin users with email for CC
      const adminUsers = await q<AdminUser[]>(
        `SELECT u.id, u.displayName, u.email
         FROM users u
         WHERE u.active = 1
           AND u.email IS NOT NULL
           AND u.email != ''
           AND u.roleId = 'admin'`,
      );

      for (const chore of pendingChores) {
        // 1. Send to assigned user
        const assigneeEmail = await getUserEmail(chore.assignedTo);
        if (assigneeEmail) {
          await queueEmail({
            userId: chore.assignedTo,
            toEmail: assigneeEmail,
            template: 'CHORE_REMINDER',
            variables: {
              userName: chore.assignedToName || 'there',
              choreName: chore.title,
              dueTime: 'today',
              points: chore.points,
            },
          });
        }

        // In-app notification for assigned user
        await createNotification({
          userId: chore.assignedTo,
          type: 'chore',
          title: `Reminder: ${chore.title} is still pending`,
          body: `"${chore.title}" hasn't been completed yet. ${chore.points} points!`,
          link: '/chores',
          relatedId: chore.instanceId,
          relatedType: 'chore_deadline_reminder',
        });

        // 2. Send to all admin users (skip if admin is the assigned user — they already got it)
        for (const admin of adminUsers) {
          if (admin.id === chore.assignedTo) continue;
          await queueEmail({
            userId: admin.id,
            toEmail: admin.email,
            template: 'CHORE_REMINDER',
            variables: {
              userName: admin.displayName,
              choreName: `${chore.title} (assigned to ${chore.assignedToName})`,
              dueTime: 'today',
              points: chore.points,
            },
          });
        }

        // Record that we sent this reminder to prevent duplicates
        await q(
          `INSERT IGNORE INTO chore_deadline_reminders_sent (instanceId, reminderSlot, sentDate)
           VALUES (?, ?, ?)`,
          [chore.instanceId, slot, today],
        );
      }

      console.log(
        `[chore-deadline] Sent ${pendingChores.length} deadline reminders for slot ${slot} at ${slotTime}`,
      );
    }
  } catch (err) {
    console.error('[chore-deadline] Error checking deadline reminders:', err);
  }
}

/**
 * Start the chore deadline reminder service.
 * Runs every minute to check if the current time matches any configured slot.
 */
export function startChoreDeadlineService() {
  console.log('[chore-deadline] Starting chore deadline reminder service');

  // Run immediately on startup (in case server restarts at a configured time)
  checkDeadlineReminders().catch(console.error);

  // Check every minute
  setInterval(() => {
    checkDeadlineReminders().catch(console.error);
  }, 60 * 1000);
}
