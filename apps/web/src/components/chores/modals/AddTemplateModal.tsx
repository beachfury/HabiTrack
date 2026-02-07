// apps/web/src/components/chores/modals/AddTemplateModal.tsx
import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { choresApi } from '../../../api';
import type { ChoreCategory, ChoreTemplate } from '../../../types';

type Difficulty = 'easy' | 'medium' | 'hard';

interface AddTemplateModalProps {
  categories: ChoreCategory[];
  template?: ChoreTemplate | null; // If provided, edit mode
  onSuccess: () => void;
  onClose: () => void;
}

export function AddTemplateModal({
  categories,
  template,
  onSuccess,
  onClose,
}: AddTemplateModalProps) {
  const isEdit = !!template;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    difficulty: 'medium' as Difficulty,
    defaultPoints: '10',
    estimatedMinutes: '',
    requiresPhoto: false,
    requireApproval: false,
  });

  useEffect(() => {
    if (template) {
      setForm({
        name: String(template.name || ''),
        description: String(template.description || ''),
        categoryId: template.categoryId ? String(template.categoryId) : '',
        difficulty: (template.difficulty || 'medium') as Difficulty,
        defaultPoints: String(template.defaultPoints || 10),
        estimatedMinutes: template.estimatedMinutes ? String(template.estimatedMinutes) : '',
        requiresPhoto: Boolean((template as any).requiresPhoto),
        requireApproval: Boolean((template as any).requireApproval),
      });
    }
  }, [template]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const data = {
        title: form.name.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        difficulty: form.difficulty,
        defaultPoints: Number(form.defaultPoints) || 10,
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
        requiresPhoto: form.requiresPhoto,
        requireApproval: form.requireApproval,
      };

      if (isEdit && template) {
        await choresApi.updateTemplate(template.id, data);
      } else {
        await choresApi.createTemplate(data);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} template`;
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
            <FileText size={20} className="text-purple-600" />
            {isEdit ? 'Edit Template' : 'New Template'}
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
              placeholder="e.g., Clean bathroom, Vacuum living room"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 resize-none"
              rows={2}
              placeholder="Optional details about the chore..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Points & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Points
              </label>
              <input
                type="number"
                value={form.defaultPoints}
                onChange={(e) => setForm({ ...form, defaultPoints: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estimated Minutes
            </label>
            <input
              type="number"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
              placeholder="Optional"
              min="1"
            />
          </div>

          {/* Requires Photo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requiresPhoto"
              checked={form.requiresPhoto}
              onChange={(e) => setForm({ ...form, requiresPhoto: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="requiresPhoto" className="text-sm text-gray-700 dark:text-gray-300">
              Require photo for completion
            </label>
          </div>

          {/* Requires Approval */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requireApproval"
              checked={form.requireApproval}
              onChange={(e) => setForm({ ...form, requireApproval: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="requireApproval" className="text-sm text-gray-700 dark:text-gray-300">
              Require approval before awarding points
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
