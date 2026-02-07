// apps/web/src/components/shopping/HistoryTab.tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, History, BarChart3 } from 'lucide-react';
import type { AnalyticsData, PurchaseHistory } from '../../types';

interface HistoryTabProps {
  analytics: AnalyticsData | null;
  purchaseHistory: PurchaseHistory[];
  onPeriodChange: (days: number) => void;
}

export function HistoryTab({ analytics, purchaseHistory, onPeriodChange }: HistoryTabProps) {
  const [period, setPeriod] = useState(30);
  const [showHistory, setShowHistory] = useState(false);

  const handlePeriodChange = (days: number) => {
    setPeriod(days);
    onPeriodChange(days);
  };

  if (!analytics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
        <BarChart3 size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  // Convert to numbers to handle string values from API
  const totalSpent = Number(analytics.totalSpent) || 0;
  const purchaseCount = Number(analytics.purchaseCount) || 0;

  return (
    <div className="space-y-3">
      {/* Period Selector */}
      <div className="flex gap-1 overflow-x-auto">
        {[7, 30, 90, 365].map((days) => (
          <button
            key={days}
            onClick={() => handlePeriodChange(days)}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              period === days
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {days === 7 ? '7D' : days === 30 ? '30D' : days === 90 ? '3M' : '1Y'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500">Total Spent</p>
          <p className="text-xl font-bold text-green-600">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500">Purchases</p>
          <p className="text-xl font-bold text-blue-600">{purchaseCount}</p>
        </div>
      </div>

      {/* Category Spending */}
      {analytics.categorySpending && analytics.categorySpending.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">By Category</h3>
          <div className="space-y-2">
            {analytics.categorySpending.slice(0, 5).map((cat, i) => {
              const catTotal = Number(cat.total) || 0;
              const pct = totalSpent > 0 ? (catTotal / totalSpent) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20 truncate">
                    {cat.categoryName || 'Uncategorized'}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white w-16 text-right">
                    ${catTotal.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Purchase History Toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between"
      >
        <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <History size={18} /> Purchase History
        </span>
        {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {showHistory && purchaseHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-64 overflow-y-auto">
          {purchaseHistory.map((p) => (
            <div
              key={p.id}
              className="p-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                  {p.itemName}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(p.purchasedAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                ${(Number(p.totalPrice) || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
