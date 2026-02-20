// Income Tab - View income sources, entries, and summary

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Banknote,
  Plus,
  Edit,
  Trash2,
  Receipt,
  Clock,
  Briefcase,
  RefreshCw,
} from 'lucide-react';
import type {
  IncomeDefinition,
  IncomeEntry,
  IncomeSummary,
  IncomeType,
  IncomeFrequency,
} from '../../types/budget';

interface IncomeTabProps {
  incomeSources: IncomeDefinition[];
  incomeEntries: IncomeEntry[];
  incomeSummary: IncomeSummary | null;
  onAddSource: () => void;
  onEditSource: (source: IncomeDefinition) => void;
  onDeleteSource: (id: number) => void;
  onAddEntry: (incomeId?: number) => void;
  onDeleteEntry: (id: number) => void;
  onRefresh: () => void;
}

export function IncomeTab({
  incomeSources,
  incomeEntries,
  incomeSummary,
  onAddSource,
  onEditSource,
  onDeleteSource,
  onAddEntry,
  onDeleteEntry,
  onRefresh,
}: IncomeTabProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getIncomeTypeLabel = (type: IncomeType) => {
    switch (type) {
      case 'salary':
        return 'Salary';
      case 'bonus':
        return 'Bonus';
      case 'side-income':
        return 'Side Income';
      case 'investment':
        return 'Investment';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  const getFrequencyLabel = (freq: IncomeFrequency) => {
    switch (freq) {
      case 'monthly':
        return 'Monthly';
      case 'bi-weekly':
        return 'Bi-weekly';
      case 'weekly':
        return 'Weekly';
      case 'yearly':
        return 'Yearly';
      case 'one-time':
        return 'One-time';
      case 'irregular':
        return 'Irregular';
      default:
        return freq;
    }
  };

  const getIncomeTypeColor = (type: IncomeType) => {
    switch (type) {
      case 'salary':
        return 'var(--color-primary)';
      case 'bonus':
        return 'var(--color-warning)';
      case 'side-income':
        return 'var(--color-info)';
      case 'investment':
        return 'var(--color-success)';
      case 'other':
        return 'var(--color-muted-foreground)';
      default:
        return 'var(--color-muted-foreground)';
    }
  };

  const getReceivedPercent = (source: IncomeDefinition) => {
    if (source.amount <= 0) return 0;
    return Math.min((source.receivedThisMonth / source.amount) * 100, 100);
  };

  const netPosition = incomeSummary?.netPosition ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expected Monthly Income */}
        <div className="themed-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">Expected Monthly Income</p>
              <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">
                {formatCurrency(incomeSummary?.totalExpectedMonthly || 0)}
              </p>
            </div>
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)' }}
            >
              <DollarSign className="w-6 h-6 text-[var(--color-success)]" />
            </div>
          </div>
        </div>

        {/* Received This Month */}
        <div className="themed-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">Received This Month</p>
              <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">
                {formatCurrency(incomeSummary?.totalReceivedThisMonth || 0)}
              </p>
            </div>
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)' }}
            >
              <Banknote className="w-6 h-6 text-[var(--color-info)]" />
            </div>
          </div>
        </div>

        {/* Net Position */}
        <div className="themed-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">Net Position</p>
              <p
                className="text-2xl font-bold mt-1"
                style={{ color: netPosition >= 0 ? 'var(--color-success)' : 'var(--color-destructive)' }}
              >
                {formatCurrency(netPosition)}
              </p>
            </div>
            <div
              className="p-3 rounded-full"
              style={{
                backgroundColor: netPosition >= 0
                  ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
                  : 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
              }}
            >
              {netPosition >= 0 ? (
                <TrendingUp className="w-6 h-6 text-[var(--color-success)]" />
              ) : (
                <TrendingDown className="w-6 h-6 text-[var(--color-destructive)]" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Income Sources Section */}
      <div className="themed-card rounded-xl shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[var(--color-foreground)]">Income Sources</h3>
            <span className="text-sm text-[var(--color-muted-foreground)]">
              ({incomeSources.length} source{incomeSources.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onAddSource}
              className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </button>
          </div>
        </div>

        {incomeSources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {incomeSources.map((source) => {
              const receivedPercent = getReceivedPercent(source);
              const typeColor = getIncomeTypeColor(source.incomeType);

              return (
                <div
                  key={source.id}
                  className="themed-card rounded-xl shadow-sm overflow-hidden border border-[var(--color-border)]"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-[var(--color-border)]">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-[var(--color-foreground)]">
                          {source.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${typeColor} 15%, transparent)`,
                              color: typeColor,
                            }}
                          >
                            {getIncomeTypeLabel(source.incomeType)}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-[var(--color-muted)] rounded text-[var(--color-muted-foreground)]">
                            {getFrequencyLabel(source.frequency)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEditSource(source)}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded"
                          title="Edit source"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAddEntry(source.id)}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-success)] hover:bg-[var(--color-success)]/10 rounded"
                          title="Record payment"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSource(source.id)}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded"
                          title="Delete source"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    {/* Amount */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-[var(--color-foreground)]">
                        {formatCurrency(source.amount)}
                      </span>
                    </div>

                    {/* Received vs Expected */}
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-[var(--color-muted-foreground)]">
                        {formatCurrency(source.receivedThisMonth)} / {formatCurrency(source.amount)}
                      </span>
                      <span
                        className="font-medium"
                        style={{
                          color: receivedPercent >= 100
                            ? 'var(--color-success)'
                            : receivedPercent > 0
                              ? 'var(--color-info)'
                              : 'var(--color-muted-foreground)',
                        }}
                      >
                        {receivedPercent.toFixed(0)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-[var(--color-muted)] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${receivedPercent}%`,
                          backgroundColor: receivedPercent >= 100
                            ? 'var(--color-success)'
                            : receivedPercent > 0
                              ? 'var(--color-info)'
                              : 'var(--color-muted)',
                        }}
                      />
                    </div>

                    {/* Day of month if set */}
                    {source.dayOfMonth && (
                      <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expected on the {source.dayOfMonth}{getOrdinalSuffix(source.dayOfMonth)} of each month
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto text-[var(--color-muted-foreground)] mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-2">
              No Income Sources
            </h3>
            <p className="text-[var(--color-muted-foreground)] mb-6">
              Add your first income source to start tracking your earnings.
            </p>
            <button
              onClick={onAddSource}
              className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Income Source
            </button>
          </div>
        )}
      </div>

      {/* Recent Income Entries Section */}
      <div className="themed-card rounded-xl shadow-sm">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--color-foreground)]">Recent Income</h3>
          <button
            onClick={() => onAddEntry()}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-[var(--color-success)] text-[var(--color-success-foreground)] rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 mr-1" />
            Record Income
          </button>
        </div>

        {incomeEntries.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">
            {incomeEntries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-[var(--color-muted)]/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)' }}
                    >
                      <DollarSign className="w-5 h-5 text-[var(--color-success)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-foreground)]">
                        {entry.incomeName}
                      </p>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {formatDate(entry.receivedDate)}
                        {entry.notes && (
                          <span> &bull; {entry.notes}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[var(--color-success)]">
                      +{formatCurrency(entry.amount)}
                    </span>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--color-muted-foreground)]">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No income recorded yet</p>
            <p className="text-sm">Record your first income entry to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Get ordinal suffix for a number (1st, 2nd, 3rd, etc.) */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default IncomeTab;
