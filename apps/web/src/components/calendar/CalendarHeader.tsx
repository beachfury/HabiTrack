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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {MONTHS[month]} {year}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Today
          </button>
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <button
        onClick={onToggleChores}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          showChores
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
      >
        <CheckSquare size={18} />
        <span className="hidden sm:inline">Show Chores</span>
      </button>
    </div>
  );
}
