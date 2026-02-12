// Add/Edit Entry Modal

import { useState, useEffect } from 'react';
import { Receipt, DollarSign, Calendar, Store, FileText } from 'lucide-react';
import type { Budget, BudgetEntry, CreateEntryData } from '../../../types/budget';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';

interface AddEntryModalProps {
  budgets: Budget[];
  entry: BudgetEntry | null;
  preselectedBudgetId: number | null;
  onSave: (data: CreateEntryData) => void;
  onClose: () => void;
}

export function AddEntryModal({
  budgets,
  entry,
  preselectedBudgetId,
  onSave,
  onClose,
}: AddEntryModalProps) {
  const [formData, setFormData] = useState<{
    budgetId: number | '';
    amount: string;
    description: string;
    transactionDate: string;
    paymentMethod: string;
    vendor: string;
    notes: string;
  }>({
    budgetId: preselectedBudgetId || '',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    vendor: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (entry) {
      setFormData({
        budgetId: entry.budgetId,
        amount: entry.amount.toString(),
        description: entry.description || '',
        transactionDate: entry.transactionDate,
        paymentMethod: entry.paymentMethod || '',
        vendor: entry.vendor || '',
        notes: entry.notes || '',
      });
    }
  }, [entry]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.budgetId) {
      newErrors.budgetId = 'Please select a budget';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data: CreateEntryData = {
        budgetId: formData.budgetId as number,
        amount: parseFloat(formData.amount),
        description: formData.description.trim() || undefined,
        transactionDate: formData.transactionDate,
        paymentMethod: formData.paymentMethod.trim() || undefined,
        vendor: formData.vendor.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await onSave(data);
    } finally {
      setSubmitting(false);
    }
  };

  // Get selected budget info
  const selectedBudget = budgets.find((b) => b.id === formData.budgetId);

  // Common payment methods
  const paymentMethods = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'Check',
    'Auto-Pay',
    'PayPal',
    'Venmo',
    'Other',
  ];

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
        form="entry-form"
        disabled={submitting}
        className="flex-1 px-4 py-2 bg-[var(--color-success)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving...' : entry ? 'Update Entry' : 'Add Entry'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={entry ? 'Edit Entry' : 'Add Expense'}
      size="md"
      footer={footer}
    >
      <ModalBody>
        <form id="entry-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Budget *
            </label>
            <select
              value={formData.budgetId}
              onChange={(e) => setFormData({ ...formData, budgetId: e.target.value ? Number(e.target.value) : '' })}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
              style={errors.budgetId ? { borderColor: 'var(--color-destructive)' } : {}}
            >
              <option value="">Select a budget</option>
              {budgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.name} ({budget.categoryName})
                </option>
              ))}
            </select>
            {errors.budgetId && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.budgetId}</p>
            )}
            {selectedBudget && (
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Remaining: ${Number(selectedBudget.remainingAmount || 0).toFixed(2)} of ${Number(selectedBudget.budgetAmount || 0).toFixed(2)}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
                style={errors.amount ? { borderColor: 'var(--color-destructive)' } : {}}
              />
            </div>
            {errors.amount && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
                style={errors.transactionDate ? { borderColor: 'var(--color-destructive)' } : {}}
              />
            </div>
            {errors.transactionDate && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.transactionDate}</p>
            )}
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Vendor/Merchant (optional)
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g., Duke Energy, Shell, Walmart"
                className="w-full pl-9 pr-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Payment Method (optional)
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
            >
              <option value="">Select method</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the expense"
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Notes (optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-[var(--color-muted-foreground)]" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
                className="w-full pl-9 pr-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
              />
            </div>
          </div>
        </form>
      </ModalBody>
    </ModalPortal>
  );
}

export default AddEntryModal;
