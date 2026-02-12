// apps/web/src/components/shopping/PredictionsTab.tsx
import { useState } from 'react';
import {
  Plus,
  X,
  Sparkles,
  Store,
  Clock,
  TrendingUp,
  Calendar,
  DollarSign,
  Utensils,
} from 'lucide-react';
import { ItemImage } from './ItemImage';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { Suggestion } from '../../types';

interface PredictionsTabProps {
  suggestions: Suggestion[];
  dueThisWeek?: Suggestion[];
  stats?: {
    totalSuggestions: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    dueThisWeekCount: number;
    byType?: {
      overdue: number;
      dueSoon: number;
      mealIngredients: number;
      popular: number;
    };
  } | null;
  onAdd: (catalogItemId: number, quantity?: number, storeId?: number | null) => void;
  onDismiss: (catalogItemId: number) => void;
  onAddAll: (confidenceLevel?: string) => void;
  isAdmin: boolean;
}

type FilterType = 'all' | 'high' | 'due_this_week' | 'overdue' | 'meals' | 'popular';

export function PredictionsTab({
  suggestions,
  dueThisWeek = [],
  stats,
  onAdd,
  onDismiss,
  onAddAll,
  isAdmin,
}: PredictionsTabProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const handleDismiss = (catalogItemId: number) => {
    setDismissed((prev) => new Set(prev).add(catalogItemId));
    onDismiss(catalogItemId);
  };

  // Filter suggestions
  let filteredSuggestions = suggestions.filter((s) => !dismissed.has(s.catalogItemId));

  if (filter === 'high') {
    filteredSuggestions = filteredSuggestions.filter((s) => s.confidence === 'high');
  } else if (filter === 'due_this_week') {
    filteredSuggestions = dueThisWeek.filter((s) => !dismissed.has(s.catalogItemId));
  } else if (filter === 'overdue') {
    filteredSuggestions = filteredSuggestions.filter(
      (s) => s.suggestionType === 'overdue' || s.confidence === 'high',
    );
  } else if (filter === 'meals') {
    filteredSuggestions = filteredSuggestions.filter((s) => s.suggestionType === 'meal_ingredient');
  } else if (filter === 'popular') {
    filteredSuggestions = filteredSuggestions.filter((s) => s.suggestionType === 'popular');
  }

  // Calculate visible counts (excluding dismissed)
  const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.catalogItemId));
  const visibleDueThisWeek = dueThisWeek.filter((s) => !dismissed.has(s.catalogItemId));
  const visibleOverdue = visibleSuggestions.filter(
    (s) => s.suggestionType === 'overdue' || s.confidence === 'high',
  ).length;
  const visibleDueSoon = visibleSuggestions.filter(
    (s) => s.suggestionType === 'due_soon' || s.confidence === 'medium',
  ).length;
  const visibleMeals = visibleSuggestions.filter(
    (s) => s.suggestionType === 'meal_ingredient',
  ).length;
  const visiblePopular = visibleSuggestions.filter((s) => s.suggestionType === 'popular').length;

  if (suggestions.length === 0) {
    return (
      <div className="themed-card p-8 text-center">
        <Sparkles
          size={48}
          className="mx-auto mb-3 text-[var(--color-muted-foreground)] opacity-50"
        />
        <p className="text-[var(--color-muted-foreground)] mb-2">No predictions yet</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Keep shopping and we'll learn your patterns!
        </p>
        <div
          className="mt-4 p-4 rounded-xl"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          }}
        >
          <p className="text-sm text-[var(--color-primary)]">
            💡 <strong>Tip:</strong> The more you shop, the smarter predictions become. We track
            purchase patterns, meal planning ingredients, and popular items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="themed-card p-3">
            <div className="flex items-center gap-2 text-[var(--color-destructive)] mb-1">
              <Clock size={16} />
              <span className="text-xs font-medium">Overdue</span>
            </div>
            <p className="text-xl font-bold text-[var(--color-foreground)]">{visibleOverdue}</p>
          </div>
          <div className="themed-card p-3">
            <div className="flex items-center gap-2 text-[var(--color-warning)] mb-1">
              <Calendar size={16} />
              <span className="text-xs font-medium">Due Soon</span>
            </div>
            <p className="text-xl font-bold text-[var(--color-foreground)]">{visibleDueSoon}</p>
          </div>
          <div className="themed-card p-3">
            <div className="flex items-center gap-2 text-[var(--color-primary)] mb-1">
              <Utensils size={16} />
              <span className="text-xs font-medium">For Meals</span>
            </div>
            <p className="text-xl font-bold text-[var(--color-foreground)]">{visibleMeals}</p>
          </div>
          <div className="themed-card p-3">
            <div className="flex items-center gap-2 text-[var(--color-success)] mb-1">
              <TrendingUp size={16} />
              <span className="text-xs font-medium">Popular</span>
            </div>
            <p className="text-xl font-bold text-[var(--color-foreground)]">{visiblePopular}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {[
          {
            id: 'all',
            label: 'All',
            count: visibleSuggestions.length,
          },
          {
            id: 'overdue',
            label: 'Overdue',
            count: visibleOverdue,
          },
          {
            id: 'due_this_week',
            label: 'This Week',
            count: visibleDueThisWeek.length,
          },
          {
            id: 'meals',
            label: 'Meals',
            count: visibleMeals,
          },
          {
            id: 'popular',
            label: 'Popular',
            count: visiblePopular,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              filter === tab.id
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.id
                  ? 'bg-[var(--color-primary-foreground)]/20 text-[var(--color-primary-foreground)]'
                  : 'bg-[var(--color-border)] text-[var(--color-muted-foreground)]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      {isAdmin && filteredSuggestions.length > 1 && (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onAddAll('high')}
            className="px-3 py-2 bg-[var(--color-destructive)] text-white rounded-xl hover:opacity-90 transition-colors flex items-center gap-1 text-sm"
          >
            <Plus size={14} /> Add Overdue
          </button>
          <button
            onClick={() => onAddAll('medium')}
            className="px-3 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl hover:opacity-90 transition-colors flex items-center gap-1 text-sm"
          >
            <Plus size={14} /> Add All Due
          </button>
        </div>
      )}

      {/* Suggestions List */}
      <div className="space-y-2">
        {filteredSuggestions.length === 0 ? (
          <div className="themed-card p-6 text-center">
            <p className="text-[var(--color-muted-foreground)]">No items match this filter</p>
          </div>
        ) : (
          filteredSuggestions.map((s) => (
            <div
              key={s.catalogItemId}
              className="themed-card p-3"
              style={
                s.confidence === 'high'
                  ? {
                      backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
                    }
                  : s.confidence === 'medium'
                    ? {
                        backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
                      }
                    : s.suggestionType === 'meal_ingredient'
                      ? {
                          backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
                        }
                      : {}
              }
            >
              <div className="flex items-start gap-3">
                <ItemImage url={s.imageUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-[var(--color-foreground)] truncate">
                      {s.itemName}
                    </p>
                    <ConfidenceBadge level={s.confidence} />
                    {s.suggestionType === 'meal_ingredient' && (
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                        <Utensils size={10} className="inline mr-1" />
                        Meal
                      </span>
                    )}
                    {s.suggestionType === 'popular' && (
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-[var(--color-success)]/20 text-[var(--color-success)]">
                        <TrendingUp size={10} className="inline mr-1" />
                        Popular
                      </span>
                    )}
                  </div>

                  {s.brand && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mb-1">{s.brand}</p>
                  )}

                  <p className="text-sm text-[var(--color-primary)] mb-2">{s.reason}</p>

                  {/* Enhanced info row */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {s.suggestedQuantity && s.suggestedQuantity > 1 && (
                      <span
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        Qty: {s.suggestedQuantity}
                      </span>
                    )}
                    {s.suggestedStoreName && (
                      <span
                        className="px-2 py-1 rounded-full flex items-center gap-1"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
                          color: 'var(--color-success)',
                        }}
                      >
                        <Store size={12} />
                        {s.suggestedStoreName}
                      </span>
                    )}
                    {s.bestPrice && (
                      <span
                        className="px-2 py-1 rounded-full flex items-center gap-1"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
                          color: 'var(--color-success)',
                        }}
                      >
                        <DollarSign size={12} />${Number(s.bestPrice).toFixed(2)}
                      </span>
                    )}
                    {s.categoryName && (
                      <span className="px-2 py-1 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-full">
                        {s.categoryName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {isAdmin && (
                    <button
                      onClick={() =>
                        onAdd(s.catalogItemId, s.suggestedQuantity, s.suggestedStoreId)
                      }
                      className={`p-2 text-white rounded-lg ${
                        s.confidence === 'high'
                          ? 'bg-[var(--color-destructive)] hover:opacity-90'
                          : 'bg-[var(--color-success)] hover:opacity-90'
                      }`}
                      title={`Add ${s.suggestedQuantity || 1} to list`}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(s.catalogItemId)}
                    className="p-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-lg hover:opacity-80"
                    title="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
