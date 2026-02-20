// apps/web/src/components/dashboard/widgets/TodaysEventsWidget.tsx
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WidgetEvent } from './types';

interface TodaysEventsWidgetProps {
  events: WidgetEvent[];
}

export function TodaysEventsWidget({ events = [] }: TodaysEventsWidgetProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Format today's date for header
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
            <Calendar size={18} className="text-[var(--color-primary)]" />
            Today's Events
          </h3>
          <p className="text-xs text-[var(--color-muted-foreground)]">{todayFormatted}</p>
        </div>
        <Link to="/calendar" className="text-sm text-[var(--color-primary)] hover:opacity-80">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            No events today
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="themed-widget flex items-center gap-3"
            >
              <div
                className="w-1 h-8 rounded-full"
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
                  {event.allDay ? 'All day' : formatTime(event.startTime)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
