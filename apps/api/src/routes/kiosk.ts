// apps/api/src/routes/kiosk.ts
// Kiosk board API — aggregated daily data for all family members

import { Request, Response } from 'express';
import { q } from '../db';
import { getUser } from '../utils/auth';

async function safeQuery<T>(query: string, params?: any[]): Promise<T[]> {
  try {
    return await q<T[]>(query, params);
  } catch (err) {
    console.warn('Kiosk board query failed:', (err as Error).message);
    return [];
  }
}

export async function getKioskBoard(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: { code: 'AUTH_REQUIRED' } });
    }

    const [members, chores, paidChores, events] = await Promise.all([
      // All active family members (exclude kiosk-only accounts)
      safeQuery<any>(`
        SELECT id, displayName, nickname, color, avatarUrl, roleId
        FROM users
        WHERE active = 1 AND roleId != 'kiosk'
        ORDER BY
          CASE roleId WHEN 'admin' THEN 1 WHEN 'member' THEN 2 WHEN 'kid' THEN 3 ELSE 4 END,
          displayName
      `),

      // All chore instances due today
      safeQuery<any>(`
        SELECT ci.id, ci.choreId, c.title, ci.status, c.dueTime,
               ci.completedAt, c.points, c.requireApproval,
               cat.color as categoryColor, ci.assignedTo
        FROM chore_instances ci
        JOIN chores c ON ci.choreId = c.id
        LEFT JOIN chore_categories cat ON c.categoryId = cat.id
        WHERE DATE(ci.dueDate) = CURDATE()
        ORDER BY ci.status ASC, c.title ASC
      `),

      // Claimed/completed paid chores
      safeQuery<any>(`
        SELECT id, title, amount, difficulty, status, claimedBy, completedAt
        FROM paid_chores
        WHERE status IN ('claimed', 'completed')
          AND claimedBy IS NOT NULL
        ORDER BY title ASC
      `),

      // Today's calendar events
      safeQuery<any>(`
        SELECT id, title, startAt as startTime, endAt as endTime, color, allDay, assignedTo
        FROM calendar_events
        WHERE (DATE(startAt) = CURDATE())
           OR (DATE(startAt) <= CURDATE() AND DATE(endAt) >= CURDATE())
        ORDER BY startAt ASC
      `),
    ]);

    // Group items by member
    const memberMap = members.map((m: any) => ({
      id: m.id,
      displayName: m.displayName,
      nickname: m.nickname,
      color: m.color,
      avatarUrl: m.avatarUrl,
      roleId: m.roleId,
      chores: chores
        .filter((c: any) => c.assignedTo === m.id)
        .map((c: any) => ({
          id: c.id,
          choreId: c.choreId,
          title: c.title,
          status: c.status,
          dueTime: c.dueTime,
          completedAt: c.completedAt,
          points: c.points,
          requireApproval: !!c.requireApproval,
          categoryColor: c.categoryColor,
        })),
      paidChores: paidChores
        .filter((p: any) => p.claimedBy === m.id)
        .map((p: any) => ({
          id: p.id,
          title: p.title,
          amount: Number(p.amount),
          status: p.status,
          completedAt: p.completedAt,
        })),
      events: events
        .filter((e: any) => e.assignedTo === m.id || e.assignedTo === null)
        .map((e: any) => ({
          id: e.id,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
          color: e.color,
          allDay: !!e.allDay,
        })),
    }));

    const today = new Date().toISOString().split('T')[0];
    res.json({ members: memberMap, date: today });
  } catch (err) {
    console.error('Kiosk board error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
}
