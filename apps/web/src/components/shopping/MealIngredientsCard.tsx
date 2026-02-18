// apps/web/src/components/shopping/MealIngredientsCard.tsx
// Card showing meal ingredient suggestions for shopping list

import { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Check,
  Loader2,
  Calendar,
  ChefHat,
} from 'lucide-react';
import { mealsApi } from '../../api/meals';
import type { MealShoppingSuggestion } from '../../types/meals';

interface MealIngredientsCardProps {
  onAddToList: (name: string, quantity: number, unit: string | null) => void;
  onRefresh: () => void;
  isAdmin: boolean;
}

// Group suggestions by meal date
function groupByMeal(
  suggestions: MealShoppingSuggestion[],
): Record<string, MealShoppingSuggestion[]> {
  const grouped: Record<string, MealShoppingSuggestion[]> = {};
  suggestions.forEach((s) => {
    const key = `${s.mealDate}|${s.mealName}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });
  return grouped;
}

export function MealIngredientsCard({
  onAddToList,
  onRefresh,
  isAdmin,
}: MealIngredientsCardProps) {
  const [suggestions, setSuggestions] = useState<MealShoppingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [processing, setProcessing] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    setLoading(true);
    try {
      const data = await mealsApi.getShoppingSuggestions('pending');
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Failed to fetch meal suggestions:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddSuggestion = async (suggestion: MealShoppingSuggestion) => {
    if (!isAdmin) return;

    setProcessing((prev) => new Set(prev).add(suggestion.id));
    try {
      await mealsApi.addShoppingSuggestion(suggestion.id, true);
      // Remove from local list
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      onRefresh();
    } catch (err) {
      console.error('Failed to add suggestion:', err);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
    }
  };

  const handleDismissSuggestion = async (suggestion: MealShoppingSuggestion) => {
    if (!isAdmin) return;

    setProcessing((prev) => new Set(prev).add(suggestion.id));
    try {
      await mealsApi.dismissShoppingSuggestion(suggestion.id);
      // Remove from local list
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    } catch (err) {
      console.error('Failed to dismiss suggestion:', err);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
    }
  };

  const handleAddAllForMeal = async (mealSuggestions: MealShoppingSuggestion[]) => {
    if (!isAdmin) return;

    const ids = mealSuggestions.map((s) => s.id);
    // Mark all as processing
    setProcessing((prev) => new Set([...prev, ...ids]));

    try {
      await mealsApi.bulkAddShoppingSuggestions(ids, true);
      // Remove from local list
      setSuggestions((prev) => prev.filter((s) => !ids.includes(s.id)));
      onRefresh();
    } catch (err) {
      console.error('Failed to add suggestions:', err);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  // Don't show if no suggestions
  if (!loading && suggestions.length === 0) {
    return null;
  }

  const groupedSuggestions = groupByMeal(suggestions);
  const mealKeys = Object.keys(groupedSuggestions).sort();

  return (
    <div className="themed-shopping-list overflow-hidden mb-4">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-[var(--color-muted)] transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <UtensilsCrossed size={20} className="text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-[var(--color-foreground)]">Meal Ingredients</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {suggestions.length} items from upcoming meals
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={20} className="text-[var(--color-muted-foreground)]" />
        ) : (
          <ChevronDown size={20} className="text-[var(--color-muted-foreground)]" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : (
            <div className="space-y-4">
              {mealKeys.map((key) => {
                const items = groupedSuggestions[key];
                const [date, mealName] = key.split('|');
                const dateObj = new Date(date + 'T12:00:00');
                const formattedDate = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <MealGroup
                    key={key}
                    mealName={mealName}
                    date={formattedDate}
                    items={items}
                    processing={processing}
                    isAdmin={isAdmin}
                    onAdd={handleAddSuggestion}
                    onDismiss={handleDismissSuggestion}
                    onAddAll={() => handleAddAllForMeal(items)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Meal Group Component
// =============================================================================
function MealGroup({
  mealName,
  date,
  items,
  processing,
  isAdmin,
  onAdd,
  onDismiss,
  onAddAll,
}: {
  mealName: string;
  date: string;
  items: MealShoppingSuggestion[];
  processing: Set<number>;
  isAdmin: boolean;
  onAdd: (item: MealShoppingSuggestion) => void;
  onDismiss: (item: MealShoppingSuggestion) => void;
  onAddAll: () => void;
}) {
  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
      {/* Meal Header */}
      <div className="p-3 bg-[var(--color-muted)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat size={18} className="text-[var(--color-primary)]" />
          <div>
            <p className="font-medium text-[var(--color-foreground)]">{mealName}</p>
            <p className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1">
              <Calendar size={12} />
              {date}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={onAddAll}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90 transition-colors flex items-center gap-1"
          >
            <Plus size={14} />
            Add All
          </button>
        )}
      </div>

      {/* Ingredients List */}
      <div className="divide-y divide-[var(--color-border)]">
        {items.map((item) => (
          <IngredientRow
            key={item.id}
            item={item}
            isProcessing={processing.has(item.id)}
            isAdmin={isAdmin}
            onAdd={() => onAdd(item)}
            onDismiss={() => onDismiss(item)}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Ingredient Row Component
// =============================================================================
function IngredientRow({
  item,
  isProcessing,
  isAdmin,
  onAdd,
  onDismiss,
}: {
  item: MealShoppingSuggestion;
  isProcessing: boolean;
  isAdmin: boolean;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  // Format quantity display
  const quantityDisplay = item.scaledQuantity
    ? `${item.scaledQuantity} ${item.unit || ''}`.trim()
    : `${item.quantity} ${item.unit || ''}`.trim();

  return (
    <div className="p-3 flex items-center gap-3 hover:bg-[var(--color-muted)]/50 transition-colors">
      {/* Ingredient info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--color-foreground)] truncate">{item.name}</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">{quantityDisplay}</p>
      </div>

      {/* Scaled indicator */}
      {item.scaledQuantity && item.scaledQuantity !== item.quantity && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
          Scaled
        </span>
      )}

      {/* Actions */}
      {isAdmin && (
        <div className="flex items-center gap-1">
          {isProcessing ? (
            <Loader2 size={18} className="animate-spin text-[var(--color-primary)]" />
          ) : (
            <>
              <button
                onClick={onDismiss}
                className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)] transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
              <button
                onClick={onAdd}
                className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-success)]/10 hover:text-[var(--color-success)] transition-colors"
                title="Add to list"
              >
                <Check size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
