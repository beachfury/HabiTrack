// Add/Edit Income Entry Modal - Record received income

import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import type { IncomeDefinition, IncomeEntry, CreateIncomeEntryData } from '../../../types/budget';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';

interface AddIncomeEntryModalProps {
  incomeSources: IncomeDefinition[];
  entry: IncomeEntry | null; // null = create, set = edit
  preselectedIncomeId?: number;
  onSave: (data: CreateIncomeEntryData) => void;
  onClose: () => void;
}

export function AddIncomeEntryModal({
  incomeSources,
  entry,
  preselectedIncomeId,
  onSave,
  onClose,
}: AddIncomeEntryModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<{
    incomeId: number | '';
    amount: string;
    receivedDate: string;
    notes: string;
  }>({
    incomeId: preselectedIncomeId || '',
    amount: '',
    receivedDate: today,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (entry) {
      setFormData({
        incomeId: entry.incomeId,
        amount: entry.amount.toString(),
        receivedDate: entry.receivedDate ? entry.receivedDate.split('T')[0] : today,
        notes: entry.notes || '',
      });
    }
  }, [entry]);

  // Pre-fill amount when income source is selected
  useEffect(() => {
    if (formData.incomeId && !entry) {
      const source = incomeSources.find((s) => s.id === formData.incomeId);
      if (source) {
        setFormData((prev) => ({ ...prev, amount: source.amount.toString() }));
      }
    }
  }, [formData.incomeId, incomeSources, entry]);

  // Set preselected income ID and pre-fill amount on mount
  useEffect(() => {
    if (preselectedIncomeId && !entry) {
      const source = incomeSources.find((s) => s.id === preselectedIncomeId);
      if (source) {
        setFormData((prev) => ({
          ...prev,
          incomeId: preselectedIncomeId,
          amount: source.amount.toString(),
        }));
      }
    }
  }, [preselectedIncomeId, incomeSources, entry]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.incomeId) {
      newErrors.incomeId = 'Please select an income source';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    if (!formData.receivedDate) {
      newErrors.receivedDate = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data: CreateIncomeEntryData = {
        incomeId: formData.incomeId as number,
        amount: parseFloat(formData.amount),
        receivedDate: formData.receivedDate,
        notes: formData.notes.trim() || undefined,
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
        form="income-entry-form"
        disabled={submitting}
        className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving...' : entry ? 'Update Entry' : 'Record Income'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={entry ? 'Edit Income Entry' : 'Record Income'}
      size="md"
      footer={footer}
    >
      <ModalBody>
        <form id="income-entry-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Income Source */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Income Source *
            </label>
            <select
              value={formData.incomeId}
              onChange={(e) => setFormData({ ...formData, incomeId: e.target.value ? Number(e.target.value) : '' })}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
              style={errors.incomeId ? { borderColor: 'var(--color-destructive)' } : {}}
            >
              <option value="">Select an income source</option>
              {incomeSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
            {errors.incomeId && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.incomeId}</p>
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

          {/* Received Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Received Date *
            </label>
            <input
              type="date"
              value={formData.receivedDate}
              onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
              style={errors.receivedDate ? { borderColor: 'var(--color-destructive)' } : {}}
            />
            {errors.receivedDate && (
              <p className="text-[var(--color-destructive)] text-sm mt-1">{errors.receivedDate}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this payment..."
              rows={3}
              className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)]"
            />
          </div>
        </form>
      </ModalBody>
    </ModalPortal>
  );
}

export default AddIncomeEntryModal;
