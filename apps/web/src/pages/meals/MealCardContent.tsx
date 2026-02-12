// apps/web/src/pages/meals/MealCardContent.tsx
// Content display for a meal card

import { Vote, ChefHat, Clock } from 'lucide-react';
import type { MealPlan } from '../../types/meals';
import { getMealStatusLabel, getMealStatusStyle, formatCookTime } from '../../types/meals';

interface MealCardContentProps {
  meal: MealPlan;
}

export function MealCardContent({ meal }: MealCardContentProps) {
  // FFY Day
  if (meal.isFendForYourself) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-3xl mb-2">🍕</div>
        <span className="text-sm font-medium text-[var(--color-foreground)]">
          Fend For Yourself
        </span>
        {meal.ffyMessage && (
          <span className="text-xs text-[var(--color-muted-foreground)] mt-1">
            {meal.ffyMessage}
          </span>
        )}
      </div>
    );
  }

  // Voting status
  if (meal.status === 'voting') {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Vote size={16} className="text-[var(--color-primary)]" />
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={getMealStatusStyle('voting')}
          >
            Voting Open
          </span>
        </div>
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {meal.suggestionCount || 0} suggestions
        </span>
        <span className="text-xs text-[var(--color-muted-foreground)] mt-1">
          Click to vote!
        </span>
      </div>
    );
  }

  // Planned/Finalized meal
  const mealName = meal.recipe?.name || meal.customMealName || 'Meal planned';

  return (
    <div className="flex-1 flex flex-col">
      {/* Status badge */}
      {meal.status === 'finalized' && (
        <span
          className="self-start text-xs px-2 py-0.5 rounded-full font-medium mb-2"
          style={getMealStatusStyle('finalized')}
        >
          {getMealStatusLabel('finalized')}
        </span>
      )}

      {/* Meal image or icon */}
      {meal.recipe?.imageUrl ? (
        <div className="w-full h-16 rounded-lg overflow-hidden mb-2 bg-[var(--color-muted)]">
          <img
            src={meal.recipe.imageUrl}
            alt={mealName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-16 rounded-lg bg-[var(--color-muted)] flex items-center justify-center mb-2">
          <ChefHat size={24} className="text-[var(--color-muted-foreground)] opacity-50" />
        </div>
      )}

      {/* Meal name */}
      <span className="text-sm font-medium text-[var(--color-foreground)] line-clamp-2">
        {mealName}
      </span>

      {/* Time info */}
      {meal.recipe && (meal.recipe.prepTimeMinutes || meal.recipe.cookTimeMinutes) && (
        <span className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1 mt-1">
          <Clock size={12} />
          {formatCookTime(meal.recipe.prepTimeMinutes, meal.recipe.cookTimeMinutes)}
        </span>
      )}
    </div>
  );
}
