// apps/web/src/components/chores/modals/CategoryModal.tsx
import { useState, useEffect } from 'react';
import { choresApi } from '../../../api';

import type { ChoreCategory } from '../../../types';
import ColorPicker from '../../common/ColorPicker';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';

interface CategoryModalProps {
  category?: ChoreCategory | null; // If provided, edit mode
  onSuccess: () => void;
  onClose: () => void;
}

export function CategoryModal({ category, onSuccess, onClose }: CategoryModalProps) {
  const isEdit = !!category;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    icon: 'box',
    color: '#6b7280',
  });

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        icon: category.icon || 'box',
        color: category.color || '#6b7280',
      });
    }
  }, [category]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEdit && category) {
        await choresApi.updateCategory(category.id, {
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
        });
      } else {
        await choresApi.createCategory({
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save category';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={onClose}
        className="flex-1 py-2 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] rounded-xl font-medium hover:opacity-80 transition-opacity"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex-1 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Category' : 'New Category'}
      size="md"
      footer={footer}
    >
      <ModalBody>
        <div className="space-y-4">
          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
                color: 'var(--color-destructive)',
                border: '1px solid',
              }}
            >
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="e.g., Kitchen, Bedroom, Outdoor"
            />
          </div>

          {/* Color - Using the new ColorPicker */}
          <ColorPicker
            color={form.color}
            onChange={(color: any) => setForm({ ...form, color })}
            label="Color"
          />

          {/* Preview */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Preview
            </label>
            <div className="flex items-center gap-2 p-3 bg-[var(--color-muted)] rounded-xl">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: form.color }} />
              <span className="font-medium text-[var(--color-foreground)]">
                {form.name || 'Category Name'}
              </span>
            </div>
          </div>
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
