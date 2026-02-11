// apps/web/src/components/chores/modals/AddChoreModal.tsx
import { useState, useEffect } from 'react';
import {
  X,
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

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Chore</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus size={16} className="inline mr-1" />
            Custom
          </button>
          <button
            onClick={() => setMode('template')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'template'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={16} className="inline mr-1" />
            Templates
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {mode === 'custom' ? (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Take out trash"
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
                  placeholder="Optional details..."
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <button
                    onClick={onShowCategoryModal}
                    className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <FolderPlus size={12} /> New
                  </button>
                </div>
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

              {/* Difficulty & Points */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) =>
                      setForm({ ...form, difficulty: e.target.value as ChoreDifficulty })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    value={form.points}
                    onChange={(e) => setForm({ ...form, points: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                    min="0"
                  />
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
                  min="0"
                />
              </div>

              {/* Recurrence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Every
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={form.recurrenceInterval}
                      onChange={(e) => setForm({ ...form, recurrenceInterval: e.target.value })}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                      min="1"
                    />
                    <span className="text-gray-600 dark:text-gray-400">{getIntervalLabel()}</span>
                  </div>
                </div>
              )}

              {/* Weekly day selection */}
              {form.recurrenceType === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleWeeklyDay(day.key)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          form.weeklyDays.includes(day.key)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  {form.weeklyDays.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Select at least one day
                    </p>
                  )}
                </div>
              )}

              {/* Start/End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              {/* Assign To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign To
                </label>
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
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
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label
                  htmlFor="requireApproval"
                  className="text-sm text-gray-700 dark:text-gray-300"
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
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No templates available</p>
                  <p className="text-sm text-gray-400 mt-1">Create templates in the Manage tab</p>
                </div>
              ) : (
                <>
                  {/* Settings for templates */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Assign To
                      </label>
                      <select
                        value={form.assignedTo}
                        onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Every
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={form.recurrenceInterval}
                            onChange={(e) =>
                              setForm({ ...form, recurrenceInterval: e.target.value })
                            }
                            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                            min="1"
                          />
                          <span className="text-gray-600 dark:text-gray-400">
                            {getIntervalLabel()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Weekly day selection for templates */}
                    {form.recurrenceType === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Days of Week
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map((day) => (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => toggleWeeklyDay(day.key)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                form.weeklyDays.includes(day.key)
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={form.endDate}
                          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
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
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          {isExpanded ? (
                            <ChevronDown size={20} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={20} className="text-gray-400" />
                          )}
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color || '#6b7280' }}
                          />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {cat.name}
                          </span>
                          <span className="text-sm text-gray-500">({catTemplates.length})</span>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-gray-100 dark:border-gray-700 p-2 space-y-2">
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <button
                        onClick={() => toggleCategory(null)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        {expandedCategories.has(null) ? (
                          <ChevronDown size={20} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-400" />
                        )}
                        <span className="w-3 h-3 rounded-full bg-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          Uncategorized
                        </span>
                        <span className="text-sm text-gray-500">
                          ({uncategorizedTemplates.length})
                        </span>
                      </button>

                      {expandedCategories.has(null) && (
                        <div className="border-t border-gray-100 dark:border-gray-700 p-2 space-y-2">
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
        </div>

        {mode === 'custom' && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 flex-shrink-0">
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
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        )}
      </div>
    </div>
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
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {expanded ? (
          <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">{template.name}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className={`px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[template.difficulty || 'medium']}`}
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
            <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
          )}
          <button
            onClick={onApply}
            disabled={saving}
            className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
