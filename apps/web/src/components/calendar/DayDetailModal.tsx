// apps/web/src/components/calendar/DayDetailModal.tsx
import { Plus, Clock, MapPin, Check, SkipForward, Calendar } from 'lucide-react';
import type { CalendarEvent, ChoreInstance } from '../../types';
import { ModalPortal, ModalBody } from '../common/ModalPortal';

interface DayDetailModalProps {
  date: Date;
  events: CalendarEvent[];
  chores: ChoreInstance[];
  showChores: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onCompleteChore: (chore: ChoreInstance) => void;
  onSkipChore: (chore: ChoreInstance) => void;
}

export function DayDetailModal({
  date,
  events,
  chores,
  showChores,
  isAdmin,
  onClose,
  onAddEvent,
  onEditEvent,
  onCompleteChore,
  onSkipChore,
}: DayDetailModalProps) {
  const formatFullDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={formatFullDate(date)}
      size="md"
    >
      <ModalBody>
        <div className="space-y-4">
          {/* Add Event Button */}
          <button
            onClick={onAddEvent}
            className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Event
          </button>

          {/* Events */}
          {events.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Calendar size={14} />
                Events
              </h3>
              <div className="space-y-2">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEditEvent(event)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: event.color || '#3b82f6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {event.title}
                        </p>
                        {!event.allDay && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock size={12} />
                            {formatTime(event.start)}
                            {event.end && ` - ${formatTime(event.end)}`}
                          </p>
                        )}
                        {event.allDay && (
                          <p className="text-sm text-gray-500">All day</p>
                        )}
                        {event.location && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chores */}
          {showChores && chores.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Chores
              </h3>
              <div className="space-y-2">
                {chores.map((chore) => (
                  <div
                    key={chore.id}
                    className={`p-3 rounded-xl ${
                      chore.status === 'approved'
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : chore.status === 'completed'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20'
                          : 'bg-purple-50 dark:bg-purple-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            chore.status === 'approved'
                              ? 'text-green-700 dark:text-green-300 line-through'
                              : chore.status === 'completed'
                                ? 'text-yellow-700 dark:text-yellow-300'
                                : 'text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {chore.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {chore.points} pts • {chore.assignedToName || 'Unassigned'}
                        </p>
                      </div>

                      {chore.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => onCompleteChore(chore)}
                            className="p-2 bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 rounded-lg hover:bg-green-200"
                            title="Complete"
                          >
                            <Check size={16} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => onSkipChore(chore)}
                              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200"
                              title="Skip"
                            >
                              <SkipForward size={16} />
                            </button>
                          )}
                        </div>
                      )}

                      {chore.status === 'completed' && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                          Awaiting approval
                        </span>
                      )}

                      {chore.status === 'approved' && (
                        <Check size={18} className="text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {events.length === 0 && (!showChores || chores.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={48} className="mx-auto mb-3 opacity-30" />
              <p>No events for this day</p>
            </div>
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
