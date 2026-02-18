// Add/Edit Budget Modal

import { useState, useEffect } from 'react';
import { Wallet, Calendar, DollarSign, FileText } from 'lucide-react';
import type { Budget, BudgetCategory, CreateBudgetData, PeriodType, BudgetType } from '../../../types/budget';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';

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

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 px-4 py-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-lg hover:opacity-80 transition-opacity"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="budget-form"
        disabled={submitting}
        className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving...' : budget ? 'Update Budget' : 'Create Budget'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={budget ? 'Edit Budget' : 'New Budget'}
      size="md"
      footer={footer}
    >
      <ModalBody>
        <form id="budget-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : '' })}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
              style={errors.categoryId ? { borderColor: 'var(--color-destructive)' } : {}}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.categoryId}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Budget Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Electric Bill, Car Insurance"
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
              style={errors.name ? { borderColor: 'var(--color-destructive)' } : {}}
            />
            {errors.name && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Budget Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Budget Type
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, budgetType: 'bill' })}
                className="flex-1 px-4 py-3 rounded-lg border-2 transition-colors text-left"
                style={
                  formData.budgetType === 'bill'
                    ? { borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }
                    : { borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }
                }
              >
                <div className="font-medium">Fixed Bill</div>
                <div className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  Electric, Insurance, etc.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, budgetType: 'spending' })}
                className="flex-1 px-4 py-3 rounded-lg border-2 transition-colors text-left"
                style={
                  formData.budgetType === 'spending'
                    ? { borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }
                    : { borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }
                }
              >
                <div className="font-medium">Spending Limit</div>
                <div className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  Groceries, Entertainment
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              {formData.budgetType === 'bill' ? 'Bill Amount' : 'Spending Limit'} *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.budgetAmount}
                onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
                style={errors.budgetAmount ? { borderColor: 'var(--color-destructive)' } : {}}
              />
            </div>
            {errors.budgetAmount && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.budgetAmount}</p>
            )}
          </div>

          {/* Period Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Period
            </label>
            <select
              value={formData.periodType}
              onChange={(e) => setFormData({ ...formData, periodType: e.target.value as PeriodType })}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
              <option value="one-time">One-time</option>
            </select>
          </div>

          {/* Due Day */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Due Day of Month (optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <input
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                placeholder="Day of month (1-31)"
                className="w-full pl-9 pr-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
                style={errors.dueDay ? { borderColor: 'var(--color-destructive)' } : {}}
              />
            </div>
            {errors.dueDay && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.dueDay}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes about this budget..."
              rows={2}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
            />
          </div>

          {/* Reason for change (when editing and amount changed) */}
          {budget && formData.budgetAmount !== budget.budgetAmount.toString() && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Reason for Change *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-[var(--color-muted-foreground)]" />
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Why is the budget amount changing?"
                  rows={2}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
                  style={errors.reason ? { borderColor: 'var(--color-destructive)' } : {}}
                />
              </div>
              {errors.reason && (
                <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.reason}</p>
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
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <label htmlFor="isRecurring" className="text-sm text-[var(--color-foreground)]">
              Recurring budget (renews each period)
            </label>
          </div>

        </form>
      </ModalBody>
    </ModalPortal>
  );
}

export default AddBudgetModal;
