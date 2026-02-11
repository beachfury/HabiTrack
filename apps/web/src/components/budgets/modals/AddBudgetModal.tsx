// Add/Edit Budget Modal

import { useState, useEffect } from 'react';
import { X, Wallet, Calendar, DollarSign, FileText } from 'lucide-react';
import type { Budget, BudgetCategory, CreateBudgetData, PeriodType, BudgetType } from '../../../types/budget';

interface AddBudgetModalProps {
  categories: BudgetCategory[];
  budget: Budget | null;
  onSave: (data: CreateBudgetData & { reason?: string }) => void;
  onClose: () => void;
}

export function AddBudgetModal({
  categories,
  budget,
  onSave,
  onClose,
}: AddBudgetModalProps) {
  const [formData, setFormData] = useState<{
    categoryId: number | '';
    name: string;
    description: string;
    budgetAmount: string;
    budgetType: BudgetType;
    periodType: PeriodType;
    isRecurring: boolean;
    dueDay: string;
    reason: string;
  }>({
    categoryId: '',
    name: '',
    description: '',
    budgetAmount: '',
    budgetType: 'bill',
    periodType: 'monthly',
    isRecurring: true,
    dueDay: '',
    reason: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (budget) {
      setFormData({
        categoryId: budget.categoryId,
        name: budget.name,
        description: budget.description || '',
        budgetAmount: budget.budgetAmount.toString(),
        budgetType: budget.budgetType || 'bill',
        periodType: budget.periodType,
        isRecurring: budget.isRecurring,
        dueDay: budget.dueDay?.toString() || '',
        reason: '',
      });
    }
  }, [budget]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.budgetAmount || parseFloat(formData.budgetAmount) <= 0) {
      newErrors.budgetAmount = 'Please enter a valid amount';
    }
    if (formData.dueDay) {
      const day = parseInt(formData.dueDay);
      if (day < 1 || day > 31) {
        newErrors.dueDay = 'Day must be between 1 and 31';
      }
    }
    // Require reason when editing and amount changed
    if (budget && formData.budgetAmount !== budget.budgetAmount.toString() && !formData.reason.trim()) {
      newErrors.reason = 'Please provide a reason for the amount change';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data: CreateBudgetData & { reason?: string } = {
        categoryId: formData.categoryId as number,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        budgetAmount: parseFloat(formData.budgetAmount),
        budgetType: formData.budgetType,
        periodType: formData.periodType,
        isRecurring: formData.isRecurring,
        dueDay: formData.dueDay ? parseInt(formData.dueDay) : undefined,
      };

      if (budget && formData.reason.trim()) {
        data.reason = formData.reason.trim();
      }

      await onSave(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {budget ? 'Edit Budget' : 'New Budget'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : '' })}
              className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                errors.categoryId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Electric Bill, Car Insurance"
              className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Budget Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Budget Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, budgetType: 'bill' })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  formData.budgetType === 'bill'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="font-medium">Fixed Bill</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Electric, Insurance, etc.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, budgetType: 'spending' })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  formData.budgetType === 'spending'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="font-medium">Spending Limit</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Groceries, Entertainment
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {formData.budgetType === 'bill' ? 'Bill Amount' : 'Spending Limit'} *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.budgetAmount}
                onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                placeholder="0.00"
                className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                  errors.budgetAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.budgetAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.budgetAmount}</p>
            )}
          </div>

          {/* Period Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Period
            </label>
            <select
              value={formData.periodType}
              onChange={(e) => setFormData({ ...formData, periodType: e.target.value as PeriodType })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
              <option value="one-time">One-time</option>
            </select>
          </div>

          {/* Due Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Day of Month (optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                placeholder="Day of month (1-31)"
                className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                  errors.dueDay ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.dueDay && (
              <p className="text-red-500 text-sm mt-1">{errors.dueDay}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes about this budget..."
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Reason for change (when editing and amount changed) */}
          {budget && formData.budgetAmount !== budget.budgetAmount.toString() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason for Change *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Why is the budget amount changing?"
                  rows={2}
                  className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                    errors.reason ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
              )}
            </div>
          )}

          {/* Recurring checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="isRecurring" className="text-sm text-gray-700 dark:text-gray-300">
              Recurring budget (renews each period)
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : budget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddBudgetModal;
