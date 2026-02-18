// apps/web/src/components/chores/modals/AddTemplateModal.tsx
import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { choresApi } from '../../../api';
import type { ChoreCategory, ChoreTemplate } from '../../../types';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';

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

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={onClose}
        className="flex-1 py-2 px-4 border border-[var(--color-border)] rounded-xl text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex-1 py-2 px-4 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl hover:opacity-90 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Template'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Template' : 'New Template'}
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
              placeholder="e.g., Clean bathroom, Vacuum living room"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              rows={2}
              placeholder="Optional details about the chore..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Default Points
              </label>
              <input
                type="number"
                value={form.defaultPoints}
                onChange={(e) => setForm({ ...form, defaultPoints: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Estimated Minutes
            </label>
            <input
              type="number"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
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
              className="w-4 h-4 rounded focus:ring-[var(--color-primary)]"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <label htmlFor="requiresPhoto" className="text-sm text-[var(--color-foreground)]">
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
              className="w-4 h-4 rounded focus:ring-[var(--color-primary)]"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <label htmlFor="requireApproval" className="text-sm text-[var(--color-foreground)]">
              Require approval before awarding points
            </label>
          </div>
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
