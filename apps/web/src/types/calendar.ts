// apps/web/src/types/calendar.ts
// Calendar and event related types

export interface CalendarEvent {
  id: number | string; // Can be number for regular events or "meal-123" for meal plans
  title: string;
  description: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  color: string | null;
  eventColor?: string | null;
  location: string | null;
  createdBy: number | null;
  createdByName?: string | null;
  assignedTo: number | null;
  assignedToName?: string | null;
  // Meal plan specific fields
  isMealPlan?: boolean;
  mealPlanId?: number;
  mealStatus?: 'planned' | 'voting' | 'finalized';
  // Birthday specific fields
  isBirthday?: boolean;
  // Holiday specific fields
  isHoliday?: boolean;
  countryCode?: string;
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
