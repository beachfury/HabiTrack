// apps/web/src/components/dashboard/widgets/UpcomingEventsWidget.tsx
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WidgetEvent } from './types';

interface UpcomingEventsWidgetProps {
  events: WidgetEvent[];
  daysAhead?: number;
  showAllDay?: boolean;
}

export function UpcomingEventsWidget({ events = [], daysAhead = 7, showAllDay = true }: UpcomingEventsWidgetProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Get today's date formatted
  const today = new Date();
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // Calculate the end of the lookahead window
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + daysAhead);
  windowEnd.setHours(23, 59, 59, 999);

  // Filter: only events from tomorrow through the configured window
  const upcomingEvents = events.filter((event) => {
    const eventDate = new Date(event.startTime);
    // Must be after today
    if (eventDate <= todayEnd) return false;
    // Must be within the lookahead window
    if (eventDate > windowEnd) return false;
    // Optionally filter out all-day events
    if (!showAllDay && event.allDay) return false;
    return true;
  });

  // Format header date range using the configured days ahead
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);
  const headerDate = `${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
            <Calendar size={18} className="text-[var(--color-primary)]" />
            Upcoming Events
          </h3>
          <p className="text-xs text-[var(--color-muted-foreground)]">{headerDate}</p>
        </div>
        <Link to="/calendar" className="text-sm text-[var(--color-primary)] hover:opacity-80">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            No upcoming events in the next {daysAhead} day{daysAhead !== 1 ? 's' : ''}
          </p>
        ) : (
          upcomingEvents.map((event) => (
            <div key={event.id} className="themed-widget flex items-center gap-3">
              <div
                className="w-1 h-10 rounded-full"
                style={{
                  ...(event.holidayGradient
                    ? { background: event.holidayGradient }
                    : { backgroundColor: event.color || 'var(--color-primary)' }),
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                  {event.title}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {formatDate(event.startTime)}
                  {!event.allDay && ` • ${formatTime(event.startTime)}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
