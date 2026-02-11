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
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <CheckSquare size={18} className="text-[var(--color-success)]" />
          Today's Chores
        </h3>
        <Link to="/chores" className="text-sm text-[var(--color-primary)] hover:opacity-80">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {chores.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            No chores due today
          </p>
        ) : (
          chores.map((chore) => (
            <div
              key={chore.id}
              className="themed-widget flex items-center gap-3"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  chore.status === 'completed'
                    ? 'bg-[var(--color-success)] text-[var(--color-success-foreground)]'
                    : 'border-2 border-[var(--color-border)]'
                }`}
              >
                {chore.status === 'completed' && <Check size={12} />}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    chore.status === 'completed'
                      ? 'text-[var(--color-muted-foreground)] line-through'
                      : 'text-[var(--color-foreground)]'
                  }`}
                >
                  {chore.title}
                </p>
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: chore.assigneeColor || 'var(--color-primary)' }}
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
