// apps/web/src/components/chores/StatsBar.tsx
import { Star, Flame, CheckSquare, Target } from 'lucide-react';
import type { ChoreStats } from '../../types';

interface StatsBarProps {
  stats: ChoreStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Star className="text-yellow-600" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPoints}</p>
            <p className="text-sm text-gray-500">Total Points</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Flame className="text-orange-600" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.currentStreak}</p>
            <p className="text-sm text-gray-500">Day Streak</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckSquare className="text-green-600" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.thisWeek}</p>
            <p className="text-sm text-gray-500">This Week</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Target className="text-purple-600" size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(stats.completionRate ?? 0)}%
            </p>
            <p className="text-sm text-gray-500">Completion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
