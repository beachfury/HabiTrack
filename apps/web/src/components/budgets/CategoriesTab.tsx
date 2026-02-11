// Categories Tab - Manage budget categories

import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  Palette,
  GripVertical,
} from 'lucide-react';
import type { Budget, BudgetCategory } from '../../types/budget';

// Icon options from lucide-react
const ICON_OPTIONS = [
  'home', 'zap', 'car', 'utensils', 'shield', 'credit-card',
  'piggy-bank', 'tv', 'user', 'users', 'more-horizontal',
  'shopping-cart', 'heart', 'briefcase', 'gift', 'phone',
  'wifi', 'plane', 'music', 'book', 'camera', 'coffee',
];

// Color palette
const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6b7280',
];

interface CategoriesTabProps {
  categories: BudgetCategory[];
  budgets: Budget[];
  onAddCategory: () => void;
  onEditCategory: (category: BudgetCategory) => void;
  onDeleteCategory: (id: number) => void;
}

export function CategoriesTab({
  categories,
  budgets,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoriesTabProps) {
  // Get budget count per category
  const getBudgetCount = (categoryId: number) => {
    return budgets.filter((b) => b.categoryId === categoryId).length;
  };

  // Get total budget amount per category
  const getTotalBudget = (categoryId: number) => {
    return budgets
      .filter((b) => b.categoryId === categoryId)
      .reduce((sum, b) => sum + b.budgetAmount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Budget Categories
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Organize your budgets into categories
          </p>
        </div>
        <button
          onClick={onAddCategory}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const budgetCount = getBudgetCount(category.id);
            const totalBudget = getTotalBudget(category.id);

            return (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group"
              >
                {/* Color bar */}
                <div
                  className="h-2"
                  style={{ backgroundColor: category.color || '#6b7280' }}
                />

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` || '#6b728020' }}
                      >
                        <FolderOpen
                          className="w-5 h-5"
                          style={{ color: category.color || '#6b7280' }}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {category.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {budgetCount} budget{budgetCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditCategory(category)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Edit category"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(category.id)}
                        disabled={budgetCount > 0}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title={budgetCount > 0 ? 'Cannot delete - has budgets' : 'Delete category'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  {budgetCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Total Budget</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(totalBudget)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Categories Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create categories to organize your budgets
          </p>
          <button
            onClick={onAddCategory}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Category
          </button>
        </div>
      )}

      {/* Color Legend */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Available Colors
        </h4>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <div
              key={color}
              className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategoriesTab;
