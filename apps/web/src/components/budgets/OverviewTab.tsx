// Budget Overview Tab - Summary cards and quick stats

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Target,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  RefreshCw,
} from 'lucide-react';
import type { Budget, BudgetEntry, BudgetCategory, BudgetSummary } from '../../types/budget';

interface OverviewTabProps {
  summary: BudgetSummary | null;
  budgets: Budget[];
  recentEntries: BudgetEntry[];
  categories: BudgetCategory[];
  onAddEntry: (budgetId: number) => void;
  onEditBudget: (budget: Budget) => void;
  onRefresh: () => void;
}

export function OverviewTab({
  summary,
  budgets,
  recentEntries,
  categories,
  onAddEntry,
  onEditBudget,
  onRefresh,
}: OverviewTabProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate due date for a bill
  const getDueDate = (budget: Budget, getNext: boolean = false) => {
    if (!budget.dueDay) return null;

    const now = new Date();
    let dueDate = new Date(now.getFullYear(), now.getMonth(), budget.dueDay);

    // If we need next due date (bill is paid) or if due date already passed
    if (getNext || (budget.isPaidThisPeriod && dueDate <= now)) {
      // Move to next period
      if (budget.periodType === 'monthly') {
        dueDate.setMonth(dueDate.getMonth() + 1);
      } else if (budget.periodType === 'yearly') {
        dueDate.setFullYear(dueDate.getFullYear() + 1);
      } else if (budget.periodType === 'weekly') {
        dueDate.setDate(dueDate.getDate() + 7);
      }
    }

    return dueDate;
  };

  const formatDueDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get spending budgets that are over or close to limit (only applies to spending type)
  const alertBudgets = budgets.filter((b) => b.budgetType === 'spending' && b.percentUsed >= 80);
  // Get bills that are unpaid
  const unpaidBills = budgets.filter((b) => b.budgetType === 'bill' && !b.isPaidThisPeriod);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budgeted */}
        <div className="themed-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">Monthly Budget</p>
              <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">
                {formatCurrency(summary?.totalBudgeted || 0)}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}>
              <Target className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="themed-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">Spent This Month</p>
              <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">
                {formatCurrency(summary?.totalSpent || 0)}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)' }}>
              <Receipt className="w-6 h-6 text-[var(--color-info)]" />
            </div>
          </div>
        </div>

        {/* Remaining */}
        <div className="themed-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">Remaining</p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ color: (summary?.remainingBudget || 0) >= 0 ? 'var(--color-success)' : 'var(--color-destructive)' }}
              >
                {formatCurrency(summary?.remainingBudget || 0)}
              </p>
            </div>
            <div
              className="p-3 rounded-full"
              style={{
                backgroundColor: (summary?.remainingBudget || 0) >= 0
                  ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                  : 'color-mix(in srgb, var(--color-destructive) 15%, transparent)'
              }}
            >
              {(summary?.remainingBudget || 0) >= 0 ? (
                <TrendingUp className="w-6 h-6 text-[var(--color-success)]" />
              ) : (
                <TrendingDown className="w-6 h-6 text-[var(--color-destructive)]" />
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="themed-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">Budget Used</p>
              <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">
                {(summary?.percentUsed || 0).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' }}>
              <Wallet className="w-6 h-6 text-[var(--color-warning)]" />
            </div>
          </div>
          <div className="mt-3 bg-[var(--color-muted)] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(summary?.percentUsed || 0, 100)}%`,
                backgroundColor: (summary?.percentUsed || 0) > 100 ? 'var(--color-destructive)' : (summary?.percentUsed || 0) > 80 ? 'var(--color-warning)' : 'var(--color-success)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Alert Section - Unpaid Bills and Over-Budget Spending */}
      {(unpaidBills.length > 0 || alertBudgets.length > 0) && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
            border: '1px solid',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
            <h3 className="font-semibold text-[var(--color-warning)]">
              Needs Attention
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Unpaid Bills */}
            {unpaidBills.slice(0, 3).map((budget) => (
              <div
                key={budget.id}
                className="flex items-center justify-between bg-[var(--color-card)] rounded-lg p-3"
                style={{ borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)', border: '1px solid' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: budget.categoryColor || '#6b7280' }}
                  />
                  <span className="font-medium text-[var(--color-foreground)] text-sm">
                    {budget.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-[var(--color-warning)]">
                  Unpaid
                </span>
              </div>
            ))}
            {/* Over-budget Spending */}
            {alertBudgets.slice(0, 3).map((budget) => (
              <div
                key={budget.id}
                className="flex items-center justify-between bg-[var(--color-card)] rounded-lg p-3"
                style={{ borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)', border: '1px solid' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: budget.categoryColor || '#6b7280' }}
                  />
                  <span className="font-medium text-[var(--color-foreground)] text-sm">
                    {budget.name}
                  </span>
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: budget.percentUsed > 100 ? 'var(--color-destructive)' : 'var(--color-warning)' }}
                >
                  {budget.percentUsed.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Budgets */}
        <div className="themed-card rounded-xl shadow-sm">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-foreground)]">Active Budgets</h3>
            <button
              onClick={onRefresh}
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {budgets.slice(0, 5).map((budget) => (
              <div key={budget.id} className="p-4 hover:bg-[var(--color-muted)]/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: budget.categoryColor || '#6b7280' }}
                    />
                    <span className="font-medium text-[var(--color-foreground)]">
                      {budget.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAddEntry(budget.id)}
                      className="p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-success)]"
                      title="Record payment"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditBudget(budget)}
                      className="p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
                      title="Edit budget"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {budget.budgetType === 'spending' ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-muted-foreground)]">
                        {formatCurrency(budget.currentSpent)} / {formatCurrency(budget.budgetAmount)}
                      </span>
                      <span
                        className="font-medium"
                        style={{
                          color: budget.percentUsed > 100 ? 'var(--color-destructive)' : budget.percentUsed > 80 ? 'var(--color-warning)' : 'var(--color-success)'
                        }}
                      >
                        {budget.percentUsed.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 bg-[var(--color-muted)] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(budget.percentUsed, 100)}%`,
                          backgroundColor: budget.percentUsed > 100 ? 'var(--color-destructive)' : budget.percentUsed > 80 ? 'var(--color-warning)' : 'var(--color-success)'
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-muted-foreground)]">
                      {formatCurrency(budget.budgetAmount)}
                    </span>
                    {budget.isPaidThisPeriod ? (
                      // Show next due date for paid bills
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }}
                      >
                        <CheckCircle className="w-3 h-3" />
                        {budget.dueDay ? `Next: ${formatDueDate(getDueDate(budget, true)!)}` : 'Paid'}
                      </span>
                    ) : (
                      // Show due date for unpaid bills
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }}
                      >
                        {budget.dueDay ? `Due: ${formatDueDate(getDueDate(budget)!)}` : 'Unpaid'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {budgets.length === 0 && (
              <div className="p-8 text-center text-[var(--color-muted-foreground)]">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No budgets set up yet</p>
                <p className="text-sm">Create your first budget to start tracking</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="themed-card rounded-xl shadow-sm">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="font-semibold text-[var(--color-foreground)]">Recent Payments</h3>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-[var(--color-muted)]/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${entry.categoryColor}20` || '#6b728020' }}
                    >
                      <Receipt className="w-5 h-5" style={{ color: entry.categoryColor || '#6b7280' }} />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-foreground)]">
                        {entry.vendor || entry.description || entry.budgetName}
                      </p>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {entry.budgetName} &bull; {formatDate(entry.transactionDate)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    -{formatCurrency(entry.amount)}
                  </span>
                </div>
              </div>
            ))}
            {recentEntries.length === 0 && (
              <div className="p-8 text-center text-[var(--color-muted-foreground)]">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No entries yet</p>
                <p className="text-sm">Add your first expense to start tracking</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Category */}
      {summary?.topCategory && (
        <div className="themed-card rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-[var(--color-foreground)] mb-4">
            Top Spending Category
          </h3>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${summary.topCategory.color}20` }}
            >
              <Wallet className="w-8 h-8" style={{ color: summary.topCategory.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-foreground)]">
                {summary.topCategory.name}
              </p>
              <p className="text-lg text-[var(--color-muted-foreground)]">
                {formatCurrency(summary.topCategory.total)} this month
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OverviewTab;
