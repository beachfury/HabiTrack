// apps/web/src/types/calendar.ts
// Calendar and event related types

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  color: string | null;
  eventColor?: string | null;
  location: string | null;
  createdBy: number;
  createdByName?: string;
  assignedTo: number | null;
  assignedToName?: string | null;
}

export interface CreateEventData {
  title: string;
  description?: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  location?: string;
  assignedTo?: number;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id?: number;
}
