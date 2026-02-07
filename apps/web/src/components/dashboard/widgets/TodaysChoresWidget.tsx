// apps/web/src/components/dashboard/widgets/TodaysChoresWidget.tsx
import { CheckSquare, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Chore {
  id: number;
  choreId: number;
  title: string;
  status: string;
  dueDate: string;
  completedAt: string | null;
  assigneeName: string;
  assigneeColor: string;
}

interface TodaysChoresWidgetProps {
  chores: Chore[];
}

export function TodaysChoresWidget({ chores = [] }: TodaysChoresWidgetProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <CheckSquare size={18} className="text-green-500" />
          Today's Chores
        </h3>
        <Link to="/chores" className="text-sm text-blue-500 hover:text-blue-600">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {chores.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No chores due today
          </p>
        ) : (
          chores.map((chore) => (
            <div
              key={chore.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  chore.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : 'border-2 border-gray-300 dark:border-gray-600'
                }`}
              >
                {chore.status === 'completed' && <Check size={12} />}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    chore.status === 'completed'
                      ? 'text-gray-400 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {chore.title}
                </p>
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: chore.assigneeColor || '#8b5cf6' }}
                title={chore.assigneeName}
              >
                {chore.assigneeName?.charAt(0).toUpperCase()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
