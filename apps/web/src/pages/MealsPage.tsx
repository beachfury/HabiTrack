// apps/web/src/pages/MealsPage.tsx
// Dinner Planner page - plan weekly meals with voting support

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Check,
  X,
  AlertCircle,
  Loader2,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { mealsApi } from '../api/meals';
import type { MealPlan, Recipe } from '../types/meals';
import {
  formatDateLocal,
  getWeekStart,
  getWeekEnd,
  getMonthDays,
  DAYS_SHORT,
} from '../utils';

// Import split components
import { DayCard, MonthDayCell, PlanMealModal, VotingModal } from './meals';

type ViewMode = 'week' | 'month';

export function MealsPage() {
  const { user } = useAuth();
  const { getPageAnimationClasses } = useTheme();
  const isAdmin = user?.role === 'admin';
  const animationClasses = getPageAnimationClasses('meals-background');

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  // Current date for navigation
  const [currentDate, setCurrentDate] = useState(new Date());

  // Data
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);

  // Compute date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      return {
        start: weekStart,
        end: getWeekEnd(weekStart),
      };
    } else {
      // For month view, include days from adjacent months that appear in the grid
      const monthDays = getMonthDays(currentDate);
      return {
        start: monthDays[0],
        end: monthDays[monthDays.length - 1],
      };
    }
  };

  // Fetch data when date range changes
  useEffect(() => {
    fetchMealPlans();
    fetchRecipes();
  }, [currentDate, viewMode]);

  async function fetchMealPlans() {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const startDate = formatDateLocal(start);
      const endDate = formatDateLocal(end);
      const data = await mealsApi.getMealPlans({ startDate, endDate });
      setMealPlans(data.mealPlans);
    } catch (err) {
      console.error('Failed to fetch meal plans:', err);
      setError('Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecipes() {
    try {
      const data = await mealsApi.getRecipes({ status: 'approved' });
      setRecipes(data.recipes);
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
    }
  }

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Navigate based on view mode
  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get week dates
  const getWeekDates = (): Date[] => {
    const weekStart = getWeekStart(currentDate);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // Get meal plan for a specific date
  const getMealForDate = (date: Date): MealPlan | undefined => {
    const dateStr = formatDateLocal(date);
    return mealPlans.find((mp) => mp.date === dateStr);
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in the past
  const isPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Format header based on view mode
  const formatPeriodHeader = (): string => {
    if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const end = getWeekEnd(weekStart);
      const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
      const startDay = weekStart.getDate();
      const endDay = end.getDate();
      const year = weekStart.getFullYear();

      if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${year}`;
      }
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Check if date is in current month (for month view styling)
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Handle clicking a day to plan
  const handleDayClick = (date: Date) => {
    const dateStr = formatDateLocal(date);
    const existingMeal = getMealForDate(date);

    if (existingMeal) {
      // If voting is open, show voting modal
      if (existingMeal.status === 'voting') {
        setSelectedMealPlan(existingMeal);
        setShowVotingModal(true);
      } else {
        // Otherwise show detail/edit modal
        setSelectedMealPlan(existingMeal);
        setSelectedDate(dateStr);
        setShowPlanModal(true);
      }
    } else if (!isPast(date)) {
      // Anyone can click on future empty days
      // Admins get full planning modal, non-admins get suggestion modal
      setSelectedDate(dateStr);
      setSelectedMealPlan(null);
      setShowPlanModal(true);
    }
  };

  return (
    <div className={`min-h-screen themed-meals-bg ${animationClasses}`}>
      <div className="p-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="w-8 h-8 text-[var(--color-primary)]" />
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">Dinner Planner</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'week'
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              <CalendarDays size={16} />
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'month'
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              <Calendar size={16} />
              Month
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevPeriod}
              className="p-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
            >
              <ChevronLeft size={20} className="text-[var(--color-foreground)]" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-muted)] hover:bg-[var(--color-muted)]/80 text-[var(--color-foreground)] transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
            >
              <ChevronRight size={20} className="text-[var(--color-foreground)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Period Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{formatPeriodHeader()}</h2>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] flex items-center gap-2">
          <Check size={18} />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 text-[var(--color-destructive)] flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Grid */}
      {viewMode === 'week' ? (
        /* Week View */
        <div className="flex-1 grid grid-cols-7 gap-3">
          {loading ? (
            <div className="col-span-7 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : (
            getWeekDates().map((date, index) => {
              const meal = getMealForDate(date);
              const today = isToday(date);
              const past = isPast(date);

              return (
                <DayCard
                  key={index}
                  date={date}
                  dayName={DAYS_SHORT[date.getDay()]}
                  meal={meal}
                  isToday={today}
                  isPast={past}
                  isAdmin={isAdmin}
                  onClick={() => handleDayClick(date)}
                />
              );
            })
          )}
        </div>
      ) : (
        /* Month View */
        <div className="flex-1 flex flex-col themed-card overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
            {DAYS_SHORT.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-semibold text-[var(--color-muted-foreground)]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Grid */}
          <div className="flex-1 grid grid-cols-7 grid-rows-6">
            {loading ? (
              <div className="col-span-7 row-span-6 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
              </div>
            ) : (
              getMonthDays(currentDate).map((date, index) => {
                const meal = getMealForDate(date);
                const today = isToday(date);
                const past = isPast(date);
                const inCurrentMonth = isCurrentMonth(date);

                return (
                  <MonthDayCell
                    key={index}
                    date={date}
                    meal={meal}
                    isToday={today}
                    isPast={past}
                    isCurrentMonth={inCurrentMonth}
                    isAdmin={isAdmin}
                    onClick={() => handleDayClick(date)}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Plan Meal Modal */}
      {showPlanModal && selectedDate && (
        <PlanMealModal
          date={selectedDate}
          existingMeal={selectedMealPlan}
          recipes={recipes}
          isAdmin={isAdmin}
          onClose={() => {
            setShowPlanModal(false);
            setSelectedDate(null);
            setSelectedMealPlan(null);
          }}
          onSuccess={(msg) => {
            showSuccessMessage(msg);
            fetchMealPlans();
          }}
        />
      )}

      {/* Voting Modal */}
      {showVotingModal && selectedMealPlan && (
        <VotingModal
          mealPlan={selectedMealPlan}
          recipes={recipes}
          isAdmin={isAdmin}
          currentUserId={user?.id}
          onClose={() => {
            setShowVotingModal(false);
            setSelectedMealPlan(null);
          }}
          onSuccess={(msg) => {
            showSuccessMessage(msg);
            fetchMealPlans();
          }}
        />
      )}
      </div>
    </div>
  );
}
