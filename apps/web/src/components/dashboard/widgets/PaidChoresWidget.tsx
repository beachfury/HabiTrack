// apps/web/src/components/dashboard/widgets/PaidChoresWidget.tsx
import { DollarSign, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDifficultyStyle } from '../../../utils';

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <DollarSign size={18} className="text-[var(--color-success)]" />
          Available Paid Chores
          {chores.length > 0 && (
            <span className="text-xs bg-[var(--color-success)]/20 text-[var(--color-success)] px-2 py-0.5 rounded-full animate-pulse">
              {chores.length} available!
            </span>
          )}
        </h3>
        <Link to="/paid-chores" className="text-sm text-[var(--color-primary)] hover:opacity-80">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {chores.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            No paid chores available
          </p>
        ) : (
          chores.map((chore) => (
            <Link
              key={chore.id}
              to="/paid-chores"
              className="themed-widget flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                  {chore.title}
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={getDifficultyStyle(chore.difficulty)}
                >
                  {chore.difficulty}
                </span>
              </div>
              <div className="text-lg font-bold text-[var(--color-success)]">
                ${Number(chore.amount).toFixed(2)}
              </div>
            </Link>
          ))
        )}
      </div>

      {chores.length > 0 && (
        <Link
          to="/paid-chores"
          className="mt-2 flex items-center justify-center gap-2 py-2 bg-[var(--color-success)] text-[var(--color-success-foreground)] rounded-[var(--radius-md)] text-sm font-medium transition-colors hover:opacity-90"
        >
          <Zap size={16} />
          Claim a Chore!
        </Link>
      )}
    </div>
  );
}
