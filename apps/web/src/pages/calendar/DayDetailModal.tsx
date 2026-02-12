// apps/web/src/pages/calendar/DayDetailModal.tsx
// Modal showing day details with events and chores

import {
  Plus,
  Check,
  SkipForward,
  Calendar,
  Clock,
  MapPin,
  CheckSquare,
} from 'lucide-react';
import type { CalendarEvent, ChoreInstance } from '../../api';
import { ModalPortal, ModalBody } from '../../components/common/ModalPortal';

interface DayDetailModalProps {
  date: Date;
  events: CalendarEvent[];
  chores: ChoreInstance[];
  onClose: () => void;
  onNewEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onCompleteChore: (chore: ChoreInstance) => void;
  onSkipChore: (chore: ChoreInstance) => void;
  formatTime: (dateStr: string) => string;
  formatFullDate: (date: Date) => string;
}

export function DayDetailModal({
  date,
  events,
  chores,
  onClose,
  onNewEvent,
  onEditEvent,
  onCompleteChore,
  onSkipChore,
  formatTime,
  formatFullDate,
}: DayDetailModalProps) {
  const isTodayDate = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={isTodayDate(date) ? 'Today' : formatFullDate(date)}
      size="lg"
      className="themed-card"
      footer={
        <button
          onClick={onClose}
          className="w-full themed-btn-secondary"
        >
          Close
        </button>
      }
    >
      <ModalBody className="space-y-4">
        {/* Events Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-[var(--color-foreground)] flex items-center gap-2">
              <Calendar size={16} />
              Events ({events.length})
            </h3>
            <button
              onClick={onNewEvent}
              className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 font-medium flex items-center gap-1"
            >
              <Plus size={14} />
              Add Event
            </button>
          </div>

          {events.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)] py-4 text-center">
              No events scheduled
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEditEvent(event)}
                  className="p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-border)]/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: event.color || '#3b82f6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-foreground)]">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-muted-foreground)]">
                        {!event.allDay && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(event.start)}
                            {event.end && ` - ${formatTime(event.end)}`}
                          </span>
                        )}
                        {event.allDay && <span>All day</span>}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {event.location}
                          </span>
                        )}
                      </div>
                      {event.assignedToName && (
                        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                          Assigned to: {event.assignedToName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chores Section */}
        {chores.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[var(--color-foreground)] flex items-center gap-2 mb-2">
              <CheckSquare size={16} />
              Chores ({chores.length})
            </h3>
            <div className="space-y-2">
              {chores.map((chore) => {
                const isCompleted = chore.status === 'completed' || chore.status === 'approved';
                const isPending = chore.status === 'pending';

                return (
                  <div
                    key={chore.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      isCompleted
                        ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: chore.categoryColor || '#8b5cf6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${isCompleted ? 'text-[var(--color-muted-foreground)] line-through' : 'text-[var(--color-foreground)]'}`}
                        >
                          {chore.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-[var(--color-muted-foreground)]">
                          <span>{chore.points} pts</span>
                          {chore.assignedToName && <span>• {chore.assignedToName}</span>}
                        </div>
                      </div>

                      {isPending && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => onCompleteChore(chore)}
                            className="p-2 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-lg hover:bg-[var(--color-success)]/20 transition-colors"
                            title="Complete"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => onSkipChore(chore)}
                            className="p-2 bg-[var(--color-warning)]/10 text-[var(--color-warning)] rounded-lg hover:bg-[var(--color-warning)]/20 transition-colors"
                            title="Skip"
                          >
                            <SkipForward size={16} />
                          </button>
                        </div>
                      )}

                      {isCompleted && (
                        <span className="text-[var(--color-success)] text-sm font-medium">
                          ✓ Done
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ModalBody>
    </ModalPortal>
  );
}
