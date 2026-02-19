// Add/Edit Income Source Modal

import { useState, useEffect } from 'react';
import { DollarSign, Calendar } from 'lucide-react';
import type { IncomeDefinition, CreateIncomeData, IncomeType, IncomeFrequency } from '../../../types/budget';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';

interface AddIncomeModalProps {
  income: IncomeDefinition | null; // null = create, set = edit
  onSave: (data: CreateIncomeData) => void;
  onClose: () => void;
}

export function AddIncomeModal({
  income,
  onSave,
  onClose,
}: AddIncomeModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    amount: string;
    incomeType: IncomeType;
    frequency: IncomeFrequency;
    dayOfMonth: string;
    startDate: string;
    endDate: string;
  }>({
    name: '',
    description: '',
    amount: '',
    incomeType: 'salary',
    frequency: 'monthly',
    dayOfMonth: '',
    startDate: '',
    endDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (income) {
      setFormData({
        name: income.name,
        description: income.description || '',
        amount: income.amount.toString(),
        incomeType: income.incomeType,
        frequency: income.frequency,
        dayOfMonth: income.dayOfMonth?.toString() || '',
        startDate: income.startDate ? income.startDate.split('T')[0] : '',
        endDate: income.endDate ? income.endDate.split('T')[0] : '',
      });
    }
  }, [income]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.amount || parseFloat(formData.amount) < 0.01) {
      newErrors.amount = 'Please enter an amount of at least $0.01';
    }
    if (formData.dayOfMonth) {
      const day = parseInt(formData.dayOfMonth);
      if (day < 1 || day > 31) {
        newErrors.dayOfMonth = 'Day must be between 1 and 31';
      }
    }
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data: CreateIncomeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        amount: parseFloat(formData.amount),
        incomeType: formData.incomeType,
        frequency: formData.frequency,
        dayOfMonth: formData.dayOfMonth ? parseInt(formData.dayOfMonth) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

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
        form="income-form"
        disabled={submitting}
        className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving...' : income ? 'Update Income Source' : 'Create Income Source'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={income ? 'Edit Income Source' : 'New Income Source'}
      size="md"
      footer={footer}
    >
      <ModalBody>
        <form id="income-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Monthly Salary, Freelance Work"
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
              style={errors.name ? { borderColor: 'var(--color-destructive)' } : {}}
            />
            {errors.name && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.name}</p>
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
              placeholder="Add notes about this income source..."
              rows={2}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
            />
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
                min="0.01"
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

          {/* Income Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Income Type
            </label>
            <select
              value={formData.incomeType}
              onChange={(e) => setFormData({ ...formData, incomeType: e.target.value as IncomeType })}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
            >
              <option value="salary">Salary</option>
              <option value="bonus">Bonus</option>
              <option value="side-income">Side Income</option>
              <option value="investment">Investment</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as IncomeFrequency })}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
            >
              <option value="monthly">Monthly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
              <option value="one-time">One-time</option>
              <option value="irregular">Irregular</option>
            </select>
          </div>

          {/* Day of Month - only shown when frequency is monthly */}
          {formData.frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Day of Month (optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                  placeholder="Day of month (1-31)"
                  className="w-full pl-9 pr-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
                  style={errors.dayOfMonth ? { borderColor: 'var(--color-destructive)' } : {}}
                />
              </div>
              {errors.dayOfMonth && (
                <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.dayOfMonth}</p>
              )}
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Start Date (optional)
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              End Date (optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
              style={errors.endDate ? { borderColor: 'var(--color-destructive)' } : {}}
            />
            {errors.endDate && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.endDate}</p>
            )}
          </div>
        </form>
      </ModalBody>
    </ModalPortal>
  );
}

export default AddIncomeModal;
