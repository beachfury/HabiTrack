// apps/web/src/components/chores/LeaderboardView.tsx
import { useState } from 'react';
import { Trophy, Award, Flame, Crown, Settings } from 'lucide-react';
import type { LeaderboardEntry } from '../../types';
import { AdjustPointsModal } from './modals/AdjustPointsModal';

interface LeaderboardViewProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: number;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export function LeaderboardView({
  leaderboard,
  currentUserId,
  isAdmin,
  onRefresh,
}: LeaderboardViewProps) {
  const [adjustingUser, setAdjustingUser] = useState<LeaderboardEntry | null>(null);

  const handlePointsAdjusted = (newTotal: number) => {
    // Refresh the leaderboard data
    if (onRefresh) {
      onRefresh();
    }
  };

  if (leaderboard.length === 0) {
    return (
      <div className="themed-card p-8 text-center text-[var(--color-muted-foreground)]">
        <Trophy size={48} className="mx-auto mb-3 opacity-30" />
        <p>No leaderboard data yet</p>
        <p className="text-sm mt-1">Complete chores to earn points!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin hint */}
      {isAdmin && (
        <div className="text-sm text-[var(--color-muted-foreground)] text-center">
          Click on a user to adjust their points
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* 2nd Place */}
          <div
            className={`flex flex-col items-center pt-8 ${isAdmin ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={() => isAdmin && setAdjustingUser(leaderboard[1])}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2"
              style={{ backgroundColor: leaderboard[1]?.color || '#6b7280' }}
            >
              {(leaderboard[1]?.nickname || leaderboard[1]?.displayName || '?').charAt(0)}
            </div>
            <Award className="text-[var(--color-muted-foreground)] mb-1" size={24} />
            <p className="font-semibold text-[var(--color-foreground)] text-sm truncate w-full text-center">
              {leaderboard[1]?.nickname || leaderboard[1]?.displayName}
            </p>
            <p className="text-[var(--color-muted-foreground)] text-sm">{leaderboard[1]?.totalPoints} pts</p>
          </div>

          {/* 1st Place */}
          <div
            className={`flex flex-col items-center ${isAdmin ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={() => isAdmin && setAdjustingUser(leaderboard[0])}
          >
            <Crown className="text-[var(--color-warning)] mb-2" size={28} />
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2 ring-4 ring-[var(--color-warning)]"
              style={{ backgroundColor: leaderboard[0]?.color || '#8b5cf6' }}
            >
              {(leaderboard[0]?.nickname || leaderboard[0]?.displayName || '?').charAt(0)}
            </div>
            <p className="font-bold text-[var(--color-foreground)] truncate w-full text-center">
              {leaderboard[0]?.nickname || leaderboard[0]?.displayName}
            </p>
            <p className="text-[var(--color-warning)] font-semibold">{leaderboard[0]?.totalPoints} pts</p>
          </div>

          {/* 3rd Place */}
          <div
            className={`flex flex-col items-center pt-12 ${isAdmin ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={() => isAdmin && setAdjustingUser(leaderboard[2])}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold mb-2"
              style={{ backgroundColor: leaderboard[2]?.color || '#6b7280' }}
            >
              {(leaderboard[2]?.nickname || leaderboard[2]?.displayName || '?').charAt(0)}
            </div>
            <Award
              size={20}
              className="mb-1"
              style={{ color: 'color-mix(in srgb, var(--color-warning) 80%, var(--color-destructive))' }}
            />
            <p className="font-medium text-[var(--color-foreground)] text-sm truncate w-full text-center">
              {leaderboard[2]?.nickname || leaderboard[2]?.displayName}
            </p>
            <p className="text-[var(--color-muted-foreground)] text-sm">{leaderboard[2]?.totalPoints} pts</p>
          </div>
        </div>
      )}

      {/* Full List */}
      <div className="themed-card overflow-hidden">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.userId}
            onClick={() => isAdmin && setAdjustingUser(entry)}
            className={`p-4 flex items-center gap-4 border-b border-[var(--color-border)] last:border-0 ${
              entry.userId === currentUserId ? 'bg-[var(--color-primary)]/10' : ''
            } ${isAdmin ? 'cursor-pointer hover:bg-[var(--color-muted)] transition-colors' : ''}`}
          >
            {/* Rank */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              style={
                index === 0
                  ? { backgroundColor: 'color-mix(in srgb, var(--color-warning) 20%, transparent)', color: 'var(--color-warning)' }
                  : index === 1
                    ? { backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }
                    : index === 2
                      ? { backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, color-mix(in srgb, var(--color-destructive) 15%, transparent))', color: 'color-mix(in srgb, var(--color-warning) 70%, var(--color-destructive))' }
                      : { backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }
              }
            >
              {index + 1}
            </div>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
              style={{ backgroundColor: entry.color || '#8b5cf6' }}
            >
              {(entry.nickname || entry.displayName).charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--color-foreground)] truncate">
                {entry.nickname || entry.displayName}
              </p>
              <div className="flex items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
                <span>{entry.completedCount} completed</span>
                {(entry as any).streak > 0 && (
                  <span className="flex items-center gap-1">
                    <Flame size={14} style={{ color: 'color-mix(in srgb, var(--color-warning) 70%, var(--color-destructive))' }} />
                    {(entry as any).streak} day streak
                  </span>
                )}
              </div>
            </div>

            {/* Points */}
            <div className="text-right flex items-center gap-2">
              <div>
                <p className="text-xl font-bold text-[var(--color-primary)]">{entry.totalPoints}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">points</p>
              </div>
              {isAdmin && <Settings size={16} className="text-[var(--color-muted-foreground)]" />}
            </div>
          </div>
        ))}
      </div>

      {/* Adjust Points Modal */}
      {adjustingUser && (
        <AdjustPointsModal
          user={{
            id: adjustingUser.userId,
            displayName: adjustingUser.displayName,
            nickname: adjustingUser.nickname,
            color: adjustingUser.color,
            totalPoints: adjustingUser.totalPoints,
          }}
          onSuccess={handlePointsAdjusted}
          onClose={() => setAdjustingUser(null)}
        />
      )}
    </div>
  );
}
