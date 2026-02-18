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
            className="w-full p-3 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Event
          </button>

          {/* Events */}
          {events.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2 flex items-center gap-2">
                <Calendar size={14} />
                Events
              </h3>
              <div className="space-y-2">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEditEvent(event)}
                    className="w-full p-3 bg-[var(--color-muted)] rounded-xl text-left hover:opacity-80 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: event.color || 'var(--color-primary)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--color-foreground)] truncate">
                          {event.title}
                        </p>
                        {!event.allDay && (
                          <p className="text-sm text-[var(--color-muted-foreground)] flex items-center gap-1 mt-0.5">
                            <Clock size={12} />
                            {formatTime(event.start)}
                            {event.end && ` - ${formatTime(event.end)}`}
                          </p>
                        )}
                        {event.allDay && (
                          <p className="text-sm text-[var(--color-muted-foreground)]">All day</p>
                        )}
                        {event.location && (
                          <p className="text-sm text-[var(--color-muted-foreground)] flex items-center gap-1 mt-0.5">
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
              <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2">
                Chores
              </h3>
              <div className="space-y-2">
                {chores.map((chore) => (
                  <div
                    key={chore.id}
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: chore.status === 'approved'
                        ? 'color-mix(in srgb, var(--color-success) 10%, transparent)'
                        : chore.status === 'completed'
                          ? 'color-mix(in srgb, var(--color-warning) 10%, transparent)'
                          : 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${chore.status === 'approved' ? 'line-through' : ''}`}
                          style={{
                            color: chore.status === 'approved'
                              ? 'var(--color-success)'
                              : chore.status === 'completed'
                                ? 'var(--color-warning)'
                                : 'var(--color-primary)',
                          }}
                        >
                          {chore.title}
                        </p>
                        <p className="text-sm text-[var(--color-muted-foreground)]">
                          {chore.points} pts • {chore.assignedToName || 'Unassigned'}
                        </p>
                      </div>

                      {chore.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => onCompleteChore(chore)}
                            className="p-2 bg-[var(--color-success)]/20 text-[var(--color-success)] rounded-lg hover:bg-[var(--color-success)]/30"
                            title="Complete"
                          >
                            <Check size={16} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => onSkipChore(chore)}
                              className="p-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-lg hover:opacity-80"
                              title="Skip"
                            >
                              <SkipForward size={16} />
                            </button>
                          )}
                        </div>
                      )}

                      {chore.status === 'completed' && (
                        <span className="text-xs text-[var(--color-warning)] font-medium">
                          Awaiting approval
                        </span>
                      )}

                      {chore.status === 'approved' && (
                        <Check size={18} className="text-[var(--color-success)]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {events.length === 0 && (!showChores || chores.length === 0) && (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">
              <Calendar size={48} className="mx-auto mb-3 opacity-30" />
              <p>No events for this day</p>
            </div>
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
