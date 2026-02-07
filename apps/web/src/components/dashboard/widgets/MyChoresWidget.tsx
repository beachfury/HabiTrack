// apps/web/src/components/dashboard/widgets/MyChoresWidget.tsx
import { ListChecks, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Chore {
  id: number;
  choreId: number;
  title: string;
  status: string;
  dueDate: string;
  completedAt: string | null;
}

interface MyChoresWidgetProps {
  chores: Chore[];
}

export function MyChoresWidget({ chores = [] }: MyChoresWidgetProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ListChecks size={18} className="text-purple-500" />
          My Chores
        </h3>
        <Link to="/chores" className="text-sm text-blue-500 hover:text-blue-600">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {chores.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No chores assigned to you
          </p>
        ) : (
          chores.map((chore) => (
            <div
              key={chore.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-purple-300 dark:border-purple-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {chore.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(chore.dueDate)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
