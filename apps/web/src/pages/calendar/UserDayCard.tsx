// apps/web/src/pages/calendar/UserDayCard.tsx
// Card showing events/chores for a specific user

import { Check, Calendar, CheckSquare } from 'lucide-react';
import type { CalendarEvent, ChoreInstance } from '../../api';

interface CalendarUser {
  id: number;
  displayName: string;
  nickname: string | null;
  roleId: string;
  color: string | null;
}

interface UserDayCardProps {
  user: CalendarUser;
  events: CalendarEvent[];
  chores: ChoreInstance[];
  date: Date;
  isCurrentUser: boolean;
}

export function UserDayCard({
  user,
  events,
  chores,
  date,
  isCurrentUser,
}: UserDayCardProps) {
  // Filter events and chores for this specific user
  const userEvents = events.filter((e) => e.assignedTo === user.id);
  const userChores = chores.filter((c) => c.assignedTo === user.id);

  const totalItems = userEvents.length + userChores.length;

  if (totalItems === 0) {
    return (
      <div className={`themed-calendar-user p-4 ${isCurrentUser ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{
              backgroundColor: user.color || '#8b5cf6',
              fontSize: 'calc(var(--calendar-user-font-size, 0.875rem) * 0.9)',
              fontWeight: 'var(--calendar-user-font-weight, 500)',
            }}
          >
            {(user.nickname || user.displayName).charAt(0).toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--calendar-user-font-family, inherit)' }}>
            <p
              style={{
                fontWeight: 'var(--calendar-user-font-weight, 500)',
                fontSize: 'var(--calendar-user-font-size, inherit)',
                color: 'var(--calendar-user-text, var(--color-foreground))',
              }}
            >
              {user.nickname || user.displayName}
              {isCurrentUser && (
                <span
                  className="ml-1"
                  style={{
                    fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
                    color: 'var(--color-primary)',
                  }}
                >
                  (You)
                </span>
              )}
            </p>
            <p
              style={{
                fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
                fontWeight: 'var(--calendar-user-font-weight, 400)',
                color: 'var(--color-muted-foreground)',
              }}
            >
              {user.roleId}
            </p>
          </div>
        </div>
        <p
          className="text-center py-2"
          style={{
            fontSize: 'var(--calendar-user-font-size, 0.875rem)',
            fontWeight: 'var(--calendar-user-font-weight, 400)',
            color: 'var(--color-muted-foreground)',
          }}
        >
          No events or chores for today
        </p>
      </div>
    );
  }

  return (
    <div className={`themed-calendar-user p-4 ${isCurrentUser ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{
            backgroundColor: user.color || '#8b5cf6',
            fontSize: 'calc(var(--calendar-user-font-size, 0.875rem) * 0.9)',
            fontWeight: 'var(--calendar-user-font-weight, 500)',
          }}
        >
          {(user.nickname || user.displayName).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1" style={{ fontFamily: 'var(--calendar-user-font-family, inherit)' }}>
          <p
            style={{
              fontWeight: 'var(--calendar-user-font-weight, 500)',
              fontSize: 'var(--calendar-user-font-size, inherit)',
              color: 'var(--calendar-user-text, var(--color-foreground))',
            }}
          >
            {user.nickname || user.displayName}
            {isCurrentUser && (
              <span
                className="ml-1"
                style={{
                  fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
                  color: 'var(--color-primary)',
                }}
              >
                (You)
              </span>
            )}
          </p>
          <p
            style={{
              fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
              fontWeight: 'var(--calendar-user-font-weight, 400)',
              color: 'var(--color-muted-foreground)',
            }}
          >
            {user.roleId}
          </p>
        </div>
        <div className="text-right">
          <span
            style={{
              fontSize: 'var(--calendar-user-font-size, 0.875rem)',
              fontWeight: 'var(--calendar-user-font-weight, 500)',
              color: 'var(--calendar-user-text, var(--color-foreground))',
            }}
          >
            {totalItems}
          </span>
          <span
            className="ml-1"
            style={{
              fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
              color: 'var(--color-muted-foreground)',
            }}
          >
            items
          </span>
        </div>
      </div>

      <div
        className="space-y-2 max-h-32 overflow-y-auto"
        style={{ fontFamily: 'var(--calendar-user-font-family, inherit)' }}
      >
        {/* Events */}
        {userEvents.map((event) => (
          <div
            key={`event-${event.id}`}
            className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-muted)]/30"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                ...(event.holidayGradient
                  ? { background: event.holidayGradient }
                  : { backgroundColor: event.color || '#3b82f6' }),
              }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="truncate"
                style={{
                  fontSize: 'var(--calendar-user-font-size, 0.875rem)',
                  fontWeight: 'var(--calendar-user-font-weight, 400)',
                  color: 'var(--calendar-user-text, var(--color-foreground))',
                }}
              >
                {event.title}
              </p>
              {!event.allDay && (
                <p
                  style={{
                    fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  {new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
            <Calendar size={12} className="text-[var(--color-muted-foreground)]" />
          </div>
        ))}

        {/* Chores */}
        {userChores.map((chore) => {
          const isCompleted = chore.status === 'completed' || chore.status === 'approved';
          return (
            <div
              key={`chore-${chore.id}`}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                isCompleted ? 'bg-[var(--color-success)]/10' : 'bg-[var(--color-muted)]/30'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: chore.categoryColor || '#8b5cf6' }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="truncate"
                  style={{
                    fontSize: 'var(--calendar-user-font-size, 0.875rem)',
                    fontWeight: 'var(--calendar-user-font-weight, 400)',
                    color: isCompleted ? 'var(--color-muted-foreground)' : 'var(--calendar-user-text, var(--color-foreground))',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                  }}
                >
                  {chore.title}
                </p>
                <p
                  style={{
                    fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  {chore.points} pts
                </p>
              </div>
              {isCompleted ? (
                <Check size={12} className="text-[var(--color-success)]" />
              ) : (
                <CheckSquare size={12} className="text-[var(--color-muted-foreground)]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export the CalendarUser type for use by CalendarPage
export type { CalendarUser };
