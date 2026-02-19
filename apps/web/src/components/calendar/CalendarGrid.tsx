// apps/web/src/components/calendar/CalendarGrid.tsx
import { Plus } from 'lucide-react';
import { DAYS } from './constants';
import type { CalendarEvent, ChoreInstance } from '../../types';

interface CalendarGridProps {
  days: (Date | null)[];
  month: number;
  events: CalendarEvent[];
  chores: ChoreInstance[];
  showChores: boolean;
  onDayClick: (date: Date) => void;
  onAddEvent: (date: Date) => void;
  getEventsForDay: (date: Date) => CalendarEvent[];
  getChoresForDay: (date: Date) => ChoreInstance[];
  isToday: (date: Date) => boolean;
  isCurrentMonth: (date: Date) => boolean;
  isEventStart: (event: CalendarEvent, date: Date) => boolean;
  isEventEnd: (event: CalendarEvent, date: Date) => boolean;
  isMultiDayEvent: (event: CalendarEvent) => boolean;
}

export function CalendarGrid({
  days,
  month,
  events,
  chores,
  showChores,
  onDayClick,
  onAddEvent,
  getEventsForDay,
  getChoresForDay,
  isToday,
  isCurrentMonth,
  isEventStart,
  isEventEnd,
  isMultiDayEvent,
}: CalendarGridProps) {
  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {DAYS.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {days.map((date, index) => {
          if (!date) return <div key={index} />;

          const dayEvents = getEventsForDay(date);
          const dayChores = showChores ? getChoresForDay(date) : [];
          const today = isToday(date);
          const currentMonth = isCurrentMonth(date);

          return (
            <div
              key={index}
              className={`min-h-[100px] border-b border-r border-gray-100 dark:border-gray-700 p-1 ${
                !currentMonth ? 'bg-gray-50 dark:bg-gray-900/50' : ''
              }`}
            >
              {/* Date Header */}
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={() => onDayClick(date)}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    today
                      ? 'bg-blue-600 text-white'
                      : currentMonth
                        ? 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {date.getDate()}
                </button>
                <button
                  onClick={() => onAddEvent(date)}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Events */}
              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => {
                  const multiDay = isMultiDayEvent(event);
                  const isStart = isEventStart(event, date);
                  const isEnd = isEventEnd(event, date);

                  return (
                    <div
                      key={event.id}
                      onClick={() => onDayClick(date)}
                      className={`px-1.5 py-0.5 text-xs text-white truncate cursor-pointer ${
                        multiDay
                          ? `${isStart ? 'rounded-l' : ''} ${isEnd ? 'rounded-r' : ''}`
                          : 'rounded'
                      }`}
                      style={{ backgroundColor: event.color || '#3b82f6' }}
                      title={event.title}
                    >
                      {(isStart || !multiDay) && event.title}
                    </div>
                  );
                })}

                {/* Chores */}
                {dayChores.slice(0, 2).map((chore) => {
                  const choreColor = chore.categoryColor || '#8b5cf6';
                  const isCompleted = chore.status === 'completed' || chore.status === 'approved';
                  return (
                    <div
                      key={`chore-${chore.id}`}
                      onClick={() => onDayClick(date)}
                      className={`px-1.5 py-0.5 text-xs rounded truncate cursor-pointer border-l-2 ${
                        isCompleted ? 'line-through opacity-60' : ''
                      }`}
                      style={{
                        backgroundColor: `${choreColor}1A`,
                        color: choreColor,
                        borderLeftColor: choreColor,
                      }}
                      title={chore.title}
                    >
                      {chore.title}
                    </div>
                  );
                })}

                {/* More indicator */}
                {dayEvents.length + dayChores.length > 4 && (
                  <button
                    onClick={() => onDayClick(date)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-1"
                  >
                    +{dayEvents.length + dayChores.length - 4} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
