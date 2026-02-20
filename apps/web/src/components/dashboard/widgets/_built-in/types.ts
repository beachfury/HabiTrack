// _built-in/types.ts
// Shared type definitions used by multiple built-in widgets

/** Calendar event used by TodaysEventsWidget and UpcomingEventsWidget */
export interface WidgetEvent {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  allDay: boolean;
  holidayGradient?: string | null;
}

/** Chore assignment used by TodaysChoresWidget (includes assignee info) */
export interface WidgetChoreAssignment {
  id: number;
  choreId: number;
  title: string;
  status: string;
  dueDate: string;
  completedAt: string | null;
  assigneeName: string;
  assigneeColor: string;
}

/** Personal chore used by MyChoresWidget (no assignee info) */
export interface WidgetMyChore {
  id: number;
  choreId: number;
  title: string;
  status: string;
  dueDate: string;
  completedAt: string | null;
}
