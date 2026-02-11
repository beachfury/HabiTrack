// apps/web/src/components/dashboard/widgets/UpcomingMealsWidget.tsx
// Dashboard widget showing upcoming meals for the week

import { UtensilsCrossed, ChefHat, Vote, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpcomingMeal {
  id: number;
  date: string;
  recipeName: string | null;
  customMealName: string | null;
  isFendForYourself: boolean;
  ffyMessage: string | null;
  status: 'planned' | 'voting' | 'finalized';
  voteCount?: number;
}

interface UpcomingMealsWidgetProps {
  meals: UpcomingMeal[];
}

export function UpcomingMealsWidget({ meals = [] }: UpcomingMealsWidgetProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    // Otherwise show day name
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getMealDisplay = (meal: UpcomingMeal) => {
    if (meal.isFendForYourself) {
      return {
        name: 'Fend For Yourself',
        subtitle: meal.ffyMessage || "You're on your own!",
        icon: HelpCircle,
        color: 'var(--color-warning)',
      };
    }

    if (meal.status === 'voting') {
      return {
        name: 'Voting Open',
        subtitle: meal.voteCount ? `${meal.voteCount} suggestions` : 'Cast your vote!',
        icon: Vote,
        color: 'var(--color-info)',
      };
    }

    const name = meal.recipeName || meal.customMealName || 'No meal planned';
    return {
      name,
      subtitle: meal.status === 'finalized' ? 'Confirmed' : 'Planned',
      icon: ChefHat,
      color: 'var(--color-primary)',
    };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <UtensilsCrossed size={18} className="text-[var(--color-primary)]" />
          Upcoming Meals
        </h3>
        <Link to="/meals" className="text-sm text-[var(--color-primary)] hover:opacity-80">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {meals.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            No meals planned yet
          </p>
        ) : (
          meals.slice(0, 5).map((meal) => {
            const display = getMealDisplay(meal);
            const IconComponent = display.icon;

            return (
              <Link
                key={meal.id}
                to={`/meals?date=${meal.date}`}
                className="themed-widget flex items-center gap-3 hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${display.color}20` }}
                >
                  <IconComponent size={16} style={{ color: display.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                    {display.name}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {formatDate(meal.date)} - {display.subtitle}
                  </p>
                </div>
                {meal.isFendForYourself && (
                  <span className="text-lg">🍕</span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
