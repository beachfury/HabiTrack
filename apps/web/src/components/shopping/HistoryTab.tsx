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
      <div className="themed-card p-8 text-center">
        <BarChart3 size={48} className="mx-auto mb-3 text-[var(--color-muted-foreground)]" />
        <p className="text-[var(--color-muted-foreground)]">Loading...</p>
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
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
            }`}
          >
            {days === 7 ? '7D' : days === 30 ? '30D' : days === 90 ? '3M' : '1Y'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="themed-card p-3">
          <p className="text-xs text-[var(--color-muted-foreground)]">Total Spent</p>
          <p className="text-xl font-bold text-[var(--color-success)]">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="themed-card p-3">
          <p className="text-xs text-[var(--color-muted-foreground)]">Purchases</p>
          <p className="text-xl font-bold text-[var(--color-info)]">{purchaseCount}</p>
        </div>
      </div>

      {/* Category Spending */}
      {analytics.categorySpending && analytics.categorySpending.length > 0 && (
        <div className="themed-card p-3">
          <h3 className="font-semibold text-[var(--color-foreground)] mb-2 text-sm">By Category</h3>
          <div className="space-y-2">
            {analytics.categorySpending.slice(0, 5).map((cat, i) => {
              const catTotal = Number(cat.total) || 0;
              const pct = totalSpent > 0 ? (catTotal / totalSpent) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-muted-foreground)] w-20 truncate">
                    {cat.categoryName || 'Uncategorized'}
                  </span>
                  <div className="flex-1 h-2 bg-[var(--color-muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] rounded-full"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--color-foreground)] w-16 text-right">
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
        className="w-full p-3 themed-card flex items-center justify-between"
      >
        <span className="font-medium text-[var(--color-foreground)] flex items-center gap-2">
          <History size={18} /> Purchase History
        </span>
        {showHistory ? <ChevronUp size={18} className="text-[var(--color-muted-foreground)]" /> : <ChevronDown size={18} className="text-[var(--color-muted-foreground)]" />}
      </button>

      {showHistory && purchaseHistory.length > 0 && (
        <div className="themed-card overflow-hidden max-h-64 overflow-y-auto">
          {purchaseHistory.map((p) => (
            <div
              key={p.id}
              className="p-2 flex items-center gap-2 border-b border-[var(--color-border)] last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-foreground)] truncate text-sm">
                  {p.itemName}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {new Date(p.purchasedAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-sm font-medium text-[var(--color-foreground)]">
                ${(Number(p.totalPrice) || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
