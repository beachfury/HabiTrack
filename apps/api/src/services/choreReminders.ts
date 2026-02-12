// apps/api/src/services/choreReminders.ts
// Service to send reminder notifications for upcoming chores

import { q } from '../db';
import { createNotification } from '../routes/messages';
import { queueEmail, getUserEmail } from '../email/queue';
import { getTodayLocal } from '../utils/date';

interface UpcomingChore {
  instanceId: number;
  choreId: number;
  title: string;
  dueDate: string;
  dueTime: string | null;
  points: number;
  assignedTo: number;
  assignedToName: string;
  description: string | null;
}

/**
 * Check for chores due today and tomorrow and send reminders
 * Should be called periodically (e.g., every hour via interval)
 */
export async function sendChoreReminders() {
  const today = getTodayLocal();
  const tomorrow = new Date(today + 'T12:00:00');
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Define reminder windows
  const reminderWindows = [
    { date: today, label: 'today', dueTime: 'today' },
    { date: tomorrowStr, label: 'tomorrow', dueTime: 'tomorrow' },
  ];

  for (const window of reminderWindows) {
    try {
      // Find chores due on this date that haven't been reminded yet
      // Only remind in the morning (check if we already sent a reminder for this window)
      const chores = await q<UpcomingChore[]>(
        `SELECT
          ci.id as instanceId, ci.choreId, c.title, ci.dueDate, c.dueTime,
          c.points, ci.assignedTo,
          u.displayName as assignedToName,
          c.description
         FROM chore_instances ci
         JOIN chores c ON ci.choreId = c.id
         LEFT JOIN users u ON ci.assignedTo = u.id
         WHERE DATE(ci.dueDate) = ?
           AND ci.status = 'pending'
           AND ci.assignedTo IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM notifications n
             WHERE n.relatedType = 'chore_reminder'
               AND n.relatedId = ci.id
               AND DATE(n.createdAt) = ?
           )`,
        [window.date, today],
      );

      for (const chore of chores) {
        // Send in-app notification
        await createNotification({
          userId: chore.assignedTo,
          type: 'chore',
          title: `Chore due ${window.label}: ${chore.title}`,
          body: `Don't forget! "${chore.title}" is due ${window.dueTime}. ${chore.points} points!`,
          link: '/chores',
          relatedId: chore.instanceId,
          relatedType: 'chore_reminder',
        });

        // Send email reminder
        const assigneeEmail = await getUserEmail(chore.assignedTo);
        if (assigneeEmail) {
          await queueEmail({
            userId: chore.assignedTo,
            toEmail: assigneeEmail,
            template: 'CHORE_REMINDER',
            variables: {
              userName: chore.assignedToName || 'there',
              choreName: chore.title,
              dueTime: window.dueTime,
              points: chore.points,
            },
          });
        }

        console.log(
          `[chore-reminder] Sent reminder for chore instance ${chore.instanceId} (${chore.title}) to user ${chore.assignedTo}`,
        );
      }

      if (chores.length > 0) {
        console.log(`[chore-reminder] Sent ${chores.length} reminders for chores due ${window.label}`);
      }
    } catch (err) {
      console.error(`[chore-reminder] Error sending ${window.label} reminders:`, err);
    }
  }
}

/**
 * Start the chore reminder service
 * Runs every hour (reminders for today and tomorrow)
 */
export function startChoreReminderService() {
  console.log('[chore-reminder] Starting chore reminder service');

  // Run immediately on startup
  sendChoreReminders().catch(console.error);

  // Then run every hour (check at the top of each hour)
  setInterval(
    () => {
      sendChoreReminders().catch(console.error);
    },
    60 * 60 * 1000, // 1 hour
  );
}
