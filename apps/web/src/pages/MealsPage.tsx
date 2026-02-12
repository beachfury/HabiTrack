// apps/web/src/pages/MealsPage.tsx
// Dinner Planner page - plan weekly meals with voting support

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar,
  CalendarDays,
  ChefHat,
  Vote,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Users,
  ExternalLink,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { ModalPortal, ModalBody } from '../components/common/ModalPortal';
import { useAuth } from '../context/AuthContext';
import { mealsApi } from '../api/meals';
import type {
  MealPlan,
  MealSuggestion,
  Recipe,
  CreateMealPlanData,
} from '../types/meals';
import {
  getDifficultyLabel,
  getDifficultyStyle,
  formatCookTime,
  getMealStatusLabel,
  getMealStatusStyle,
} from '../types/meals';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to format date as YYYY-MM-DD
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get start of week (Sunday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get end of week (Saturday)
function getWeekEnd(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + (6 - d.getDay()));
  d.setHours(23, 59, 59, 999);
  return d;
}

// Get start of month
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Get end of month
function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

// Get all days to display in month view (includes padding days from prev/next months)
function getMonthDays(date: Date): Date[] {
  const firstDay = getMonthStart(date);
  const lastDay = getMonthEnd(date);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: Date[] = [];

  // Add days from previous month
  const prevMonth = new Date(date.getFullYear(), date.getMonth(), 0);
  for (let i = startingDay - 1; i >= 0; i--) {
    days.push(new Date(date.getFullYear(), date.getMonth() - 1, prevMonth.getDate() - i));
  }

  // Add days of current month
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(date.getFullYear(), date.getMonth(), i));
  }

  // Add days from next month to complete the grid (6 rows = 42 days)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(date.getFullYear(), date.getMonth() + 1, i));
  }

  return days;
}

type ViewMode = 'week' | 'month';

export function MealsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

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
    <div className="p-8 h-full flex flex-col themed-meals-bg">
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
                  dayName={SHORT_DAYS[date.getDay()]}
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
            {SHORT_DAYS.map((day) => (
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
  );
}

// =============================================================================
// Day Card Component
// =============================================================================
function DayCard({
  date,
  dayName,
  meal,
  isToday,
  isPast,
  isAdmin,
  onClick,
}: {
  date: Date;
  dayName: string;
  meal: MealPlan | undefined;
  isToday: boolean;
  isPast: boolean;
  isAdmin: boolean;
  onClick: () => void;
}) {
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

// =============================================================================
// Month Day Cell Component (compact for month view)
// =============================================================================
function MonthDayCell({
  date,
  meal,
  isToday,
  isPast,
  isCurrentMonth,
  isAdmin,
  onClick,
}: {
  date: Date;
  meal: MealPlan | undefined;
  isToday: boolean;
  isPast: boolean;
  isCurrentMonth: boolean;
  isAdmin: boolean;
  onClick: () => void;
}) {
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

// =============================================================================
// Meal Card Content
// =============================================================================
function MealCardContent({ meal }: { meal: MealPlan }) {
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

// =============================================================================
// Plan Meal Modal
// =============================================================================
function PlanMealModal({
  date,
  existingMeal,
  recipes,
  isAdmin,
  onClose,
  onSuccess,
}: {
  date: string;
  existingMeal: MealPlan | null;
  recipes: Recipe[];
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [mode, setMode] = useState<'recipe' | 'custom' | 'ffy' | 'voting'>('recipe');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(
    existingMeal?.recipeId || null
  );
  const [customMealName, setCustomMealName] = useState(existingMeal?.customMealName || '');
  const [ffyMessage, setFfyMessage] = useState(existingMeal?.ffyMessage || '');
  const [notes, setNotes] = useState(existingMeal?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Determine initial mode based on existing meal
  useEffect(() => {
    if (existingMeal) {
      if (existingMeal.isFendForYourself) {
        setMode('ffy');
      } else if (existingMeal.customMealName) {
        setMode('custom');
      } else {
        setMode('recipe');
      }
    }
  }, [existingMeal]);

  const dateObj = new Date(date + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleSave = async () => {
    if (mode === 'recipe' && !selectedRecipeId) {
      setError('Please select a recipe');
      return;
    }
    if (mode === 'custom' && !customMealName.trim()) {
      setError('Please enter a meal name');
      return;
    }
    // Voting mode doesn't require any selection - family will add suggestions

    setSaving(true);
    setError('');

    try {
      if (existingMeal) {
        // Update existing
        if (mode === 'ffy') {
          await mealsApi.setFendForYourself(existingMeal.id, ffyMessage);
        } else {
          await mealsApi.updateMealPlan(existingMeal.id, {
            recipeId: mode === 'recipe' ? selectedRecipeId || undefined : undefined,
            customMealName: mode === 'custom' ? customMealName : undefined,
            isFendForYourself: false,
            notes: notes || undefined,
          });
        }
        onSuccess('Meal plan updated!');
      } else {
        // Create new
        const data: CreateMealPlanData = {
          date,
          mealType: 'dinner',
          notes: notes || undefined,
        };

        if (mode === 'ffy') {
          data.isFendForYourself = true;
          data.ffyMessage = ffyMessage || undefined;
          data.status = 'finalized';
        } else if (mode === 'voting') {
          // Create meal plan and immediately open voting
          data.status = 'voting';
        } else if (mode === 'recipe') {
          data.recipeId = selectedRecipeId || undefined;
          data.status = 'planned';
        } else {
          data.customMealName = customMealName;
          data.status = 'planned';
        }

        await mealsApi.createMealPlan(data);
        onSuccess(mode === 'voting' ? 'Voting is now open!' : 'Meal planned!');
      }
      onClose();
    } catch (err) {
      setError('Failed to save meal plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingMeal) return;

    if (!confirm('Delete this meal plan?')) return;

    setSaving(true);
    try {
      await mealsApi.deleteMealPlan(existingMeal.id);
      onSuccess('Meal plan deleted');
      onClose();
    } catch (err) {
      setError('Failed to delete meal plan');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenVoting = async () => {
    if (!existingMeal) return;

    setSaving(true);
    try {
      await mealsApi.openVoting(existingMeal.id);
      onSuccess('Voting is now open!');
      onClose();
    } catch (err) {
      setError('Failed to open voting');
    } finally {
      setSaving(false);
    }
  };

  // Non-admins can only view existing meals, but can suggest for empty days
  const canEdit = isAdmin;
  const isViewOnly = existingMeal && !canEdit;
  const isSuggestionMode = !existingMeal && !isAdmin;

  // Determine modal title
  const modalTitle = existingMeal
    ? (isViewOnly ? 'Meal Details' : 'Edit Meal Plan')
    : (isSuggestionMode ? 'Suggest a Meal' : 'Plan Dinner');

  // Handle non-admin suggestion submission
  const handleSuggest = async () => {
    if (mode === 'recipe' && !selectedRecipeId) {
      setError('Please select a recipe');
      return;
    }
    if (mode === 'custom' && !customMealName.trim()) {
      setError('Please enter a meal name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Create a voting meal plan with their suggestion
      const data: CreateMealPlanData = {
        date,
        mealType: 'dinner',
        status: 'voting',
      };

      const result = await mealsApi.createMealPlan(data);

      // Add their suggestion to the new meal plan
      await mealsApi.addSuggestion(result.id, {
        recipeId: mode === 'recipe' ? selectedRecipeId || undefined : undefined,
        customMealName: mode === 'custom' ? customMealName : undefined,
      });

      onSuccess('Suggestion submitted! Others can now vote.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit suggestion');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      size="lg"
    >
      <ModalBody>
        <p className="text-[var(--color-muted-foreground)] mb-4">{formattedDate}</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm">
            {error}
          </div>
        )}

        {/* View-only mode for non-admins */}
        {isViewOnly ? (
          <div className="space-y-4">
            {existingMeal.isFendForYourself ? (
              <div className="text-center py-6">
                <span className="text-5xl">🍕</span>
                <p className="text-xl font-medium text-[var(--color-foreground)] mt-3">
                  Fend For Yourself!
                </p>
                {existingMeal.ffyMessage && (
                  <p className="text-[var(--color-muted-foreground)] mt-2">
                    {existingMeal.ffyMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                {existingMeal.recipe?.imageUrl ? (
                  <img
                    src={existingMeal.recipe.imageUrl}
                    alt={existingMeal.recipe.name || ''}
                    className="w-32 h-32 mx-auto rounded-xl object-cover mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 mx-auto rounded-xl bg-[var(--color-muted)] flex items-center justify-center mb-4">
                    <ChefHat size={48} className="text-[var(--color-muted-foreground)]" />
                  </div>
                )}
                <p className="text-xl font-medium text-[var(--color-foreground)]">
                  {existingMeal.recipe?.name || existingMeal.customMealName || 'Meal planned'}
                </p>
                <span
                  className="inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium"
                  style={getMealStatusStyle(existingMeal.status)}
                >
                  {getMealStatusLabel(existingMeal.status)}
                </span>
              </div>
            )}

            {existingMeal.notes && (
              <div className="p-3 bg-[var(--color-muted)] rounded-lg">
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  <strong>Notes:</strong> {existingMeal.notes}
                </p>
              </div>
            )}

            <div className="pt-4">
              <button onClick={onClose} className="themed-btn-primary w-full">
                Close
              </button>
            </div>
          </div>
        ) : isSuggestionMode ? (
          /* Non-admin suggestion mode for empty days */
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-info)]/10 rounded-xl border border-[var(--color-info)]/20">
              <p className="text-sm text-[var(--color-foreground)]">
                <Vote size={16} className="inline mr-2 text-[var(--color-info)]" />
                Suggest a meal for this day! Your suggestion will start a vote that others can join.
              </p>
            </div>

            {/* Simple mode toggle for suggestions */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode('recipe')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'recipe'
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                }`}
              >
                <ChefHat size={16} className="inline mr-1" />
                From Recipes
              </button>
              <button
                onClick={() => setMode('custom')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'custom'
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                }`}
              >
                <UtensilsCrossed size={16} className="inline mr-1" />
                Custom Idea
              </button>
            </div>

            {mode === 'recipe' && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                  Pick a Recipe
                </label>
                <select
                  value={selectedRecipeId || ''}
                  onChange={(e) => setSelectedRecipeId(parseInt(e.target.value) || null)}
                  className="themed-input w-full"
                >
                  <option value="">Choose a recipe...</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
                {recipes.length === 0 && (
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
                    No recipes available yet.
                  </p>
                )}
              </div>
            )}

            {mode === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                  What should we have?
                </label>
                <input
                  type="text"
                  value={customMealName}
                  onChange={(e) => setCustomMealName(e.target.value)}
                  className="themed-input w-full"
                  placeholder="e.g., Tacos, Pizza Night, Sushi..."
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button onClick={onClose} className="themed-btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSuggest}
                disabled={saving}
                className="themed-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Vote size={18} />
                    Suggest This
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Tabs - Admin only */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setMode('recipe')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'recipe'
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                }`}
              >
                <ChefHat size={16} className="inline mr-1" />
                Recipe
              </button>
              <button
                onClick={() => setMode('custom')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'custom'
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                }`}
              >
                <UtensilsCrossed size={16} className="inline mr-1" />
                Custom
              </button>
              {!existingMeal && (
                <button
                  onClick={() => setMode('voting')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'voting'
                      ? 'bg-[var(--color-info)] text-white'
                      : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                  }`}
                >
                  <Vote size={16} className="inline mr-1" />
                  Vote
                </button>
              )}
              <button
                onClick={() => setMode('ffy')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'ffy'
                    ? 'bg-[var(--color-warning)] text-white'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                }`}
              >
                🍕 FFY
              </button>
            </div>

            {/* Mode Content */}
            <div className="space-y-4">
              {mode === 'recipe' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                    Select Recipe
                  </label>
                  <select
                    value={selectedRecipeId || ''}
                    onChange={(e) => setSelectedRecipeId(parseInt(e.target.value) || null)}
                    className="themed-input w-full"
                  >
                    <option value="">Choose a recipe...</option>
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                  {recipes.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
                      No approved recipes yet. Add some in the Recipe Book!
                    </p>
                  )}
            </div>
          )}

          {mode === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                Meal Name
              </label>
              <input
                type="text"
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                className="themed-input w-full"
                placeholder="e.g., Takeout Pizza, Leftovers..."
              />
            </div>
          )}

          {mode === 'ffy' && (
            <div>
              <div className="text-center py-4">
                <span className="text-4xl">🍕</span>
                <p className="text-lg font-medium text-[var(--color-foreground)] mt-2">
                  Fend For Yourself!
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Everyone's on their own for dinner tonight
                </p>
              </div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                Custom Message (optional)
              </label>
              <input
                type="text"
                value={ffyMessage}
                onChange={(e) => setFfyMessage(e.target.value)}
                className="themed-input w-full"
                placeholder="Raid the fridge!"
              />
            </div>
          )}

          {mode === 'voting' && (
            <div>
              <div className="text-center py-4">
                <Vote size={48} className="mx-auto text-[var(--color-info)] mb-2" />
                <p className="text-lg font-medium text-[var(--color-foreground)]">
                  Let the Family Decide!
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                  Open voting and let everyone suggest and vote on meals
                </p>
              </div>
              <div className="bg-[var(--color-muted)] rounded-lg p-4 text-sm text-[var(--color-muted-foreground)]">
                <p className="font-medium text-[var(--color-foreground)] mb-2">How it works:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Everyone can suggest meals from recipes or custom ideas</li>
                  <li>Family members vote on their favorites</li>
                  <li>Admin picks the winner or uses the top vote</li>
                </ul>
              </div>
            </div>
          )}

          {mode !== 'ffy' && mode !== 'voting' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="themed-input w-full"
                placeholder="Any notes for this meal..."
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6">
          {existingMeal && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="py-2 px-4 rounded-xl border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors"
            >
              Delete
            </button>
          )}

          {existingMeal && existingMeal.status !== 'voting' && isAdmin && (
            <button
              onClick={handleOpenVoting}
              disabled={saving}
              className="py-2 px-4 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors flex items-center gap-2"
            >
              <Vote size={16} />
              Open Voting
            </button>
          )}

          <div className="flex-1" />

          <button onClick={onClose} className="themed-btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 ${
              mode === 'voting'
                ? 'py-2 px-4 rounded-xl bg-[var(--color-info)] text-white hover:bg-[var(--color-info)]/90 transition-colors'
                : 'themed-btn-primary'
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {mode === 'voting' ? 'Opening...' : 'Saving...'}
              </>
            ) : mode === 'voting' ? (
              <>
                <Vote size={18} />
                Start Voting
              </>
            ) : (
              <>
                <Check size={18} />
                Save
              </>
            )}
          </button>
            </div>
          </>
        )}
      </ModalBody>
    </ModalPortal>
  );
}

// =============================================================================
// Voting Modal
// =============================================================================
function VotingModal({
  mealPlan,
  recipes,
  isAdmin,
  currentUserId,
  onClose,
  onSuccess,
}: {
  mealPlan: MealPlan;
  recipes: Recipe[];
  isAdmin: boolean;
  currentUserId: number | undefined;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSuggestion, setShowAddSuggestion] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dateObj = new Date(mealPlan.date + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    fetchSuggestions();
  }, [mealPlan.id]);

  async function fetchSuggestions() {
    setLoading(true);
    try {
      const data = await mealsApi.getMealPlan(mealPlan.date);
      setSuggestions(data.mealPlan.suggestions || []);
    } catch (err) {
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }

  const handleVote = async (suggestionId: number) => {
    try {
      await mealsApi.castVote(mealPlan.id, suggestionId);
      fetchSuggestions();
    } catch (err) {
      setError('Failed to cast vote');
    }
  };

  const handleAddSuggestion = async () => {
    if (!selectedRecipeId && !customName.trim()) {
      setError('Please select a recipe or enter a custom name');
      return;
    }

    setSubmitting(true);
    try {
      await mealsApi.addSuggestion(mealPlan.id, {
        recipeId: selectedRecipeId || undefined,
        customMealName: customName || undefined,
      });
      setShowAddSuggestion(false);
      setSelectedRecipeId(null);
      setCustomName('');
      fetchSuggestions();
      onSuccess('Suggestion added!');
    } catch (err: any) {
      setError(err.message || 'Failed to add suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async (overrideRecipeId?: number, overrideCustomName?: string) => {
    setSubmitting(true);
    try {
      await mealsApi.finalizeMealPlan(mealPlan.id, {
        overrideRecipeId,
        overrideCustomName,
      });
      onSuccess('Meal finalized!');
      onClose();
    } catch (err) {
      setError('Failed to finalize meal');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Cancel voting and return to planned status
  const handleCancelVoting = async () => {
    if (!confirm('Cancel voting? The meal will return to planned status.')) return;

    setSubmitting(true);
    try {
      await mealsApi.updateMealPlan(mealPlan.id, { status: 'planned' });
      onSuccess('Voting cancelled');
      onClose();
    } catch (err) {
      setError('Failed to cancel voting');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Delete the entire meal plan
  const handleDeleteMealPlan = async () => {
    if (!confirm('Delete this meal plan? All suggestions and votes will be lost.')) return;

    setSubmitting(true);
    try {
      await mealsApi.deleteMealPlan(mealPlan.id);
      onSuccess('Meal plan deleted');
      onClose();
    } catch (err) {
      setError('Failed to delete meal plan');
    } finally {
      setSubmitting(false);
    }
  };

  // Sort suggestions by vote count
  const sortedSuggestions = [...suggestions].sort((a, b) => b.voteCount - a.voteCount);

  // Build title with date
  const titleContent = (
    <div>
      <div>Vote for Dinner</div>
      <p className="text-sm text-[var(--color-muted-foreground)] font-normal">{formattedDate}</p>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={titleContent}
      size="lg"
    >
      <ModalBody>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : (
          <>
            {/* Suggestions List */}
            <div className="space-y-3 mb-4">
              {sortedSuggestions.length === 0 ? (
                <div className="text-center py-6 text-[var(--color-muted-foreground)]">
                  <Vote size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No suggestions yet. Be the first to suggest a meal!</p>
                </div>
              ) : (
                sortedSuggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onVote={() => handleVote(suggestion.id)}
                    isAdmin={isAdmin}
                    onFinalize={() => handleFinalize(
                      suggestion.recipeId || undefined,
                      suggestion.customMealName || undefined
                    )}
                  />
                ))
              )}
            </div>

            {/* Add Suggestion */}
            {showAddSuggestion ? (
              <div className="p-4 bg-[var(--color-muted)] rounded-xl space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                    Suggest from Recipe Book
                  </label>
                  <select
                    value={selectedRecipeId || ''}
                    onChange={(e) => {
                      setSelectedRecipeId(parseInt(e.target.value) || null);
                      setCustomName('');
                    }}
                    className="themed-input w-full"
                  >
                    <option value="">Choose a recipe...</option>
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-center text-sm text-[var(--color-muted-foreground)]">or</div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                    Custom Suggestion
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value);
                      setSelectedRecipeId(null);
                    }}
                    className="themed-input w-full"
                    placeholder="e.g., Tacos, Sushi..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddSuggestion(false)}
                    className="themed-btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSuggestion}
                    disabled={submitting}
                    className="themed-btn-primary flex-1"
                  >
                    {submitting ? 'Adding...' : 'Add Suggestion'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddSuggestion(true)}
                className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Suggestion
              </button>
            )}

            {/* Admin: Finalize with winner button */}
            {isAdmin && sortedSuggestions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <button
                  onClick={() => handleFinalize()}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  {submitting ? 'Finalizing...' : 'Finalize with Top Vote'}
                </button>
                <p className="text-xs text-center text-[var(--color-muted-foreground)] mt-2">
                  Click a suggestion's ✨ icon to pick a specific winner
                </p>
              </div>
            )}

            {/* Admin: Cancel Voting / Delete Meal Plan */}
            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex gap-3">
                <button
                  onClick={handleCancelVoting}
                  disabled={submitting}
                  className="flex-1 py-2 px-3 rounded-xl border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors text-sm"
                >
                  Cancel Voting
                </button>
                <button
                  onClick={handleDeleteMealPlan}
                  disabled={submitting}
                  className="py-2 px-3 rounded-xl border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </ModalBody>
    </ModalPortal>
  );
}

// =============================================================================
// Suggestion Card
// =============================================================================
function SuggestionCard({
  suggestion,
  onVote,
  isAdmin,
  onFinalize,
}: {
  suggestion: MealSuggestion;
  onVote: () => void;
  isAdmin: boolean;
  onFinalize: () => void;
}) {
  const name = suggestion.recipe?.name || suggestion.customMealName || 'Unknown';

  return (
    <div className="p-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl flex items-center gap-4">
      {/* Recipe image or icon */}
      <div className="w-12 h-12 rounded-lg bg-[var(--color-muted)] flex items-center justify-center overflow-hidden flex-shrink-0">
        {suggestion.recipe?.imageUrl ? (
          <img
            src={suggestion.recipe.imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ChefHat size={20} className="text-[var(--color-muted-foreground)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-foreground)] truncate">{name}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Suggested by {suggestion.suggestedByName || 'Unknown'}
        </p>
      </div>

      {/* Vote count */}
      <div className="text-center">
        <span className="text-xl font-bold text-[var(--color-foreground)]">
          {suggestion.voteCount}
        </span>
        <p className="text-xs text-[var(--color-muted-foreground)]">votes</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onVote}
          className={`p-2 rounded-lg transition-colors ${
            suggestion.hasVoted
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]'
          }`}
          title={suggestion.hasVoted ? 'Your vote' : 'Vote for this'}
        >
          <Check size={18} />
        </button>

        {isAdmin && (
          <button
            onClick={onFinalize}
            className="p-2 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 transition-colors"
            title="Pick this as winner"
          >
            <Sparkles size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
