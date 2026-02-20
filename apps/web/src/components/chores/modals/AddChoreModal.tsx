// apps/web/src/components/chores/modals/AddChoreModal.tsx
import { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FolderPlus,
  Star,
  Clock,
  Calendar,
} from 'lucide-react';
import { choresApi, familyApi } from '../../../api';
import type {
  ChoreCategory,
  ChoreTemplate,
  UserOption,
  ChoreDifficulty,
  ChoreRecurrenceType,
} from '../../../types';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';
import { ModalFooterButtons } from '../../common/ModalFooterButtons';
import { getDifficultyStyle } from '../../../utils';

interface AddChoreModalProps {
  categories: ChoreCategory[];
  onSuccess: () => void;
  onClose: () => void;
  onShowCategoryModal: () => void;
}

export function AddChoreModal({
  categories,
  onSuccess,
  onClose,
  onShowCategoryModal,
}: AddChoreModalProps) {
  const [mode, setMode] = useState<'custom' | 'template'>('custom');
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number | null>>(new Set()); // Default collapsed
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    difficulty: 'medium' as ChoreDifficulty,
    points: '10',
    estimatedMinutes: '',
    recurrenceType: 'once' as ChoreRecurrenceType,
    recurrenceInterval: '1',
    recurrenceDays: '',
    weeklyDays: [] as string[],
    dueTime: '',
    assignedTo: '',
    requireApproval: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  // Days of the week for weekly recurrence
  const daysOfWeek = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
  ];

  const toggleWeeklyDay = (dayKey: string) => {
    setForm((prev) => {
      const newDays = prev.weeklyDays.includes(dayKey)
        ? prev.weeklyDays.filter((d) => d !== dayKey)
        : [...prev.weeklyDays, dayKey];
      return { ...prev, weeklyDays: newDays };
    });
  };

  useEffect(() => {
    choresApi
      .getTemplates()
      .then((data) => setTemplates(data?.templates || []))
      .catch((err) => {
        console.error('Failed to load templates:', err);
        setTemplates([]);
      });
    familyApi
      .getUsers()
      .then((data) => setUsers(data?.users || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Build recurrenceDays for weekly type
      const recurrenceDays = form.recurrenceType === 'weekly' && form.weeklyDays.length > 0
        ? form.weeklyDays.join(',')
        : form.recurrenceDays || undefined;

      await choresApi.createChore({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        difficulty: form.difficulty,
        points: Number(form.points),
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
        recurrenceType: form.recurrenceType,
        recurrenceInterval: form.recurrenceInterval ? Number(form.recurrenceInterval) : 1,
        recurrenceDays,
        dueTime: form.dueTime || undefined,
        assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
        requireApproval: form.requireApproval,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create chore';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = async (templateId: number) => {
    setSaving(true);
    setError('');
    try {
      // Build recurrenceDays for weekly type
      const recurrenceDays = form.recurrenceType === 'weekly' && form.weeklyDays.length > 0
        ? form.weeklyDays.join(',')
        : undefined;

      await choresApi.applyTemplate(templateId, {
        assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
        recurrenceType: form.recurrenceType,
        recurrenceInterval: form.recurrenceInterval ? Number(form.recurrenceInterval) : 1,
        recurrenceDays,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assign chore';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplate = (id: number) => {
    setExpandedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (categoryId: number | null) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Group templates by category
  const templatesByCategory = categories.reduce(
    (acc, cat) => {
      acc[cat.id] = templates.filter((t) => t.categoryId === cat.id);
      return acc;
    },
    {} as Record<number, ChoreTemplate[]>,
  );
  const uncategorizedTemplates = templates.filter((t) => !t.categoryId);

  // Get recurrence label for interval input
  const getIntervalLabel = () => {
    switch (form.recurrenceType) {
      case 'daily':
        return 'days';
      case 'weekly':
        return 'weeks';
      case 'monthly':
        return 'months';
      case 'custom':
        return 'days';
      default:
        return 'days';
    }
  };

  // Check if we should show the interval input
  const showIntervalInput = ['daily', 'weekly', 'monthly', 'custom'].includes(form.recurrenceType);

  const footer = mode === 'custom' ? (
    <ModalFooterButtons
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitText="Create"
      submitting={saving}
    />
  ) : undefined;

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Add Chore"
      size="lg"
      footer={footer}
    >
      {/* Mode Tabs */}
      <div className="flex border-b border-[var(--color-border)] flex-shrink-0 -mx-4 -mt-4 mb-4">
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <Plus size={16} className="inline mr-1" />
            Custom
          </button>
          <button
            onClick={() => setMode('template')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'template'
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <FileText size={16} className="inline mr-1" />
            Templates
          </button>
        </div>

        <ModalBody>
          {error && (
            <div
              className="mb-4 p-3 rounded-xl text-sm"
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

          {mode === 'custom' ? (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="e.g., Take out trash"
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
                  placeholder="Optional details..."
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    Category
                  </label>
                  <button
                    onClick={onShowCategoryModal}
                    className="text-xs text-[var(--color-primary)] hover:opacity-80 flex items-center gap-1"
                  >
                    <FolderPlus size={12} /> New
                  </button>
                </div>
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

              {/* Difficulty & Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Difficulty
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) =>
                      setForm({ ...form, difficulty: e.target.value as ChoreDifficulty })
                    }
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    value={form.points}
                    onChange={(e) => setForm({ ...form, points: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                    min="0"
                  />
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
                  min="0"
                />
              </div>

              {/* Recurrence */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Recurrence
                </label>
                <select
                  value={form.recurrenceType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recurrenceType: e.target.value as ChoreRecurrenceType,
                      recurrenceInterval: '1',
                    })
                  }
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                >
                  <option value="once">One time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Interval */}
              {showIntervalInput && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Every
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={form.recurrenceInterval}
                      onChange={(e) => setForm({ ...form, recurrenceInterval: e.target.value })}
                      className="w-24 px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                      min="1"
                    />
                    <span className="text-[var(--color-muted-foreground)]">{getIntervalLabel()}</span>
                  </div>
                </div>
              )}

              {/* Weekly day selection */}
              {form.recurrenceType === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                    Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleWeeklyDay(day.key)}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={
                          form.weeklyDays.includes(day.key)
                            ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }
                            : { backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }
                        }
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  {form.weeklyDays.length === 0 && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                      Select at least one day
                    </p>
                  )}
                </div>
              )}

              {/* Start/End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                  />
                </div>
              </div>

              {/* Assign To */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Assign To
                </label>
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                >
                  <option value="">Anyone (Unassigned)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nickname || u.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Require Approval */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireApproval"
                  checked={form.requireApproval}
                  onChange={(e) => setForm({ ...form, requireApproval: e.target.checked })}
                  className="w-4 h-4 rounded focus:ring-[var(--color-primary)]"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <label
                  htmlFor="requireApproval"
                  className="text-sm text-[var(--color-foreground)]"
                >
                  Require approval before awarding points
                </label>
              </div>
            </div>
          ) : (
            /* Templates Tab */
            <div className="space-y-4">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto text-[var(--color-muted-foreground)] opacity-50 mb-3" />
                  <p className="text-[var(--color-muted-foreground)]">No templates available</p>
                  <p className="text-sm text-[var(--color-muted-foreground)] opacity-70 mt-1">Create templates in the Manage tab</p>
                </div>
              ) : (
                <>
                  {/* Settings for templates */}
                  <div
                    className="p-3 rounded-xl space-y-3"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
                  >
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                        Assign To
                      </label>
                      <select
                        value={form.assignedTo}
                        onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                      >
                        <option value="">Anyone (Unassigned)</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nickname || u.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                        Recurrence
                      </label>
                      <select
                        value={form.recurrenceType}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            recurrenceType: e.target.value as ChoreRecurrenceType,
                            recurrenceInterval: '1',
                          })
                        }
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                      >
                        <option value="once">One time</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    {showIntervalInput && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                          Every
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={form.recurrenceInterval}
                            onChange={(e) =>
                              setForm({ ...form, recurrenceInterval: e.target.value })
                            }
                            className="w-24 px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                            min="1"
                          />
                          <span className="text-[var(--color-muted-foreground)]">
                            {getIntervalLabel()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Weekly day selection for templates */}
                    {form.recurrenceType === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                          Days of Week
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map((day) => (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => toggleWeeklyDay(day.key)}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              style={
                                form.weeklyDays.includes(day.key)
                                  ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }
                                  : { backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)' }
                              }
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={form.endDate}
                          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Templates grouped by category - COLLAPSIBLE */}
                  {categories.map((cat) => {
                    const catTemplates = templatesByCategory[cat.id] || [];
                    if (catTemplates.length === 0) return null;

                    const isExpanded = expandedCategories.has(cat.id);

                    return (
                      <div
                        key={cat.id}
                        className="themed-card overflow-hidden"
                      >
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-muted)] transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown size={20} className="text-[var(--color-muted-foreground)]" />
                          ) : (
                            <ChevronRight size={20} className="text-[var(--color-muted-foreground)]" />
                          )}
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color || '#6b7280' }}
                          />
                          <span className="font-medium text-[var(--color-foreground)]">
                            {cat.name}
                          </span>
                          <span className="text-sm text-[var(--color-muted-foreground)]">({catTemplates.length})</span>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-[var(--color-border)] p-2 space-y-2">
                            {catTemplates.map((template) => (
                              <TemplateCard
                                key={template.id}
                                template={template}
                                expanded={expandedTemplates.has(template.id)}
                                onToggle={() => toggleTemplate(template.id)}
                                onApply={() => handleApplyTemplate(template.id)}
                                saving={saving}
                                assignedToName={
                                  form.assignedTo
                                    ? users.find((u) => u.id === Number(form.assignedTo))
                                        ?.displayName ||
                                      users.find((u) => u.id === Number(form.assignedTo))
                                        ?.nickname ||
                                      undefined
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Uncategorized templates */}
                  {uncategorizedTemplates.length > 0 && (
                    <div className="themed-card overflow-hidden">
                      <button
                        onClick={() => toggleCategory(null)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-muted)] transition-colors"
                      >
                        {expandedCategories.has(null) ? (
                          <ChevronDown size={20} className="text-[var(--color-muted-foreground)]" />
                        ) : (
                          <ChevronRight size={20} className="text-[var(--color-muted-foreground)]" />
                        )}
                        <span className="w-3 h-3 rounded-full bg-[var(--color-muted-foreground)]" />
                        <span className="font-medium text-[var(--color-foreground)]">
                          Uncategorized
                        </span>
                        <span className="text-sm text-[var(--color-muted-foreground)]">
                          ({uncategorizedTemplates.length})
                        </span>
                      </button>

                      {expandedCategories.has(null) && (
                        <div className="border-t border-[var(--color-border)] p-2 space-y-2">
                          {uncategorizedTemplates.map((template) => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              expanded={expandedTemplates.has(template.id)}
                              onToggle={() => toggleTemplate(template.id)}
                              onApply={() => handleApplyTemplate(template.id)}
                              saving={saving}
                              assignedToName={
                                form.assignedTo
                                  ? users.find((u) => u.id === Number(form.assignedTo))
                                      ?.displayName ||
                                    users.find((u) => u.id === Number(form.assignedTo))?.nickname ||
                                    undefined
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </ModalBody>
    </ModalPortal>
  );
}

// Template card component
function TemplateCard({
  template,
  expanded,
  onToggle,
  onApply,
  saving,
  assignedToName,
}: {
  template: ChoreTemplate;
  expanded: boolean;
  onToggle: () => void;
  onApply: () => void;
  saving: boolean;
  assignedToName?: string;
}) {
  return (
    <div className="bg-[var(--color-muted)] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-3 text-left hover:opacity-80 transition-opacity"
      >
        {expanded ? (
          <ChevronUp size={16} className="text-[var(--color-muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-[var(--color-muted-foreground)] flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--color-foreground)] truncate">{template.name}</p>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            <span
              className="px-1.5 py-0.5 rounded"
              style={getDifficultyStyle(template.difficulty || 'medium')}
            >
              {template.difficulty || 'medium'}
            </span>
            <span className="flex items-center gap-0.5">
              <Star size={10} /> {template.defaultPoints} pts
            </span>
            {template.estimatedMinutes && (
              <span className="flex items-center gap-0.5">
                <Clock size={10} /> {template.estimatedMinutes} min
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {template.description && (
            <p className="text-sm text-[var(--color-muted-foreground)]">{template.description}</p>
          )}
          <button
            onClick={onApply}
            disabled={saving}
            className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Calendar size={14} />
            {saving
              ? 'Creating...'
              : assignedToName
                ? `Assign to ${assignedToName}`
                : 'Create Chore'}
          </button>
        </div>
      )}
    </div>
  );
}
