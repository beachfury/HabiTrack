// Entries Tab - Transaction history with filters

import { useState, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Receipt,
  Filter,
  Calendar,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Budget, BudgetEntry, BudgetCategory } from '../../types/budget';

interface EntriesTabProps {
  entries: BudgetEntry[];
  budgets: Budget[];
  categories: BudgetCategory[];
  onAddEntry: () => void;
  onEditEntry: (entry: BudgetEntry) => void;
  onDeleteEntry: (id: number) => void;
  onRefresh: () => void;
}

export function EntriesTab({
  entries,
  budgets,
  categories,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onRefresh,
}: EntriesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBudget, setFilterBudget] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          entry.budgetName?.toLowerCase().includes(search) ||
          entry.vendor?.toLowerCase().includes(search) ||
          entry.description?.toLowerCase().includes(search) ||
          entry.categoryName?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Budget filter
      if (filterBudget && entry.budgetId !== filterBudget) return false;

      // Category filter
      if (filterCategory && entry.categoryId !== filterCategory) return false;

      // Date range filter
      if (dateRange.start && entry.transactionDate < dateRange.start) return false;
      if (dateRange.end && entry.transactionDate > dateRange.end) return false;

      return true;
    });
  }, [entries, searchTerm, filterBudget, filterCategory, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total for filtered entries
  const filteredTotal = filteredEntries.reduce((sum, e) => sum + e.amount, 0);

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              className="pl-10 pr-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-sm w-48 text-[var(--color-foreground)]"
            />
          </div>

          {/* Budget filter */}
          <select
            value={filterBudget || ''}
            onChange={(e) => {
              setFilterBudget(e.target.value ? Number(e.target.value) : null);
              handleFilterChange();
            }}
            className="px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-foreground)]"
          >
            <option value="">All Budgets</option>
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={filterCategory || ''}
            onChange={(e) => {
              setFilterCategory(e.target.value ? Number(e.target.value) : null);
              handleFilterChange();
            }}
            className="px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-foreground)]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange((prev) => ({ ...prev, start: e.target.value }));
                handleFilterChange();
              }}
              className="px-2 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-foreground)]"
            />
            <span className="text-[var(--color-muted-foreground)]">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange((prev) => ({ ...prev, end: e.target.value }));
                handleFilterChange();
              }}
              className="px-2 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-foreground)]"
            />
          </div>
        </div>

        <button
          onClick={onAddEntry}
          className="inline-flex items-center px-4 py-2 bg-[var(--color-success)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </button>
      </div>

      {/* Summary */}
      <div className="bg-[var(--color-muted)] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-sm text-[var(--color-muted-foreground)]">
            Showing {filteredEntries.length} entries
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm text-[var(--color-muted-foreground)] mr-2">Total:</span>
          <span className="font-bold text-[var(--color-foreground)]">
            {formatCurrency(filteredTotal)}
          </span>
        </div>
      </div>

      {/* Entries Table */}
      {paginatedEntries.length > 0 ? (
        <div className="themed-card rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted-foreground)]">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted-foreground)]">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted-foreground)]">
                    Budget
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-muted-foreground)]">
                    Vendor
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-muted-foreground)]">
                    Amount
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[var(--color-muted-foreground)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {paginatedEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-[var(--color-muted)]/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--color-foreground)]">
                        {formatDate(entry.transactionDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.categoryColor || '#6b7280' }}
                        />
                        <span className="text-sm text-[var(--color-foreground)]">
                          {entry.description || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--color-muted-foreground)]">
                        {entry.budgetName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--color-muted-foreground)]">
                        {entry.vendor || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-[var(--color-foreground)]">
                        {formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded"
                          title="Edit entry"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-[var(--color-muted-foreground)]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 themed-card rounded-xl">
          <Receipt className="w-16 h-16 mx-auto text-[var(--color-muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-2">
            No Entries Found
          </h3>
          <p className="text-[var(--color-muted-foreground)] mb-6">
            {searchTerm || filterBudget || filterCategory || dateRange.start || dateRange.end
              ? 'No entries match your filters. Try adjusting them.'
              : 'Start tracking expenses by adding your first entry.'}
          </p>
          <button
            onClick={onAddEntry}
            className="inline-flex items-center px-4 py-2 bg-[var(--color-success)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </button>
        </div>
      )}
    </div>
  );
}

export default EntriesTab;
