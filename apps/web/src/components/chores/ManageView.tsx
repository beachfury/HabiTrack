// apps/web/src/components/chores/ManageView.tsx
// This view manages chore TEMPLATES, categories, and ASSIGNED CHORES

import { useState, useEffect } from 'react';
import {
  Trash2,
  Edit2,
  Plus,
  Folder,
  ChevronDown,
  ChevronRight,
  FileText,
  Star,
  Clock,
  CalendarCheck,
} from 'lucide-react';
import type { ChoreCategory, ChoreTemplate } from '../../types';
import { choresApi } from '../../api';
import { CategoryModal } from './modals/CategoryModal';
import { AddTemplateModal } from './modals/AddTemplateModal';
import { AssignmentsTab } from './AssignmentsTab';

interface ManageViewProps {
  categories: ChoreCategory[];
  onRefresh: () => Promise<void>;
}

type Tab = 'templates' | 'categories' | 'assignments';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function ManageView({ categories, onRefresh }: ManageViewProps) {
  const [tab, setTab] = useState<Tab>('templates');
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number | 'uncategorized'>>(
    new Set(),
  );

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ChoreCategory | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChoreTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await choresApi.getTemplates();
      setTemplates(data?.templates || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group templates by category (safely handle empty templates)
  const templatesByCategory = categories.reduce(
    (acc, cat) => {
      acc[cat.id] = (templates || []).filter((t) => t.categoryId === cat.id);
      return acc;
    },
    {} as Record<number, ChoreTemplate[]>,
  );

  const uncategorizedTemplates = (templates || []).filter((t) => !t.categoryId);

  const toggleCategory = (categoryId: number | 'uncategorized') => {
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

  const handleDeleteCategory = async (categoryId: number) => {
    const templateCount = templatesByCategory[categoryId]?.length || 0;
    if (templateCount > 0) {
      alert(
        `Cannot delete category with ${templateCount} templates. Move or delete the templates first.`,
      );
      return;
    }
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await choresApi.deleteCategory(categoryId);
      await onRefresh();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await choresApi.deleteTemplate(templateId);
      await loadTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
            tab === 'templates'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <FileText size={16} />
          Chore Templates
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
            tab === 'categories'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Folder size={16} />
          Categories
        </button>
        <button
          onClick={() => setTab('assignments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
            tab === 'assignments'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <CalendarCheck size={16} />
          Assigned Chores
        </button>
      </div>

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-4">
          {/* Add Template Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Create chore templates here, then assign them to family members from the "Add Chore"
              button.
            </p>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowTemplateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              <Plus size={18} />
              Add Template
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No chore templates yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Create templates to quickly assign chores to family members
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Templates grouped by category */}
              {categories.map((category) => {
                const catTemplates = templatesByCategory[category.id] || [];
                if (catTemplates.length === 0) return null;

                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div
                    key={category.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color || '#6b7280' }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </span>
                        <span className="text-sm text-gray-500">({catTemplates.length})</span>
                      </div>
                    </button>

                    {/* Templates */}
                    {isExpanded && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {catTemplates.map((template) => (
                          <TemplateRow
                            key={template.id}
                            template={template}
                            onEdit={() => {
                              setEditingTemplate(template);
                              setShowTemplateModal(true);
                            }}
                            onDelete={() => handleDeleteTemplate(template.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Uncategorized Templates */}
              {uncategorizedTemplates.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleCategory('uncategorized')}
                    className="w-full p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      {expandedCategories.has('uncategorized') ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                      <span className="w-4 h-4 rounded-full bg-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Uncategorized
                      </span>
                      <span className="text-sm text-gray-500">
                        ({uncategorizedTemplates.length})
                      </span>
                    </div>
                  </button>

                  {expandedCategories.has('uncategorized') && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {uncategorizedTemplates.map((template) => (
                        <TemplateRow
                          key={template.id}
                          template={template}
                          onEdit={() => {
                            setEditingTemplate(template);
                            setShowTemplateModal(true);
                          }}
                          onDelete={() => handleDeleteTemplate(template.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Organize your chore templates into categories.</p>
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              <Plus size={18} />
              Add Category
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Folder size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No categories yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Create categories to organize your chore templates
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => {
                const templateCount = templatesByCategory[category.id]?.length || 0;

                return (
                  <div
                    key={category.id}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color || '#6b7280' }}
                      >
                        <Folder size={16} className="text-white" />
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {templateCount} template{templateCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setShowCategoryModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && <AssignmentsTab onRefresh={onRefresh} />}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSuccess={async () => {
            setShowCategoryModal(false);
            setEditingCategory(null);
            await onRefresh();
          }}
        />
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <AddTemplateModal
          template={editingTemplate}
          categories={categories}
          onClose={() => {
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
          onSuccess={async () => {
            setShowTemplateModal(false);
            setEditingTemplate(null);
            await loadTemplates();
          }}
        />
      )}
    </div>
  );
}

// Template Row Component
function TemplateRow({
  template,
  onEdit,
  onDelete,
}: {
  template: ChoreTemplate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-3 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <div className="flex items-center gap-3 min-w-0">
        <FileText size={18} className="text-gray-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">{template.title}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            {template.difficulty && (
              <span
                className={`px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[template.difficulty] || ''}`}
              >
                {template.difficulty}
              </span>
            )}
            {template.defaultPoints && (
              <span className="flex items-center gap-1">
                <Star size={10} />
                {template.defaultPoints} pts
              </span>
            )}
            {template.estimatedMinutes && (
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {template.estimatedMinutes} min
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
