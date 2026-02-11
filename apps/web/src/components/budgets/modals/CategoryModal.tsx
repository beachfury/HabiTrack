// Add/Edit Category Modal

import { useState, useEffect } from 'react';
import { X, FolderOpen, Palette, Check } from 'lucide-react';
import type { BudgetCategory, CreateCategoryData } from '../../../types/budget';

// Color palette
const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6b7280',
];

// Icon options (using lucide-react icon names)
const ICON_OPTIONS = [
  { name: 'home', label: 'Home' },
  { name: 'zap', label: 'Utilities' },
  { name: 'car', label: 'Car' },
  { name: 'utensils', label: 'Food' },
  { name: 'shield', label: 'Insurance' },
  { name: 'credit-card', label: 'Credit Card' },
  { name: 'piggy-bank', label: 'Savings' },
  { name: 'tv', label: 'Entertainment' },
  { name: 'user', label: 'Personal' },
  { name: 'users', label: 'Family' },
  { name: 'shopping-cart', label: 'Shopping' },
  { name: 'heart', label: 'Health' },
  { name: 'briefcase', label: 'Work' },
  { name: 'gift', label: 'Gifts' },
  { name: 'phone', label: 'Phone' },
  { name: 'wifi', label: 'Internet' },
  { name: 'plane', label: 'Travel' },
  { name: 'more-horizontal', label: 'Other' },
];

interface CategoryModalProps {
  category: BudgetCategory | null;
  onSave: (data: CreateCategoryData) => void;
  onClose: () => void;
}

export function CategoryModal({
  category,
  onSave,
  onClose,
}: CategoryModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    icon: string;
    color: string;
  }>({
    name: '',
    icon: 'folder',
    color: '#6366f1',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon || 'folder',
        color: category.color || '#6366f1',
      });
    }
  }, [category]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data: CreateCategoryData = {
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color,
      };

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
            <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {category ? 'Edit Category' : 'New Category'}
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
          {/* Preview */}
          <div className="flex items-center justify-center py-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${formData.color}20` }}
            >
              <FolderOpen className="w-8 h-8" style={{ color: formData.color }} />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Housing, Transportation, Food"
              className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Color
            </label>
            <div className="grid grid-cols-9 gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                    formData.color === color
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {formData.color === color && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: icon.name })}
                  className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    formData.icon === icon.name
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  title={icon.label}
                >
                  <FolderOpen
                    className="w-5 h-5"
                    style={{ color: formData.color }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                    {icon.label}
                  </span>
                </button>
              ))}
            </div>
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
              {submitting ? 'Saving...' : category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryModal;
