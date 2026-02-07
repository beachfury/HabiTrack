// apps/web/src/components/dashboard/widgets/TodaysEventsWidget.tsx
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Event {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  allDay: boolean;
}

interface TodaysEventsWidgetProps {
  events: Event[];
}

export function TodaysEventsWidget({ events = [] }: TodaysEventsWidgetProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar size={18} className="text-blue-500" />
          Today's Events
        </h3>
        <Link to="/calendar" className="text-sm text-blue-500 hover:text-blue-600">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No events today
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div
                className="w-1 h-8 rounded-full"
                style={{ backgroundColor: event.color || '#8b5cf6' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {event.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
