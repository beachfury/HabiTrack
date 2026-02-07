// apps/web/src/components/chores/modals/CategoryModal.tsx
import { useState, useEffect } from 'react';
import { X, Folder } from 'lucide-react';
import { choresApi } from '../../../api';

import type { ChoreCategory } from '../../../types';
import ColorPicker from '../../common/ColorPicker';

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Folder size={20} className="text-purple-600" />
            {isEdit ? 'Edit Category' : 'New Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: form.color }} />
              <span className="font-medium text-gray-900 dark:text-white">
                {form.name || 'Category Name'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
