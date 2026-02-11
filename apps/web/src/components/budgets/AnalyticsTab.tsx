// Analytics Tab - Charts and graphs

import { useState } from 'react';
import {
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { BudgetAnalytics } from '../../types/budget';

interface AnalyticsTabProps {
  analytics: BudgetAnalytics | null;
  onRefresh: () => void;
}

export function AnalyticsTab({ analytics, onRefresh }: AnalyticsTabProps) {
  const [selectedChart, setSelectedChart] = useState<'pie' | 'trend' | 'comparison'>('pie');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  const { categoryBreakdown, monthlyTrends, budgetComparison, summary, period } = analytics;

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: item.color }}>
            {item.name}: {formatCurrency(item.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Budgeted</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(summary.totalBudgeted)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(summary.totalSpent)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Over Budget</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
            {summary.overBudgetCount} items
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Under Budget</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
            {summary.underBudgetCount} items
          </p>
        </div>
      </div>

      {/* Chart Selector */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <button
          onClick={() => setSelectedChart('pie')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            selectedChart === 'pie'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          Category Breakdown
        </button>
        <button
          onClick={() => setSelectedChart('trend')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            selectedChart === 'trend'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Monthly Trends
        </button>
        <button
          onClick={() => setSelectedChart('comparison')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            selectedChart === 'comparison'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Budget vs Actual
        </button>
        <button
          onClick={onRefresh}
          className="ml-auto p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {selectedChart === 'pie' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Spending by Category
            </h3>
            {categoryBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="total"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, percent }: any) =>
                          `${name}: ${(percent * 100).toFixed(1)}%`
                        }
                        labelLine={true}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={index} fill={entry.color || '#6b7280'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.categoryId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || '#6b7280' }}
                        />
                        <span className="text-gray-900 dark:text-white">{cat.categoryName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(cat.total)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                          ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No spending data available for this period
              </div>
            )}
          </div>
        )}

        {selectedChart === 'trend' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Monthly Spending Trends
            </h3>
            {monthlyTrends.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      dataKey="monthName"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${v / 1000}k`}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Spent"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="budgeted"
                      name="Budget"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#8b5cf6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No trend data available
              </div>
            )}
          </div>
        )}

        {selectedChart === 'comparison' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Budget vs Actual Spending
            </h3>
            {budgetComparison.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={budgetComparison}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `$${v}`}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="budgeted" name="Budget" fill="#8b5cf6" />
                    <Bar dataKey="actual" name="Actual" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No comparison data available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Period Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <Calendar className="w-4 h-4 inline mr-1" />
        Showing data from {period.startDate} to {period.endDate}
      </div>
    </div>
  );
}

export default AnalyticsTab;
