// apps/api/src/services/calendarReminders.ts
// Service to send reminder notifications before calendar events

import { q } from '../db';
import { createNotification } from '../routes/messages';
import { queueEmail, getUserEmail } from '../email/queue';

interface UpcomingEvent {
  id: number;
  title: string;
  startAt: Date;
  assignedTo: number;
  assignedToName: string;
  createdBy: number;
}

/**
 * Check for upcoming events and send reminders
 * Should be called periodically (e.g., every 5 minutes via cron)
 */
export async function sendEventReminders() {
  const now = new Date();

  // Define reminder windows (minutes before event)
  const reminderWindows = [
    { minutes: 60, label: '1 hour' }, // 1 hour before
    { minutes: 15, label: '15 minutes' }, // 15 minutes before
  ];

  for (const window of reminderWindows) {
    const windowStart = new Date(now.getTime() + (window.minutes - 2) * 60000); // 2 min buffer
    const windowEnd = new Date(now.getTime() + (window.minutes + 2) * 60000); // 2 min buffer

    try {
      // Find events starting within this reminder window that haven't been reminded yet
      const events = await q<UpcomingEvent[]>(
        `SELECT
          e.id, e.title, e.startAt, e.assignedTo, e.createdBy,
          u.displayName as assignedToName
         FROM calendar_events e
         LEFT JOIN users u ON e.assignedTo = u.id
         WHERE e.startAt BETWEEN ? AND ?
           AND e.assignedTo IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM notifications n
             WHERE n.relatedType = 'calendar_reminder'
               AND n.relatedId = e.id
               AND n.body LIKE ?
           )`,
        [windowStart.toISOString(), windowEnd.toISOString(), `%${window.label}%`],
      );

      for (const event of events) {
        // Format the event time
        const eventTime = new Date(event.startAt).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });

        // Send reminder to assigned user
        await createNotification({
          userId: event.assignedTo,
          type: 'calendar',
          title: `Reminder: ${event.title}`,
          body: `Starting in ${window.label} at ${eventTime}`,
          link: `/calendar?date=${new Date(event.startAt).toISOString().split('T')[0]}`,
          relatedId: event.id,
          relatedType: 'calendar_reminder',
        });

        // Send email reminder as well
        const assigneeEmail = await getUserEmail(event.assignedTo);
        if (assigneeEmail) {
          await queueEmail({
            userId: event.assignedTo,
            toEmail: assigneeEmail,
            template: 'EVENT_REMINDER',
            variables: {
              userName: event.assignedToName || 'there',
              eventName: event.title,
              eventTime: `in ${window.label} at ${eventTime}`,
              location: '',
              description: '',
            },
          });
        }

        console.log(
          `[calendar-reminder] Sent ${window.label} reminder for event ${event.id} to user ${event.assignedTo}`,
        );
      }
    } catch (err) {
      console.error(`[calendar-reminder] Error sending ${window.label} reminders:`, err);
    }
  }
}

/**
 * Start the reminder service
 * Runs every 5 minutes
 */
export function startReminderService() {
  console.log('[calendar-reminder] Starting calendar reminder service');

  // Run immediately on startup
  sendEventReminders().catch(console.error);

  // Then run every 5 minutes
  setInterval(
    () => {
      sendEventReminders().catch(console.error);
    },
    5 * 60 * 1000,
  );
}

// ============================================
// INTEGRATION INSTRUCTIONS:
// ============================================
//
// Add to your main server file (e.g., apps/api/src/index.ts):
//
// import { startReminderService } from './services/calendarReminders';
//
// // After your app.listen() call:
// startReminderService();
//
// ============================================
