// apps/api/src/routes/calendar/events.ts
// Calendar event routes with notifications

import type { Request, Response } from 'express';
import { q } from '../../db';
import { logAudit } from '../../audit';
import { createNotification } from '../messages';
import { getUser, success, notFound, serverError, validationError, created } from '../../utils';

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

    return success(res, { events });
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

    // FIXED: Always notify if there's an assignee (including self)
    if (assignedTo) {
      if (assignedTo === user.id) {
        // User created event for themselves - send confirmation/reminder
        await createNotification({
          userId: user.id,
          type: 'calendar',
          title: 'Event created',
          body: `"${title}" on ${eventDate}`,
          link: `/calendar?date=${start.split('T')[0]}`,
          relatedId: eventId,
          relatedType: 'calendar_event',
        });
      } else {
        // Event assigned to someone else
        await createNotification({
          userId: assignedTo,
          type: 'calendar',
          title: 'New event assigned to you',
          body: `"${title}" on ${eventDate}`,
          link: `/calendar?date=${start.split('T')[0]}`,
          relatedId: eventId,
          relatedType: 'calendar_event',
        });
      }
    }

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
