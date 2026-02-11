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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Budget</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(summary?.totalBudgeted || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Spent This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(summary?.totalSpent || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
              <p className={`text-2xl font-bold mt-1 ${
                (summary?.remainingBudget || 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(summary?.remainingBudget || 0)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              (summary?.remainingBudget || 0) >= 0
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {(summary?.remainingBudget || 0) >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Budget Used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {(summary?.percentUsed || 0).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Wallet className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (summary?.percentUsed || 0) > 100
                  ? 'bg-red-500'
                  : (summary?.percentUsed || 0) > 80
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(summary?.percentUsed || 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alert Section - Unpaid Bills and Over-Budget Spending */}
      {(unpaidBills.length > 0 || alertBudgets.length > 0) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              Needs Attention
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Unpaid Bills */}
            {unpaidBills.slice(0, 3).map((budget) => (
              <div
                key={budget.id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: budget.categoryColor || '#6b7280' }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {budget.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Unpaid
                </span>
              </div>
            ))}
            {/* Over-budget Spending */}
            {alertBudgets.slice(0, 3).map((budget) => (
              <div
                key={budget.id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-700"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: budget.categoryColor || '#6b7280' }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {budget.name}
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  budget.percentUsed > 100 ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {budget.percentUsed.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Budgets */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Active Budgets</h3>
            <button
              onClick={onRefresh}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {budgets.slice(0, 5).map((budget) => (
              <div key={budget.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: budget.categoryColor || '#6b7280' }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {budget.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAddEntry(budget.id)}
                      className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                      title="Record payment"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditBudget(budget)}
                      className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                      title="Edit budget"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {budget.budgetType === 'spending' ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatCurrency(budget.currentSpent)} / {formatCurrency(budget.budgetAmount)}
                      </span>
                      <span className={`font-medium ${
                        budget.percentUsed > 100
                          ? 'text-red-600'
                          : budget.percentUsed > 80
                          ? 'text-amber-600'
                          : 'text-green-600'
                      }`}>
                        {budget.percentUsed.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          budget.percentUsed > 100
                            ? 'bg-red-500'
                            : budget.percentUsed > 80
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatCurrency(budget.budgetAmount)}
                    </span>
                    {budget.isPaidThisPeriod ? (
                      // Show next due date for paid bills
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        {budget.dueDay ? `Next: ${formatDueDate(getDueDate(budget, true)!)}` : 'Paid'}
                      </span>
                    ) : (
                      // Show due date for unpaid bills
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                        {budget.dueDay ? `Due: ${formatDueDate(getDueDate(budget)!)}` : 'Unpaid'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {budgets.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No budgets set up yet</p>
                <p className="text-sm">Create your first budget to start tracking</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Payments</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${entry.categoryColor}20` || '#6b728020' }}
                    >
                      <Receipt className="w-5 h-5" style={{ color: entry.categoryColor || '#6b7280' }} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {entry.vendor || entry.description || entry.budgetName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.budgetName} &bull; {formatDate(entry.transactionDate)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    -{formatCurrency(entry.amount)}
                  </span>
                </div>
              </div>
            ))}
            {recentEntries.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
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
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {summary.topCategory.name}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400">
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
