// apps/web/src/components/dashboard/widgets/ChoreLeaderboardWidget.tsx
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LeaderboardEntry {
  id: number;
  displayName: string;
  color: string;
  avatarUrl: string | null;
  points: number;
}

interface ChoreLeaderboardWidgetProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: number;
}

export function ChoreLeaderboardWidget({ leaderboard = [], currentUserId }: ChoreLeaderboardWidgetProps) {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" />
          This Week's Leaders
        </h3>
        <Link to="/chores" className="text-sm text-blue-500 hover:text-blue-600">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {leaderboard.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No activity this week
          </p>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                entry.id === currentUserId
                  ? 'bg-purple-50 dark:bg-purple-900/20'
                  : 'bg-gray-50 dark:bg-gray-700/50'
              }`}
            >
              <div className="w-6 text-center">
                {index < 3 ? (
                  <span className="text-lg">{medals[index]}</span>
                ) : (
                  <span className="text-sm text-gray-400">#{index + 1}</span>
                )}
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: entry.color || '#8b5cf6' }}
              >
                {entry.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {entry.displayName}
                  {entry.id === currentUserId && (
                    <span className="ml-1 text-xs text-purple-500">(You)</span>
                  )}
                </p>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {entry.points} pts
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
