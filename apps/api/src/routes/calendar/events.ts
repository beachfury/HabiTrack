// apps/api/src/routes/calendar/events.ts
// Calendar event routes with notifications

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import { getUser, success, notFound, serverError, validationError, created } from '../../utils';
import { queueEmail, getUserEmail } from '../../email/queue';
import { createLogger } from '../../services/logger';

const log = createLogger('calendar');

interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  color: string | null; // User's profile color (assigned user or creator)
  eventColor?: string | null; // Event's own color (optional override)
  location: string | null;
  createdBy: number;
  createdByName: string;
  assignedTo: number | null;
  assignedToName: string | null;
}

/**
 * Helper to format date for notification display
 * Extracts date part directly to avoid timezone issues
 */
function formatEventDate(dateStr: string): string {
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * GET /api/calendar/events
 * Get calendar events for a date range
 */
export async function getEvents(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { start, end } = req.query;

  if (!start || !end) {
    return validationError(res, 'start and end dates are required');
  }

  try {
    // Get regular calendar events
    const events = await q<CalendarEvent[]>(
      `SELECT
        e.id, e.title, e.description,
        e.startAt as start, e.endAt as end,
        e.allDay,
        COALESCE(au.color, cu.color) as color,
        e.color as eventColor,
        e.location, e.createdBy,
        cu.displayName as createdByName,
        e.assignedTo,
        au.displayName as assignedToName
       FROM calendar_events e
       LEFT JOIN users cu ON e.createdBy = cu.id
       LEFT JOIN users au ON e.assignedTo = au.id
       WHERE e.startAt <= ? AND (e.endAt >= ? OR e.endAt IS NULL)
       ORDER BY e.startAt`,
      [end, start],
    );

    // Get meal plans for the date range
    const mealPlans = await q<any[]>(
      `SELECT
        mp.id,
        DATE_FORMAT(mp.date, '%Y-%m-%d') as date,
        mp.recipeId,
        r.name as recipeName,
        mp.customMealName,
        mp.isFendForYourself,
        mp.ffyMessage,
        mp.status
      FROM meal_plans mp
      LEFT JOIN recipes r ON mp.recipeId = r.id
      WHERE mp.date >= ? AND mp.date <= ?`,
      [String(start).split('T')[0], String(end).split('T')[0]],
    );

    // Convert meal plans to calendar events format
    const mealEvents = mealPlans.map((mp) => {
      let title = '';
      if (mp.isFendForYourself) {
        title = '🍕 Fend For Yourself';
      } else if (mp.recipeName) {
        title = `🍽️ ${mp.recipeName}`;
      } else if (mp.customMealName) {
        title = `🍽️ ${mp.customMealName}`;
      } else {
        title = '🍽️ Dinner';
      }

      return {
        id: `meal-${mp.id}`, // Prefix to distinguish from regular events
        title,
        description: mp.status === 'voting' ? 'Voting in progress' : null,
        start: `${mp.date}T18:00:00`, // Default dinner time
        end: `${mp.date}T19:00:00`,
        allDay: false,
        color: '#f97316', // Orange color for meals
        eventColor: '#f97316',
        location: null,
        createdBy: null,
        createdByName: null,
        assignedTo: null,
        assignedToName: null,
        isMealPlan: true, // Flag to identify meal events
        mealPlanId: mp.id,
        mealStatus: mp.status,
      };
    });

    // Get birthday events — virtual events generated from users.dateOfBirth
    const birthdayUsers = await q<Array<{ id: number; displayName: string; dateOfBirth: string; color: string | null }>>(
      `SELECT id, displayName, dateOfBirth, color FROM users
       WHERE dateOfBirth IS NOT NULL AND active = 1 AND kioskOnly = 0`
    );

    const startDate = new Date(String(start).split('T')[0]);
    const endDate = new Date(String(end).split('T')[0]);

    const birthdayEvents = birthdayUsers.flatMap((u) => {
      const dob = new Date(u.dateOfBirth);
      const birthMonth = dob.getUTCMonth();
      const birthDay = dob.getUTCDate();
      const birthYear = dob.getUTCFullYear();
      const virtualEvents: any[] = [];

      for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
        const birthdayDate = new Date(year, birthMonth, birthDay);
        if (birthdayDate >= startDate && birthdayDate <= endDate) {
          const dateStr = birthdayDate.toISOString().split('T')[0];
          const age = year - birthYear;
          virtualEvents.push({
            id: `birthday-${u.id}-${year}`,
            title: `🎂 ${u.displayName}'s Birthday${age > 0 ? ` (${age})` : ''}`,
            description: null,
            start: `${dateStr}T00:00:00`,
            end: `${dateStr}T23:59:59`,
            allDay: true,
            color: u.color || '#ec4899',
            eventColor: '#ec4899',
            location: null,
            createdBy: null,
            createdByName: null,
            assignedTo: null,
            assignedToName: null,
            isBirthday: true,
          });
        }
      }
      return virtualEvents;
    });

    // Country flag gradient colors for holiday event bars
    // Each entry is an array of CSS colors representing the country's flag
    const COUNTRY_GRADIENT: Record<string, string[]> = {
      US: ['#B22234', '#FFFFFF', '#3C3B6E'],   // Red, White, Blue
      PR: ['#E42131', '#FFFFFF', '#0050F0'],   // Red, White, Blue
      CA: ['#FF0000', '#FFFFFF', '#FF0000'],   // Red, White, Red
      GB: ['#012169', '#CF142B', '#FFFFFF'],   // Blue, Red, White
      DE: ['#000000', '#DD0000', '#FFCC00'],   // Black, Red, Gold
      FR: ['#002395', '#FFFFFF', '#ED2939'],   // Blue, White, Red
      AU: ['#00008B', '#FFFFFF', '#FF0000'],   // Blue, White, Red
      NZ: ['#00247D', '#CC142B'],              // Blue, Red
      MX: ['#006847', '#FFFFFF', '#CE1126'],   // Green, White, Red
      BR: ['#009739', '#FEDD00', '#002776'],   // Green, Gold, Blue
      JP: ['#BC002D', '#FFFFFF', '#BC002D'],   // Red, White, Red
      KR: ['#003478', '#CD2E3A', '#FFFFFF'],   // Blue, Red, White
      IN: ['#FF9933', '#FFFFFF', '#138808'],   // Saffron, White, Green
      IT: ['#009246', '#FFFFFF', '#CE2B37'],   // Green, White, Red
      ES: ['#AA151B', '#F1BF00', '#AA151B'],   // Red, Yellow, Red
      NL: ['#AE1C28', '#FFFFFF', '#21468B'],   // Red, White, Blue
      BE: ['#000000', '#FAE042', '#ED2939'],   // Black, Yellow, Red
      SE: ['#006AA7', '#FECC00'],              // Blue, Yellow
      NO: ['#BA0C2F', '#FFFFFF', '#00205B'],   // Red, White, Blue
      DK: ['#C60C30', '#FFFFFF', '#C60C30'],   // Red, White, Red
      FI: ['#FFFFFF', '#003580', '#FFFFFF'],   // White, Blue, White
      AT: ['#ED2939', '#FFFFFF', '#ED2939'],   // Red, White, Red
      CH: ['#FF0000', '#FFFFFF', '#FF0000'],   // Red, White, Red
      IE: ['#169B62', '#FFFFFF', '#FF883E'],   // Green, White, Orange
      PL: ['#FFFFFF', '#DC143C'],              // White, Red
      CZ: ['#FFFFFF', '#11457E', '#D7141A'],   // White, Blue, Red
      PT: ['#006600', '#FF0000'],              // Green, Red
      ZA: ['#007749', '#FFB81C', '#000000', '#DE3831', '#002395'], // Green, Gold, Black, Red, Blue
      NG: ['#008751', '#FFFFFF', '#008751'],   // Green, White, Green
      PH: ['#0038A8', '#CE1126', '#FCD116'],   // Blue, Red, Yellow
      SG: ['#ED2939', '#FFFFFF'],              // Red, White
    };

    // Get holiday events if countries are configured
    let holidayEvents: any[] = [];
    try {
      const [settings] = await q<Array<{ holidayCountries: string | null }>>(
        `SELECT holidayCountries FROM settings WHERE id = 1`
      );

      if (settings?.holidayCountries) {
        const countries: string[] = typeof settings.holidayCountries === 'string'
          ? JSON.parse(settings.holidayCountries)
          : settings.holidayCountries;

        if (countries.length > 0) {
          const { getCachedHolidays } = await import('./holidays');
          const holidays = await getCachedHolidays(countries, startDate.getFullYear(), endDate.getFullYear());

          // Helper to format date as YYYY-MM-DD
          const fmtDate = (d: Date) => d.toISOString().split('T')[0];

          // Helper to add days to a date
          const addDays = (d: Date, n: number) => {
            const r = new Date(d);
            r.setDate(r.getDate() + n);
            return r;
          };

          holidayEvents = holidays
            .filter((h) => {
              const hDate = new Date(h.date + 'T12:00:00');
              // Extend filter window by 2 days to catch weekend-extended holidays
              const extStart = addDays(startDate, -2);
              const extEnd = addDays(endDate, 2);
              return hDate >= extStart && hDate <= extEnd;
            })
            .map((h) => {
              const gradientColors = COUNTRY_GRADIENT[h.countryCode];
              const gradient = gradientColors
                ? `linear-gradient(to right, ${gradientColors.join(', ')})`
                : null;
              // Use the first non-white color as fallback solid color
              const fallbackColor = gradientColors
                ? (gradientColors.find((c) => c !== '#FFFFFF') || '#fbbf24')
                : '#fbbf24';

              // Extend holidays that land on Fri or Mon to cover the long weekend
              const hDate = new Date(h.date + 'T12:00:00');
              const dayOfWeek = hDate.getDay(); // 0=Sun, 1=Mon, 5=Fri, 6=Sat
              let eventStart = h.date;
              let eventEnd = h.date;

              if (dayOfWeek === 5) {
                // Friday observed → extend through Sunday (Fri-Sun)
                eventEnd = fmtDate(addDays(hDate, 2));
              } else if (dayOfWeek === 1) {
                // Monday observed → extend from Saturday (Sat-Mon)
                eventStart = fmtDate(addDays(hDate, -2));
              }

              return {
                id: `holiday-${h.countryCode}-${h.date}`,
                title: h.localName || h.name,
                description: `National holiday (${h.countryCode})`,
                start: `${eventStart}T00:00:00`,
                end: `${eventEnd}T23:59:59`,
                allDay: true,
                color: fallbackColor,
                eventColor: fallbackColor,
                holidayGradient: gradient,
                location: null,
                createdBy: null,
                createdByName: null,
                assignedTo: null,
                assignedToName: null,
                isHoliday: true,
                countryCode: h.countryCode,
              };
            });
        }
      }
    } catch (holidayErr) {
      log.warn('Failed to fetch holiday events', { error: String(holidayErr) });
    }

    // Combine and sort by start time
    const allEvents = [...events, ...mealEvents, ...birthdayEvents, ...holidayEvents].sort((a, b) => {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });

    return success(res, { events: allEvents });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * GET /api/calendar/users
 * Get users for calendar assignment dropdown
 */
export async function getCalendarUsers(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  try {
    const users = await q<
      Array<{
        id: number;
        displayName: string;
        nickname: string | null;
        roleId: string;
        color: string | null;
      }>
    >(
      `SELECT id, displayName, nickname, roleId, color
       FROM users
       WHERE active = 1 AND kioskOnly = 0
       ORDER BY displayName`,
    );

    return success(res, { users });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * POST /api/calendar/events
 * Create a new calendar event
 */
export async function createEvent(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const { title, description, start, end, allDay, color, location, assignedTo } = req.body;

  if (!title || !start) {
    return validationError(res, 'title and start are required');
  }

  try {
    const result: any = await q(
      `INSERT INTO calendar_events (title, description, startAt, endAt, allDay, color, location, createdBy, assignedTo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        start,
        end || null,
        allDay || false,
        color || null,
        location || null,
        user.id,
        assignedTo || null,
      ],
    );

    const eventId = result.insertId;
    const eventDate = formatEventDate(start);

    // Get creator's display name for email
    const [creatorInfo] = await q<Array<{ displayName: string; email: string | null }>>(
      'SELECT displayName, email FROM users WHERE id = ?',
      [user.id],
    );
    const creatorName = creatorInfo?.displayName || 'Someone';
    const creatorEmail = creatorInfo?.email;

    // Format event time for email
    const eventTime = allDay
      ? `${eventDate} (All day)`
      : `${eventDate} at ${new Date(start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

    // Send notifications based on assignment
    if (assignedTo && assignedTo !== user.id) {
      // Event assigned to someone else - notify them
      await createNotification({
        userId: assignedTo,
        type: 'calendar',
        title: 'New event assigned to you',
        body: `"${title}" on ${eventDate}`,
        link: `/calendar?date=${start.split('T')[0]}`,
        relatedId: eventId,
        relatedType: 'calendar_event',
      });

      // Queue email for the assignee
      const assigneeEmail = await getUserEmail(assignedTo);
      if (assigneeEmail) {
        await queueEmail({
          userId: assignedTo,
          toEmail: assigneeEmail,
          template: 'EVENT_CREATED',
          variables: {
            eventName: title,
            eventTime,
            createdBy: creatorName,
            location: location || '',
          },
        });
      }
    }

    // ALWAYS send email to the creator when they create an event (confirmation)
    console.log(`[calendar] Creator email: ${creatorEmail || 'NOT SET'}`);
    if (creatorEmail) {
      const emailResult = await queueEmail({
        userId: user.id,
        toEmail: creatorEmail,
        template: 'EVENT_CREATED',
        variables: {
          eventName: title,
          eventTime,
          createdBy: 'You',
          location: location || '',
        },
      });
      console.log(`[calendar] Email queue result:`, emailResult);
    } else {
      console.log(`[calendar] Skipping email - no email address for user ${user.id}`);
    }

    // Create in-app notification for creator
    await createNotification({
      userId: user.id,
      type: 'calendar',
      title: 'Event created',
      body: `"${title}" on ${eventDate}`,
      link: `/calendar?date=${start.split('T')[0]}`,
      relatedId: eventId,
      relatedType: 'calendar_event',
    });

    log.info('Calendar event created', { eventId, title, createdBy: user.id });

    await logAudit({
      action: 'calendar.create',
      result: 'ok',
      actorId: user.id,
      details: { eventId, title, assignedTo },
    });

    return created(res, {
      event: { id: eventId, title, start, end, allDay, color, location, assignedTo },
    });
  } catch (err) {
    log.error('Failed to create calendar event', { error: String(err) });
    return serverError(res, err as Error);
  }
}

/**
 * PUT /api/calendar/events/:id
 * Update a calendar event
 */
export async function updateEvent(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const eventId = parseInt(req.params.id);
  const { title, description, start, end, allDay, color, location, assignedTo } = req.body;

  try {
    // Get existing event
    const [existingEvent] = await q<Array<{ assignedTo: number | null; title: string }>>(
      `SELECT assignedTo, title FROM calendar_events WHERE id = ?`,
      [eventId],
    );

    if (!existingEvent) {
      return notFound(res, 'Event not found');
    }

    await q(
      `UPDATE calendar_events
       SET title = ?, description = ?, startAt = ?, endAt = ?, allDay = ?, color = ?, location = ?, assignedTo = ?
       WHERE id = ?`,
      [
        title,
        description || null,
        start,
        end || null,
        allDay || false,
        color || null,
        location || null,
        assignedTo || null,
        eventId,
      ],
    );

    // If assignee changed to someone new (not self), notify them
    if (assignedTo && assignedTo !== existingEvent.assignedTo && assignedTo !== user.id) {
      const eventDate = formatEventDate(start);
      await createNotification({
        userId: assignedTo,
        type: 'calendar',
        title: 'Event assigned to you',
        body: `"${title}" on ${eventDate}`,
        link: `/calendar?date=${start.split('T')[0]}`,
        relatedId: eventId,
        relatedType: 'calendar_event',
      });

      // Send email notification for event reassignment
      const assigneeEmail = await getUserEmail(assignedTo);
      if (assigneeEmail) {
        const [assigneeInfo] = await q<Array<{ displayName: string }>>(
          'SELECT displayName FROM users WHERE id = ?',
          [assignedTo],
        );
        await queueEmail({
          userId: assignedTo,
          toEmail: assigneeEmail,
          template: 'EVENT_UPDATED',
          variables: {
            userName: assigneeInfo?.displayName || 'there',
            eventName: title,
            message: 'This event has been assigned to you.',
            eventTime: eventDate,
          },
        });
      }
    }

    await logAudit({
      action: 'calendar.update',
      result: 'ok',
      actorId: user.id,
      details: {
        eventId,
        title,
        previousAssignee: existingEvent.assignedTo,
        newAssignee: assignedTo,
      },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}

/**
 * DELETE /api/calendar/events/:id
 * Delete a calendar event
 */
export async function deleteEvent(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });

  const eventId = parseInt(req.params.id);

  try {
    const [event] = await q<Array<{ title: string; assignedTo: number | null }>>(
      `SELECT title, assignedTo FROM calendar_events WHERE id = ?`,
      [eventId],
    );

    if (!event) {
      return notFound(res, 'Event not found');
    }

    await q(`DELETE FROM calendar_events WHERE id = ?`, [eventId]);

    // Notify assigned user that event was deleted (if not self)
    if (event.assignedTo && event.assignedTo !== user.id) {
      await createNotification({
        userId: event.assignedTo,
        type: 'calendar',
        title: 'Event cancelled',
        body: `"${event.title}" has been cancelled`,
        link: '/calendar',
      });

      // Send email notification for event cancellation
      const assigneeEmail = await getUserEmail(event.assignedTo);
      if (assigneeEmail) {
        const [assigneeInfo] = await q<Array<{ displayName: string }>>(
          'SELECT displayName FROM users WHERE id = ?',
          [event.assignedTo],
        );
        await queueEmail({
          userId: event.assignedTo,
          toEmail: assigneeEmail,
          template: 'EVENT_CANCELLED',
          variables: {
            userName: assigneeInfo?.displayName || 'there',
            eventName: event.title,
            eventTime: 'N/A',
          },
        });
      }
    }

    await logAudit({
      action: 'calendar.delete',
      result: 'ok',
      actorId: user.id,
      details: { eventId, title: event.title },
    });

    return success(res, { success: true });
  } catch (err) {
    return serverError(res, err as Error);
  }
}
