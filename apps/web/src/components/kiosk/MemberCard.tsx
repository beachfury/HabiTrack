// apps/web/src/components/kiosk/MemberCard.tsx
// Individual family member card for the kiosk action board

import { useState } from 'react';
import { Check, Clock, CircleDot, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { api } from '../../api';
import type { KioskBoardMember, KioskChoreItem, KioskPaidChoreItem, KioskEventItem } from '../../api/kiosk';

interface MemberCardProps {
  member: KioskBoardMember;
  isVerified: boolean;
  onRequestPin: (userId: number, userName: string, color: string | null, avatar: string | null, onSuccess: () => void) => void;
  onRefresh: () => void;
}

export function MemberCard({ member, isVerified, onRequestPin, onRefresh }: MemberCardProps) {
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const name = member.nickname || member.displayName;
  const hasItems = member.chores.length > 0 || member.paidChores.length > 0 || member.events.length > 0;

  const completeChore = async (chore: KioskChoreItem) => {
    if (chore.status !== 'pending') return;
    const key = `chore-${chore.id}`;
    if (completing.has(key)) return;

    const doComplete = async () => {
      setCompleting((prev) => new Set(prev).add(key));
      try {
        await api.completeChore(chore.id, {});
        onRefresh();
      } catch (err) {
        console.error('Failed to complete chore:', err);
      } finally {
        setCompleting((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    };

    if (isVerified) {
      doComplete();
    } else {
      onRequestPin(member.id, name, member.color, member.avatarUrl, doComplete);
    }
  };

  const completePaidChore = async (pc: KioskPaidChoreItem) => {
    if (pc.status !== 'claimed') return;
    const key = `paid-${pc.id}`;
    if (completing.has(key)) return;

    const doComplete = async () => {
      setCompleting((prev) => new Set(prev).add(key));
      try {
        await api.completePaidChore(String(pc.id), {});
        onRefresh();
      } catch (err) {
        console.error('Failed to complete paid chore:', err);
      } finally {
        setCompleting((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    };

    if (isVerified) {
      doComplete();
    } else {
      onRequestPin(member.id, name, member.color, member.avatarUrl, doComplete);
    }
  };

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

  return (
    <div
      className="rounded-2xl p-5 flex flex-col h-full"
      style={{
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderLeft: `4px solid ${member.color || '#6d28d9'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ backgroundColor: member.color || '#6d28d9' }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--kiosk-text, #fff)' }}>
            {name}
          </h3>
          <p className="text-xs capitalize" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
            {member.roleId}
          </p>
        </div>
      </div>

      {!hasItems && (
        <p className="text-sm italic flex-1 flex items-center justify-center" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
          Nothing scheduled today
        </p>
      )}

      {/* Chores */}
      {member.chores.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
            Chores
          </p>
          <div className="space-y-1.5">
            {member.chores.map((chore) => {
              const done = isCompleted(chore.status);
              const pending = chore.status === 'pending';
              const key = `chore-${chore.id}`;
              const isLoading = completing.has(key);
              return (
                <button
                  key={chore.id}
                  onClick={() => pending && completeChore(chore)}
                  disabled={!pending || isLoading}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                    pending ? 'active:scale-[0.98] hover:bg-white/5' : ''
                  }`}
                  style={{ opacity: done ? 0.45 : 1 }}
                >
                  {/* Status icon */}
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin shrink-0" style={{ color: 'var(--kiosk-accent, #7c3aed)' }} />
                  ) : done ? (
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
          </div>
        </div>
      )}

      {/* Paid Chores */}
      {member.paidChores.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
            Paid Chores
          </p>
          <div className="space-y-1.5">
            {member.paidChores.map((pc) => {
              const done = isCompleted(pc.status);
              const canComplete = pc.status === 'claimed';
              const key = `paid-${pc.id}`;
              const isLoading = completing.has(key);
              return (
                <button
                  key={pc.id}
                  onClick={() => canComplete && completePaidChore(pc)}
                  disabled={!canComplete || isLoading}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                    canComplete ? 'active:scale-[0.98] hover:bg-white/5' : ''
                  }`}
                  style={{ opacity: done ? 0.45 : 1 }}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin shrink-0" style={{ color: 'var(--kiosk-accent, #7c3aed)' }} />
                  ) : done ? (
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

      {/* Events */}
      {member.events.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
            Events
          </p>
          <div className="space-y-1.5">
            {member.events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
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
      )}
    </div>
  );
}
