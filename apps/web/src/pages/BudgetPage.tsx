// apps/web/src/pages/BudgetPage.tsx
// Admin-only household budget management

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PieChart,
  FolderOpen,
  DollarSign,
  Plus,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { budgetsApi } from '../api/budgets';
import { incomeApi } from '../api/income';
import type {
  BudgetCategory,
  Budget,
  BudgetEntry,
  BudgetAnalytics,
  BudgetSummary,
} from '../types/budget';
import type { IncomeDefinition, IncomeEntry, IncomeSummary, CreateIncomeData, CreateIncomeEntryData } from '../types/budget';

// Import tab components
import { OverviewTab } from '../components/budgets/OverviewTab';
import { BudgetsTab } from '../components/budgets/BudgetsTab';
import { EntriesTab } from '../components/budgets/EntriesTab';
import { AnalyticsTab } from '../components/budgets/AnalyticsTab';
import { CategoriesTab } from '../components/budgets/CategoriesTab';
import { IncomeTab } from '../components/budgets/IncomeTab';

// Import modals
import { AddBudgetModal } from '../components/budgets/modals/AddBudgetModal';
import { AddEntryModal } from '../components/budgets/modals/AddEntryModal';
import { CategoryModal } from '../components/budgets/modals/CategoryModal';
import { AddIncomeModal } from '../components/budgets/modals/AddIncomeModal';
import { AddIncomeEntryModal } from '../components/budgets/modals/AddIncomeEntryModal';

type Tab = 'overview' | 'budgets' | 'entries' | 'analytics' | 'categories' | 'income';

export function BudgetPage() {
  const { user } = useAuth();
  const { getPageAnimationClasses } = useTheme();
  const isAdmin = user?.role === 'admin';
  const animationClasses = getPageAnimationClasses('budget-background');

  // If not admin, redirect to home
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <ShieldAlert className="w-16 h-16 text-[var(--color-destructive)] mb-4" />
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
          Admin Access Required
        </h2>
        <p className="text-[var(--color-muted-foreground)] mb-6">
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

  // Income state
  const [incomeSources, setIncomeSources] = useState<IncomeDefinition[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [incomeSummary, setIncomeSummary] = useState<IncomeSummary | null>(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showIncomeEntryModal, setShowIncomeEntryModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeDefinition | null>(null);
  const [preselectedIncomeId, setPreselectedIncomeId] = useState<number | undefined>();

  // Tabs definition
  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'budgets' as Tab, label: 'Budgets', icon: Wallet },
    { id: 'entries' as Tab, label: 'Entries', icon: Receipt },
    { id: 'analytics' as Tab, label: 'Analytics', icon: PieChart },
    { id: 'categories' as Tab, label: 'Categories', icon: FolderOpen },
    { id: 'income' as Tab, label: 'Income', icon: DollarSign },
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
      } else if (activeTab === 'income') {
        await fetchIncome();
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

  async function fetchIncome() {
    try {
      const [defsData, entriesData, summaryData] = await Promise.all([
        incomeApi.getDefinitions(),
        incomeApi.getEntries({ limit: 100 }),
        incomeApi.getSummary(),
      ]);
      setIncomeSources(defsData.incomeDefinitions);
      setIncomeEntries(entriesData.entries);
      setIncomeSummary(summaryData.summary);
    } catch (err) {
      console.error('Failed to fetch income data:', err);
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

  // Income CRUD handlers
  async function handleSaveIncome(data: CreateIncomeData) {
    try {
      if (editingIncome) {
        await incomeApi.updateDefinition(editingIncome.id, data);
        setSuccess('Income source updated successfully');
      } else {
        await incomeApi.createDefinition(data);
        setSuccess('Income source created successfully');
      }
      setShowIncomeModal(false);
      setEditingIncome(null);
      await fetchIncome();
    } catch (err: any) {
      setError(err.message || 'Failed to save income source');
    }
  }

  async function handleDeleteIncome(id: number) {
    if (!confirm('Are you sure you want to delete this income source? All associated entries will be deleted.')) {
      return;
    }
    try {
      await incomeApi.deleteDefinition(id);
      setSuccess('Income source deleted successfully');
      await fetchIncome();
    } catch (err: any) {
      setError(err.message || 'Failed to delete income source');
    }
  }

  async function handleSaveIncomeEntry(data: CreateIncomeEntryData) {
    try {
      await incomeApi.createEntry(data);
      setSuccess('Income entry recorded successfully');
      setShowIncomeEntryModal(false);
      setPreselectedIncomeId(undefined);
      await fetchIncome();
    } catch (err: any) {
      setError(err.message || 'Failed to create income entry');
    }
  }

  async function handleDeleteIncomeEntry(id: number) {
    if (!confirm('Are you sure you want to delete this income entry?')) {
      return;
    }
    try {
      await incomeApi.deleteEntry(id);
      setSuccess('Income entry deleted successfully');
      await fetchIncome();
    } catch (err: any) {
      setError(err.message || 'Failed to delete income entry');
    }
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
    <div className={`min-h-screen themed-budget-bg ${animationClasses}`}>
      <div className="space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-foreground)]">
            Budget Management
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Track household expenses and manage your budget
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddEntryModal(true)}
            className="inline-flex items-center px-4 py-2 bg-[var(--color-success)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Record Payment
          </button>
          <button
            onClick={() => setShowAddBudgetModal(true)}
            className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Budget
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div
          className="flex items-center gap-2 p-4 rounded-lg"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)',
            border: '1px solid',
          }}
        >
          <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
          <p className="text-[var(--color-success)]">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto text-[var(--color-success)] hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div
          className="flex items-center gap-2 p-4 rounded-lg"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-destructive) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-destructive) 30%, transparent)',
            border: '1px solid',
          }}
        >
          <AlertCircle className="w-5 h-5 text-[var(--color-destructive)]" />
          <p className="text-[var(--color-destructive)]">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-[var(--color-destructive)] hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[var(--color-border)]">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap"
                style={{
                  borderColor: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                }}
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
          <RefreshCw className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              summary={summary}
              incomeSummary={incomeSummary}
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

          {activeTab === 'income' && (
            <IncomeTab
              incomeSources={incomeSources}
              incomeEntries={incomeEntries}
              incomeSummary={incomeSummary}
              onAddSource={() => setShowIncomeModal(true)}
              onEditSource={(source: IncomeDefinition) => {
                setEditingIncome(source);
                setShowIncomeModal(true);
              }}
              onDeleteSource={handleDeleteIncome}
              onAddEntry={(incomeId?: number) => {
                setPreselectedIncomeId(incomeId);
                setShowIncomeEntryModal(true);
              }}
              onDeleteEntry={handleDeleteIncomeEntry}
              onRefresh={fetchIncome}
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

      {showIncomeModal && (
        <AddIncomeModal
          income={editingIncome}
          onSave={handleSaveIncome}
          onClose={() => {
            setShowIncomeModal(false);
            setEditingIncome(null);
          }}
        />
      )}

      {showIncomeEntryModal && (
        <AddIncomeEntryModal
          incomeSources={incomeSources}
          entry={null}
          preselectedIncomeId={preselectedIncomeId}
          onSave={handleSaveIncomeEntry}
          onClose={() => {
            setShowIncomeEntryModal(false);
            setPreselectedIncomeId(undefined);
          }}
        />
      )}
      </div>
    </div>
  );
}

export default BudgetPage;
