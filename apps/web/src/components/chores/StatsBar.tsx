// apps/web/src/components/chores/StatsBar.tsx
import { Star, Flame, CheckSquare, Target } from 'lucide-react';
import type { ChoreStats } from '../../types';

interface StatsBarProps {
  stats: ChoreStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-[var(--color-card)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' }}>
            <Star style={{ color: 'var(--color-warning)' }} size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-foreground)]">{stats.totalPoints}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">Total Points</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-card)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}>
            <Flame style={{ color: 'var(--color-primary)' }} size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-foreground)]">{stats.currentStreak}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">Day Streak</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-card)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)' }}>
            <CheckSquare style={{ color: 'var(--color-success)' }} size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-foreground)]">{stats.thisWeek}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">This Week</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-card)] rounded-xl p-4 shadow-sm border border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
            <Target style={{ color: 'var(--color-accent)' }} size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-foreground)]">
              {Math.round(stats.completionRate ?? 0)}%
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">Completion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
