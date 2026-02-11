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
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <ListChecks size={18} className="text-[var(--color-primary)]" />
          My Chores
        </h3>
        <Link to="/chores" className="text-sm text-[var(--color-primary)] hover:opacity-80">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {chores.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            No chores assigned to you
          </p>
        ) : (
          chores.map((chore) => (
            <div
              key={chore.id}
              className="themed-widget flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--color-primary)]/50" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                  {chore.title}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
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
