// apps/web/src/components/kiosk/MemberCard.tsx
// Family member card for the kiosk welcome page

import { Check, Clock, CircleDot, DollarSign, Calendar, Crown } from 'lucide-react';
import type { KioskBoardMember, KioskChoreItem, KioskEventItem } from '../../api/kiosk';

interface MemberCardProps {
  member: KioskBoardMember;
  isLeader: boolean;
  startDate: string;
  onAvatarTap: (member: KioskBoardMember) => void;
  onChoreComplete: (member: KioskBoardMember, choreInstanceId: number) => void;
  onPaidChoreComplete: (member: KioskBoardMember, paidChoreId: string) => void;
}

function getDayLabel(dateStr: string, startDate: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const s = new Date(startDate + 'T00:00:00');
  const diffDays = Math.round((d.getTime() - s.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'long' });
}

function groupByDate<T>(items: T[], dateKey: string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const date = (item as any)[dateKey] || 'undated';
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(item);
  }
  return groups;
}

const isCompleted = (status: string) =>
  status === 'completed' || status === 'approved' || status === 'verified';

const formatTime = (timeStr: string | null) => {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return timeStr;
  }
};

export function MemberCard({
  member,
  isLeader,
  startDate,
  onAvatarTap,
  onChoreComplete,
  onPaidChoreComplete,
}: MemberCardProps) {
  const name = member.nickname || member.displayName;
  const hasItems = member.chores.length > 0 || member.paidChores.length > 0 || member.events.length > 0;

  const choresByDay = groupByDate(member.chores, 'dueDate');
  const eventsByDay = groupByDate(member.events, 'startDate');

  // Collect all unique dates for ordered display
  const allDates = new Set<string>();
  for (const d of choresByDay.keys()) allDates.add(d);
  for (const d of eventsByDay.keys()) allDates.add(d);
  const sortedDates = Array.from(allDates).sort();

  return (
    <div
      className="rounded-2xl p-5 flex flex-col h-full"
      style={{
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: isLeader ? '2px solid #eab308' : 'none',
        borderLeft: isLeader ? '4px solid #eab308' : `4px solid ${member.color || '#6d28d9'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {/* Tappable avatar */}
        <button
          onClick={() => onAvatarTap(member)}
          className="relative shrink-0 active:scale-95 transition-transform"
        >
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: member.color || '#6d28d9' }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {isLeader && (
            <Crown
              size={20}
              className="absolute -top-1 -right-1"
              style={{ color: '#eab308', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
              fill="#eab308"
            />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold truncate" style={{ color: 'var(--kiosk-text, #fff)' }}>
            {name}
          </h3>
          <p className="text-xs capitalize" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
            {member.roleId}
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--kiosk-accent, #7c3aed)' }}>
            {member.totalPoints} pts
          </p>
        </div>
      </div>

      {!hasItems && (
        <p className="text-sm italic flex-1 flex items-center justify-center" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
          Nothing scheduled
        </p>
      )}

      {/* Paid Chores (no date grouping) */}
      {member.paidChores.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
            Paid Chores
          </p>
          <div className="space-y-1">
            {member.paidChores.map((pc) => {
              const done = isCompleted(pc.status);
              const canComplete = pc.status === 'claimed';
              return (
                <button
                  key={pc.id}
                  onClick={() => canComplete && onPaidChoreComplete(member, pc.id)}
                  disabled={!canComplete}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                    canComplete ? 'active:scale-[0.98] hover:bg-white/5' : ''
                  }`}
                  style={{ opacity: done ? 0.45 : 1 }}
                >
                  {done ? (
                    <Check size={18} className="shrink-0 text-green-400" />
                  ) : (
                    <DollarSign size={18} className="shrink-0 text-emerald-400" />
                  )}
                  <span
                    className={`flex-1 text-sm font-medium ${done ? 'line-through' : ''}`}
                    style={{ color: 'var(--kiosk-text, #fff)' }}
                  >
                    {pc.title}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                    ${pc.amount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day-grouped chores and events */}
      {sortedDates.map((date) => {
        const dayChores = choresByDay.get(date) || [];
        const dayEvents = eventsByDay.get(date) || [];
        if (dayChores.length === 0 && dayEvents.length === 0) return null;

        return (
          <div key={date} className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
              {getDayLabel(date, startDate)}
            </p>
            <div className="space-y-1">
              {/* Chores */}
              {dayChores.map((chore: KioskChoreItem) => {
                const done = isCompleted(chore.status);
                const pending = chore.status === 'pending';
                return (
                  <button
                    key={`chore-${chore.id}`}
                    onClick={() => pending && onChoreComplete(member, chore.id)}
                    disabled={!pending}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                      pending ? 'active:scale-[0.98] hover:bg-white/5' : ''
                    }`}
                    style={{ opacity: done ? 0.45 : 1 }}
                  >
                    {done ? (
                      <Check size={18} className="shrink-0 text-green-400" />
                    ) : chore.status === 'pending_approval' ? (
                      <Clock size={18} className="shrink-0 text-yellow-400" />
                    ) : (
                      <CircleDot size={18} className="shrink-0" style={{ color: chore.categoryColor || 'var(--kiosk-text-muted, #9ca3af)' }} />
                    )}
                    <span
                      className={`flex-1 text-sm font-medium ${done ? 'line-through' : ''}`}
                      style={{ color: 'var(--kiosk-text, #fff)' }}
                    >
                      {chore.title}
                    </span>
                    {chore.points > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
                        {chore.points}pt
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Events */}
              {dayEvents.map((event: KioskEventItem) => (
                <div
                  key={`event-${event.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                >
                  <Calendar size={18} className="shrink-0" style={{ color: event.color || 'var(--kiosk-text-muted, #9ca3af)' }} />
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--kiosk-text, #fff)' }}>
                    {event.title}
                  </span>
                  {!event.allDay && event.startTime && (
                    <span className="text-xs" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
                      {formatTime(event.startTime)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
