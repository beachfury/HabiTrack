// apps/web/src/pages/meals/MonthDayCell.tsx
// Compact day cell for month view

import { Plus } from 'lucide-react';
import type { MealPlan } from '../../types/meals';

interface MonthDayCellProps {
  date: Date;
  meal: MealPlan | undefined;
  isToday: boolean;
  isPast: boolean;
  isCurrentMonth: boolean;
  isAdmin: boolean;
  onClick: () => void;
}

export function MonthDayCell({
  date,
  meal,
  isToday,
  isPast,
  isCurrentMonth,
  isAdmin,
  onClick,
}: MonthDayCellProps) {
  const canClick = meal || (!isPast && isCurrentMonth);

  // Get meal display info
  const getMealDisplay = () => {
    if (!meal) return null;

    if (meal.isFendForYourself) {
      return { icon: '🍕', name: 'FFY', color: 'var(--color-warning)' };
    }

    if (meal.status === 'voting') {
      return { icon: '🗳️', name: 'Voting', color: 'var(--color-info)' };
    }

    const name = meal.recipe?.name || meal.customMealName || 'Planned';
    return { icon: '🍽️', name, color: 'var(--color-primary)' };
  };

  const mealDisplay = getMealDisplay();

  return (
    <div
      onClick={canClick ? onClick : undefined}
      className={`
        border-b border-r border-[var(--color-border)]/30 p-1 min-h-[80px] transition-colors
        ${!isCurrentMonth ? 'bg-[var(--color-muted)]/30' : ''}
        ${isPast && isCurrentMonth ? 'opacity-60' : ''}
        ${canClick ? 'cursor-pointer hover:bg-[var(--color-muted)]/50' : 'cursor-default'}
      `}
    >
      {/* Date number */}
      <div className="flex items-center justify-center mb-1">
        <span
          className={`w-6 h-6 flex items-center justify-center text-xs rounded-full ${
            isToday
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-bold'
              : isCurrentMonth
                ? 'text-[var(--color-foreground)]'
                : 'text-[var(--color-muted-foreground)]'
          }`}
        >
          {date.getDate()}
        </span>
      </div>

      {/* Meal indicator */}
      {mealDisplay ? (
        <div
          className="text-xs px-1.5 py-0.5 rounded text-center truncate"
          style={{
            backgroundColor: `color-mix(in srgb, ${mealDisplay.color} 20%, transparent)`,
            color: mealDisplay.color,
          }}
          title={mealDisplay.name}
        >
          <span className="mr-0.5">{mealDisplay.icon}</span>
          <span className="hidden sm:inline">{mealDisplay.name.length > 10 ? mealDisplay.name.substring(0, 10) + '...' : mealDisplay.name}</span>
        </div>
      ) : (
        isCurrentMonth && !isPast && (
          <div className="text-xs text-center text-[var(--color-muted-foreground)] opacity-0 hover:opacity-100 transition-opacity">
            <Plus size={12} className="mx-auto" />
          </div>
        )
      )}
    </div>
  );
}
