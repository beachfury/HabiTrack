// apps/api/src/routes/calendar/index.ts
// Calendar routes - central export

import { Request, Response, NextFunction } from 'express';

export { getEvents, getCalendarUsers, createEvent, updateEvent, deleteEvent } from './events';
export { getHolidaySettings, updateHolidaySettings, getHolidays } from './holidays';

export function addReminder(
  arg0: string,
  arg1: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void | Response<any, Record<string, any>>>,
  writeRateLimiter: any,
  addReminder: unknown,
) {
  throw new Error('Function not implemented.');
}

export function removeReminder(
  arg0: string,
  arg1: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void | Response<any, Record<string, any>>>,
  removeReminder: any,
) {
  throw new Error('Function not implemented.');
}
