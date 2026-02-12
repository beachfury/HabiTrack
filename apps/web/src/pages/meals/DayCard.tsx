// apps/web/src/pages/meals/DayCard.tsx
// Day card component for week view

import { Plus } from 'lucide-react';
import type { MealPlan } from '../../types/meals';
import { MealCardContent } from './MealCardContent';

interface DayCardProps {
  date: Date;
  dayName: string;
  meal: MealPlan | undefined;
  isToday: boolean;
  isPast: boolean;
  isAdmin: boolean;
  onClick: () => void;
}

export function DayCard({
  date,
  dayName,
  meal,
  isToday,
  isPast,
  isAdmin,
  onClick,
}: DayCardProps) {
  // Anyone can click on a day with a meal, or future empty days
  const canClick = meal || !isPast;

  return (
    <div
      onClick={canClick ? onClick : undefined}
      className={`
        themed-card p-4 flex flex-col min-h-[200px] transition-all
        ${isToday ? 'ring-2 ring-[var(--color-primary)]' : ''}
        ${isPast ? 'opacity-60' : ''}
        ${canClick ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'}`}>
          {dayName}
        </span>
        <span className={`text-lg font-bold ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-foreground)]'}`}>
          {date.getDate()}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {meal ? (
          <MealCardContent meal={meal} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-muted-foreground)]">
            {!isPast ? (
              <>
                <Plus size={24} className="mb-2 opacity-50" />
                <span className="text-xs">{isAdmin ? 'Plan meal' : 'Suggest meal'}</span>
              </>
            ) : (
              <span className="text-xs">No meal planned</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
