// apps/web/src/pages/BudgetPage.tsx
// Admin-only household budget management

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PieChart,
  FolderOpen,
  Plus,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { budgetsApi } from '../api/budgets';
import type {
  BudgetCategory,
  Budget,
  BudgetEntry,
  BudgetAnalytics,
  BudgetSummary,
} from '../types/budget';

// Import tab components
import { OverviewTab } from '../components/budgets/OverviewTab';
import { BudgetsTab } from '../components/budgets/BudgetsTab';
import { EntriesTab } from '../components/budgets/EntriesTab';
import { AnalyticsTab } from '../components/budgets/AnalyticsTab';
import { CategoriesTab } from '../components/budgets/CategoriesTab';

// Import modals
import { AddBudgetModal } from '../components/budgets/modals/AddBudgetModal';
import { AddEntryModal } from '../components/budgets/modals/AddEntryModal';
import { CategoryModal } from '../components/budgets/modals/CategoryModal';

type Tab = 'overview' | 'budgets' | 'entries' | 'analytics' | 'categories';

export function BudgetPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // If not admin, redirect to home
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Access Required
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The Budget Management feature is only available to household admins.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  // Data state
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [recentEntries, setRecentEntries] = useState<BudgetEntry[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [preselectedBudgetId, setPreselectedBudgetId] = useState<number | null>(null);

  // Tabs definition
  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'budgets' as Tab, label: 'Budgets', icon: Wallet },
    { id: 'entries' as Tab, label: 'Entries', icon: Receipt },
    { id: 'analytics' as Tab, label: 'Analytics', icon: PieChart },
    { id: 'categories' as Tab, label: 'Categories', icon: FolderOpen },
  ];

  // Fetch data on tab change
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      // Always fetch categories as they're used across tabs
      await fetchCategories();

      if (activeTab === 'overview') {
        await Promise.all([fetchSummary(), fetchBudgets()]);
      } else if (activeTab === 'budgets') {
        await fetchBudgets();
      } else if (activeTab === 'entries') {
        await Promise.all([fetchEntries(), fetchBudgets()]);
      } else if (activeTab === 'analytics') {
        await fetchAnalytics();
      }
      // Categories tab just needs categories which we already fetched
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const data = await budgetsApi.getCategories();
      setCategories(data.categories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }

  async function fetchBudgets() {
    try {
      const data = await budgetsApi.getBudgets();
      setBudgets(data.budgets);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    }
  }

  async function fetchEntries() {
    try {
      const data = await budgetsApi.getEntries({ limit: 100 });
      setEntries(data.entries);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    }
  }

  async function fetchAnalytics() {
    try {
      const data = await budgetsApi.getAnalytics({ months: 6 });
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }

  async function fetchSummary() {
    try {
      const data = await budgetsApi.getSummary();
      setSummary(data.summary);
      setRecentEntries(data.recentEntries);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }

  // CRUD handlers
  async function handleCreateBudget(data: any) {
    try {
      await budgetsApi.createBudget(data);
      setSuccess('Budget created successfully');
      setShowAddBudgetModal(false);
      await fetchBudgets();
      if (activeTab === 'overview') await fetchSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to create budget');
    }
  }

  async function handleUpdateBudget(id: number, data: any) {
    try {
      await budgetsApi.updateBudget(id, data);
      setSuccess('Budget updated successfully');
      setShowAddBudgetModal(false);
      setEditingBudget(null);
      await fetchBudgets();
      if (activeTab === 'overview') await fetchSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to update budget');
    }
  }

  async function handleDeleteBudget(id: number) {
    if (!confirm('Are you sure you want to delete this budget? All associated entries will be deleted.')) {
      return;
    }
    try {
      await budgetsApi.deleteBudget(id);
      setSuccess('Budget deleted successfully');
      await fetchBudgets();
      if (activeTab === 'overview') await fetchSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to delete budget');
    }
  }

  async function handleCreateEntry(data: any) {
    try {
      await budgetsApi.createEntry(data);
      setSuccess('Entry added successfully');
      setShowAddEntryModal(false);
      setPreselectedBudgetId(null);
      await Promise.all([fetchEntries(), fetchBudgets()]);
      if (activeTab === 'overview') await fetchSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to create entry');
    }
  }

  async function handleUpdateEntry(id: number, data: any) {
    try {
      await budgetsApi.updateEntry(id, data);
      setSuccess('Entry updated successfully');
      setShowAddEntryModal(false);
      setEditingEntry(null);
      await Promise.all([fetchEntries(), fetchBudgets()]);
      if (activeTab === 'overview') await fetchSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to update entry');
    }
  }

  async function handleDeleteEntry(id: number) {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    try {
      await budgetsApi.deleteEntry(id);
      setSuccess('Entry deleted successfully');
      await Promise.all([fetchEntries(), fetchBudgets()]);
      if (activeTab === 'overview') await fetchSummary();
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry');
    }
  }

  async function handleCreateCategory(data: any) {
    try {
      await budgetsApi.createCategory(data);
      setSuccess('Category created successfully');
      setShowCategoryModal(false);
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    }
  }

  async function handleUpdateCategory(id: number, data: any) {
    try {
      await budgetsApi.updateCategory(id, data);
      setSuccess('Category updated successfully');
      setShowCategoryModal(false);
      setEditingCategory(null);
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }
    try {
      await budgetsApi.deleteCategory(id);
      setSuccess('Category deleted successfully');
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  }

  // Quick add entry from overview/budgets tab
  function handleQuickAddEntry(budgetId: number) {
    setPreselectedBudgetId(budgetId);
    setShowAddEntryModal(true);
  }

  // Clear messages after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="space-y-6 h-full p-8 themed-budget-bg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Budget Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track household expenses and manage your budget
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddEntryModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Record Payment
          </button>
          <button
            onClick={() => setShowAddBudgetModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Budget
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              summary={summary}
              budgets={budgets}
              recentEntries={recentEntries}
              categories={categories}
              onAddEntry={handleQuickAddEntry}
              onEditBudget={(budget) => {
                setEditingBudget(budget);
                setShowAddBudgetModal(true);
              }}
              onRefresh={fetchData}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsTab
              budgets={budgets}
              categories={categories}
              onAddBudget={() => setShowAddBudgetModal(true)}
              onEditBudget={(budget) => {
                setEditingBudget(budget);
                setShowAddBudgetModal(true);
              }}
              onDeleteBudget={handleDeleteBudget}
              onAddEntry={handleQuickAddEntry}
            />
          )}

          {activeTab === 'entries' && (
            <EntriesTab
              entries={entries}
              budgets={budgets}
              categories={categories}
              onAddEntry={() => setShowAddEntryModal(true)}
              onEditEntry={(entry) => {
                setEditingEntry(entry);
                setShowAddEntryModal(true);
              }}
              onDeleteEntry={handleDeleteEntry}
              onRefresh={fetchEntries}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              analytics={analytics}
              onRefresh={fetchAnalytics}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab
              categories={categories}
              budgets={budgets}
              onAddCategory={() => setShowCategoryModal(true)}
              onEditCategory={(category) => {
                setEditingCategory(category);
                setShowCategoryModal(true);
              }}
              onDeleteCategory={handleDeleteCategory}
            />
          )}
        </>
      )}

      {/* Modals */}
      {showAddBudgetModal && (
        <AddBudgetModal
          categories={categories}
          budget={editingBudget}
          onSave={editingBudget ? (data) => handleUpdateBudget(editingBudget.id, data) : handleCreateBudget}
          onClose={() => {
            setShowAddBudgetModal(false);
            setEditingBudget(null);
          }}
        />
      )}

      {showAddEntryModal && (
        <AddEntryModal
          budgets={budgets}
          entry={editingEntry}
          preselectedBudgetId={preselectedBudgetId}
          onSave={editingEntry ? (data) => handleUpdateEntry(editingEntry.id, data) : handleCreateEntry}
          onClose={() => {
            setShowAddEntryModal(false);
            setEditingEntry(null);
            setPreselectedBudgetId(null);
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onSave={editingCategory ? (data) => handleUpdateCategory(editingCategory.id, data) : handleCreateCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

export default BudgetPage;
