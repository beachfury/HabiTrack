// apps/web/src/pages/calendar/WeeklyMealCard.tsx
// Weekly meal planner card (read-only)

import { Utensils } from 'lucide-react';
import type { MealPlan } from '../../types/meals';
import { formatDateLocal, DAYS_SHORT } from '../../utils';

interface WeeklyMealCardProps {
  mealPlans: MealPlan[];
  onMealClick: (date: string) => void;
}

export function WeeklyMealCard({ mealPlans, onMealClick }: WeeklyMealCardProps) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDays.push(date);
  }

  const getMealForDate = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return mealPlans.find((mp) => mp.date === dateStr);
  };

  const getMealDisplay = (meal: MealPlan | undefined) => {
    if (!meal) return { text: 'Not planned', icon: '📭', style: 'text-[var(--color-muted-foreground)]' };
    if (meal.isFendForYourself) return { text: 'Fend For Yourself', icon: '🍕', style: 'text-[var(--color-warning)]' };
    if (meal.status === 'voting') return { text: 'Voting Open', icon: '🗳️', style: 'text-[var(--color-primary)]' };
    if (meal.recipe?.name) return { text: meal.recipe.name, icon: '🍽️', style: 'text-[var(--color-foreground)]' };
    if (meal.customMealName) return { text: meal.customMealName, icon: '🍽️', style: 'text-[var(--color-foreground)]' };
    return { text: 'Planned', icon: '📅', style: 'text-[var(--color-muted-foreground)]' };
  };

  const isToday = (date: Date) => {
    const todayStr = formatDateLocal(new Date());
    return formatDateLocal(date) === todayStr;
  };

  return (
    <div className="themed-calendar-meal p-4">
      <div className="flex items-center gap-2 mb-4">
        <Utensils size={18} className="text-[var(--color-primary)]" />
        <h3
          style={{
            fontWeight: 'var(--calendar-meal-font-weight, 600)',
            fontSize: 'var(--calendar-meal-font-size, 1rem)',
            fontFamily: 'var(--calendar-meal-font-family, inherit)',
            color: 'var(--calendar-meal-text, var(--color-foreground))',
          }}
        >
          Weekly Meal Plan
        </h3>
      </div>
      <div
        className="grid grid-cols-7 gap-2"
        style={{ fontFamily: 'var(--calendar-meal-font-family, inherit)' }}
      >
        {weekDays.map((date, i) => {
          const meal = getMealForDate(date);
          const display = getMealDisplay(meal);
          const dayIsToday = isToday(date);

          return (
            <div
              key={i}
              onClick={() => onMealClick(formatDateLocal(date))}
              className={`p-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-muted)]/50 ${
                dayIsToday ? 'bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]' : ''
              }`}
            >
              <div className="text-center mb-1">
                <span
                  style={{
                    fontSize: 'calc(var(--calendar-meal-font-size, 0.75rem) * 0.85)',
                    fontWeight: 'var(--calendar-meal-font-weight, 400)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  {DAYS_SHORT[date.getDay()]}
                </span>
                <span
                  className="block"
                  style={{
                    fontSize: 'var(--calendar-meal-font-size, 0.875rem)',
                    fontWeight: 'var(--calendar-meal-font-weight, 500)',
                    color: dayIsToday ? 'var(--color-primary)' : 'var(--calendar-meal-text, var(--color-foreground))',
                  }}
                >
                  {date.getDate()}
                </span>
              </div>
              <div className="text-center">
                <span style={{ fontSize: 'var(--calendar-meal-font-size, 1.125rem)' }}>{display.icon}</span>
                <p
                  className="truncate"
                  style={{
                    fontSize: 'calc(var(--calendar-meal-font-size, 0.75rem) * 0.85)',
                    fontWeight: 'var(--calendar-meal-font-weight, 400)',
                  }}
                  title={display.text}
                >
                  {display.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
