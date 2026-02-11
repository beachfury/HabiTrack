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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-48"
            />
          </div>

          {/* Budget filter */}
          <select
            value={filterBudget || ''}
            onChange={(e) => {
              setFilterBudget(e.target.value ? Number(e.target.value) : null);
              handleFilterChange();
            }}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
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
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
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
              className="px-2 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange((prev) => ({ ...prev, end: e.target.value }));
                handleFilterChange();
              }}
              className="px-2 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            />
          </div>
        </div>

        <button
          onClick={onAddEntry}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredEntries.length} entries
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Total:</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {formatCurrency(filteredTotal)}
          </span>
        </div>
      </div>

      {/* Entries Table */}
      {paginatedEntries.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Budget
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Vendor
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Amount
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDate(entry.transactionDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.categoryColor || '#6b7280' }}
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {entry.description || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.budgetName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.vendor || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Edit entry"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
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
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Entries Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || filterBudget || filterCategory || dateRange.start || dateRange.end
              ? 'No entries match your filters. Try adjusting them.'
              : 'Start tracking expenses by adding your first entry.'}
          </p>
          <button
            onClick={onAddEntry}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
