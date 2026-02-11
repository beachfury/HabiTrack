// Budgets Tab - List and manage budget items

import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Receipt,
  History,
  Filter,
  ChevronDown,
  ChevronUp,
  Wallet,
  Calendar,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import type { Budget, BudgetCategory } from '../../types/budget';

interface BudgetsTabProps {
  budgets: Budget[];
  categories: BudgetCategory[];
  onAddBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: number) => void;
  onAddEntry: (budgetId: number) => void;
}

export function BudgetsTab({
  budgets,
  categories,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  onAddEntry,
}: BudgetsTabProps) {
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'spent' | 'percent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedBudget, setExpandedBudget] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter and sort budgets
  const filteredBudgets = budgets
    .filter((b) => !filterCategory || b.categoryId === filterCategory)
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'amount':
          comparison = a.budgetAmount - b.budgetAmount;
          break;
        case 'spent':
          comparison = a.currentSpent - b.currentSpent;
          break;
        case 'percent':
          comparison = a.percentUsed - b.percentUsed;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Group budgets by category
  const budgetsByCategory = categories.reduce((acc, category) => {
    const categoryBudgets = filteredBudgets.filter((b) => b.categoryId === category.id);
    if (categoryBudgets.length > 0) {
      acc[category.id] = { category, budgets: categoryBudgets };
    }
    return acc;
  }, {} as Record<number, { category: BudgetCategory; budgets: Budget[] }>);

  const getPeriodLabel = (periodType: string) => {
    switch (periodType) {
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'one-time':
        return 'One-time';
      default:
        return periodType;
    }
  };

  const getStatusColor = (percentUsed: number) => {
    if (percentUsed > 100) return 'text-red-600 dark:text-red-400';
    if (percentUsed > 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressColor = (percentUsed: number) => {
    if (percentUsed > 100) return 'bg-red-500';
    if (percentUsed > 80) return 'bg-amber-500';
    return 'bg-green-500';
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

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Category filter */}
          <select
            value={filterCategory || ''}
            onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="amount">Sort by Amount</option>
            <option value="spent">Sort by Spent</option>
            <option value="percent">Sort by Usage</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            {sortOrder === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          onClick={onAddBudget}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Budget
        </button>
      </div>

      {/* Budgets Grid */}
      {Object.entries(budgetsByCategory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(budgetsByCategory).map(([categoryId, { category, budgets }]) => (
            <div key={categoryId}>
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color || '#6b7280' }}
                />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({budgets.length} budget{budgets.length !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Budget Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgets.map((budget) => (
                  <div
                    key={budget.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {budget.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                              {getPeriodLabel(budget.periodType)}
                            </span>
                            {budget.budgetType === 'bill' && budget.dueDay && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {budget.isPaidThisPeriod
                                  ? `Next: ${formatDueDate(getDueDate(budget, true)!)}`
                                  : `Due: ${formatDueDate(getDueDate(budget)!)}`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onAddEntry(budget.id)}
                            className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Record payment"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditBudget(budget)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Edit budget"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteBudget(budget.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Delete budget"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                      {/* Different display for bills vs spending budgets */}
                      {budget.budgetType === 'spending' ? (
                        <>
                          {/* Spending Budget - show percentage and progress */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(budget.budgetAmount)}
                            </span>
                            <span className={`text-lg font-semibold ${getStatusColor(budget.percentUsed)}`}>
                              {budget.percentUsed.toFixed(0)}%
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressColor(budget.percentUsed)}`}
                              style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                            />
                          </div>

                          {/* Stats */}
                          <div className="flex justify-between text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Spent</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(budget.currentSpent)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-500 dark:text-gray-400">Remaining</span>
                              <p className={`font-medium ${
                                budget.remainingAmount >= 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {formatCurrency(budget.remainingAmount)}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Bill - show paid/unpaid status */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(budget.budgetAmount)}
                            </span>
                            {budget.isPaidThisPeriod ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                <CheckCircle className="w-4 h-4" />
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                                Unpaid
                              </span>
                            )}
                          </div>

                          {/* Payment info for bills */}
                          {budget.isPaidThisPeriod && budget.currentSpent > 0 && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Paid: {formatCurrency(budget.currentSpent)}
                              {budget.currentSpent !== budget.budgetAmount && (
                                <span className="text-xs ml-1">
                                  (expected: {formatCurrency(budget.budgetAmount)})
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* Entry count and Pay button */}
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {budget.entryCount} entr{budget.entryCount === 1 ? 'y' : 'ies'} this period
                        </span>
                        {budget.budgetType === 'spending' ? (
                          <button
                            onClick={() => onAddEntry(budget.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Receipt className="w-4 h-4" />
                            Add Expense
                          </button>
                        ) : !budget.isPaidThisPeriod ? (
                          <button
                            onClick={() => onAddEntry(budget.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => onAddEntry(budget.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Receipt className="w-4 h-4" />
                            Add Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Budgets Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {filterCategory
              ? 'No budgets in this category. Try a different filter.'
              : 'Get started by creating your first budget.'}
          </p>
          <button
            onClick={onAddBudget}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Budget
          </button>
        </div>
      )}
    </div>
  );
}

export default BudgetsTab;
