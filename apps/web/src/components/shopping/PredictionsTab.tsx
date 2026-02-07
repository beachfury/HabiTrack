// apps/web/src/components/shopping/PredictionsTab.tsx
import { useState } from 'react';
import { Plus, X, Sparkles, Store, Clock, TrendingUp, Calendar, DollarSign } from 'lucide-react';
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
  } | null;
  onAdd: (catalogItemId: number, quantity?: number, storeId?: number | null) => void;
  onDismiss: (catalogItemId: number) => void;
  onAddAll: (confidenceLevel?: string) => void;
  isAdmin: boolean;
}

type FilterType = 'all' | 'high' | 'due_this_week' | 'overdue';

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

  // Debug logging
  console.log('PredictionsTab received:', {
    suggestionsCount: suggestions.length,
    suggestions: suggestions.map((s) => ({
      id: s.catalogItemId,
      name: s.itemName,
      confidence: s.confidence,
    })),
    dueThisWeekCount: dueThisWeek.length,
    stats,
  });

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
    // Overdue = high confidence items
    filteredSuggestions = filteredSuggestions.filter((s) => s.confidence === 'high');
  }
  // 'all' filter shows everything (no additional filtering)

  // Calculate visible counts (excluding dismissed)
  const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.catalogItemId));
  const visibleDueThisWeek = dueThisWeek.filter((s) => !dismissed.has(s.catalogItemId));
  const visibleHighConfidence = visibleSuggestions.filter((s) => s.confidence === 'high').length;
  const visibleMediumConfidence = visibleSuggestions.filter(
    (s) => s.confidence === 'medium',
  ).length;
  const visibleLowConfidence = visibleSuggestions.filter((s) => s.confidence === 'low').length;

  if (suggestions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
        <Sparkles size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400 mb-2">No predictions yet</p>
        <p className="text-sm text-gray-400">Keep shopping and we'll learn your patterns!</p>
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            💡 <strong>Tip:</strong> The more you shop, the smarter predictions become. We need at
            least 2 purchases of an item to predict when you'll need it again.
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <Clock size={16} />
              <span className="text-xs font-medium">Overdue</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {visibleHighConfidence}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <Calendar size={16} />
              <span className="text-xs font-medium">Due Soon</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {visibleMediumConfidence}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs font-medium">This Week</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {visibleDueThisWeek.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Sparkles size={16} />
              <span className="text-xs font-medium">Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {visibleSuggestions.length}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {[
          {
            id: 'all',
            label: 'All',
            count: suggestions.filter((s) => !dismissed.has(s.catalogItemId)).length,
          },
          {
            id: 'overdue',
            label: 'Overdue',
            count: suggestions.filter(
              (s) => !dismissed.has(s.catalogItemId) && s.confidence === 'high',
            ).length,
          },
          {
            id: 'due_this_week',
            label: 'This Week',
            count: dueThisWeek.filter((s) => !dismissed.has(s.catalogItemId)).length,
          },
          {
            id: 'high',
            label: 'High Priority',
            count: suggestions.filter(
              (s) => !dismissed.has(s.catalogItemId) && s.confidence === 'high',
            ).length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              filter === tab.id
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.id
                  ? 'bg-purple-400 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
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
            className="px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1 text-sm"
          >
            <Plus size={14} /> Add Overdue
          </button>
          <button
            onClick={() => onAddAll('medium')}
            className="px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-1 text-sm"
          >
            <Plus size={14} /> Add All Due
          </button>
        </div>
      )}

      {/* Suggestions List */}
      <div className="space-y-2">
        {filteredSuggestions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-500">No items match this filter</p>
          </div>
        ) : (
          filteredSuggestions.map((s) => (
            <div
              key={s.catalogItemId}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-3 ${
                s.confidence === 'high'
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                  : s.confidence === 'medium'
                    ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10'
                    : 'border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <ItemImage url={s.imageUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {s.itemName}
                    </p>
                    <ConfidenceBadge level={s.confidence} />
                  </div>

                  {s.brand && <p className="text-xs text-gray-500 mb-1">{s.brand}</p>}

                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">{s.reason}</p>

                  {/* Enhanced info row */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {s.suggestedQuantity && s.suggestedQuantity > 1 && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        Qty: {s.suggestedQuantity}
                      </span>
                    )}
                    {s.suggestedStoreName && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
                        <Store size={12} />
                        {s.suggestedStoreName}
                      </span>
                    )}
                    {s.bestPrice && (
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center gap-1">
                        <DollarSign size={12} />${Number(s.bestPrice).toFixed(2)}
                      </span>
                    )}
                    {s.categoryName && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
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
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      title={`Add ${s.suggestedQuantity || 1} to list`}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(s.catalogItemId)}
                    className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
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
