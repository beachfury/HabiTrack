// apps/web/src/components/dashboard/widgets/PaidChoresWidget.tsx
import { DollarSign, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PaidChore {
  id: string;
  title: string;
  amount: number;
  difficulty: string;
  status: string;
}

interface PaidChoresWidgetProps {
  chores: PaidChore[];
}

export function PaidChoresWidget({ chores = [] }: PaidChoresWidgetProps) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign size={18} className="text-green-500" />
          Available Paid Chores
          {chores.length > 0 && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full animate-pulse">
              {chores.length} available!
            </span>
          )}
        </h3>
        <Link to="/paid-chores" className="text-sm text-blue-500 hover:text-blue-600">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {chores.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No paid chores available
          </p>
        ) : (
          chores.map((chore) => (
            <Link
              key={chore.id}
              to="/paid-chores"
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {chore.title}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    difficultyColors[chore.difficulty as keyof typeof difficultyColors] || difficultyColors.medium
                  }`}
                >
                  {chore.difficulty}
                </span>
              </div>
              <div className="text-lg font-bold text-green-600">
                ${Number(chore.amount).toFixed(2)}
              </div>
            </Link>
          ))
        )}
      </div>

      {chores.length > 0 && (
        <Link
          to="/paid-chores"
          className="mt-2 flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Zap size={16} />
          Claim a Chore!
        </Link>
      )}
    </div>
  );
}
