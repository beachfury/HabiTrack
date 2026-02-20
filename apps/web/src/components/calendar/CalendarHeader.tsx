// apps/web/src/components/calendar/CalendarHeader.tsx
import { ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { MONTHS } from './constants';

interface CalendarHeaderProps {
  year: number;
  month: number;
  showChores: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onToggleChores: () => void;
}

export function CalendarHeader({
  year,
  month,
  showChores,
  onPrevMonth,
  onNextMonth,
  onToday,
  onToggleChores,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
          {MONTHS[month]} {year}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-2 hover:bg-[var(--color-muted)] rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1 text-sm font-medium hover:bg-[var(--color-muted)] rounded-lg"
          >
            Today
          </button>
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-[var(--color-muted)] rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <button
        onClick={onToggleChores}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          showChores
            ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
            : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
        }`}
      >
        <CheckSquare size={18} />
        <span className="hidden sm:inline">Show Chores</span>
      </button>
    </div>
  );
}
