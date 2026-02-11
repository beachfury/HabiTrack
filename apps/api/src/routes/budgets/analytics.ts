// Budget Analytics - aggregation queries for charts
// Admin-only

import { Request, Response } from 'express';
import { q } from '../../db';

// Helper to get user from request
function getUser(req: Request) {
  return (req as any).user as { id: number; roleId: string } | undefined;
}

// ============================================
// GET ANALYTICS DATA
// ============================================
export async function getAnalytics(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { period = 'month', year, month, months = 6 } = req.query;

    const now = new Date();
    const currentYear = year ? parseInt(year as string) : now.getFullYear();
    const currentMonth = month ? parseInt(month as string) : now.getMonth() + 1;

    // Calculate date range based on period
    let startDate: Date;
    let endDate: Date;

    if (period === 'year') {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31);
    } else {
      // Default to current month
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // 1. Category Breakdown (for pie chart)
    const categoryBreakdown = await q<any[]>(`
      SELECT
        bc.id as categoryId,
        bc.name as categoryName,
        bc.color,
        bc.icon,
        COALESCE(SUM(be.amount), 0) as total
      FROM budget_categories bc
      LEFT JOIN budgets b ON bc.id = b.categoryId AND b.active = 1
      LEFT JOIN budget_entries be ON b.id = be.budgetId
        AND be.transactionDate >= ?
        AND be.transactionDate <= ?
      WHERE bc.active = 1
      GROUP BY bc.id, bc.name, bc.color, bc.icon
      HAVING total > 0
      ORDER BY total DESC
    `, [startDateStr, endDateStr]);

    // Calculate percentages
    const totalSpending = categoryBreakdown.reduce((sum, c) => sum + parseFloat(c.total), 0);
    const categoryBreakdownWithPercent = categoryBreakdown.map(c => ({
      ...c,
      total: parseFloat(c.total),
      percentage: totalSpending > 0 ? (parseFloat(c.total) / totalSpending) * 100 : 0
    }));

    // 2. Monthly Trends (for line chart) - last N months
    const numMonths = parseInt(months as string);
    const monthlyTrends: any[] = [];

    for (let i = numMonths - 1; i >= 0; i--) {
      const trendDate = new Date(currentYear, currentMonth - 1 - i, 1);
      const trendMonth = trendDate.getMonth();
      const trendYear = trendDate.getFullYear();
      const monthStart = new Date(trendYear, trendMonth, 1);
      const monthEnd = new Date(trendYear, trendMonth + 1, 0);

      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = monthEnd.toISOString().split('T')[0];

      // Get spending for the month
      const spending = await q<any[]>(`
        SELECT COALESCE(SUM(be.amount), 0) as total
        FROM budget_entries be
        LEFT JOIN budgets b ON be.budgetId = b.id
        WHERE b.active = 1
          AND be.transactionDate >= ?
          AND be.transactionDate <= ?
      `, [monthStartStr, monthEndStr]);

      // Get budgeted amount for monthly budgets
      const budgeted = await q<any[]>(`
        SELECT COALESCE(SUM(budgetAmount), 0) as total
        FROM budgets
        WHERE active = 1
          AND periodType = 'monthly'
      `);

      const monthLabel = `${trendYear}-${String(trendMonth + 1).padStart(2, '0')}`;

      monthlyTrends.push({
        month: monthLabel,
        monthName: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: parseFloat(spending[0]?.total || 0),
        budgeted: parseFloat(budgeted[0]?.total || 0)
      });
    }

    // 3. Budget vs Actual Comparison (for bar chart)
    const budgetComparison = await q<any[]>(`
      SELECT
        b.id as budgetId,
        b.name,
        b.budgetAmount as budgeted,
        bc.color as categoryColor,
        COALESCE(SUM(be.amount), 0) as actual
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.categoryId = bc.id
      LEFT JOIN budget_entries be ON b.id = be.budgetId
        AND be.transactionDate >= ?
        AND be.transactionDate <= ?
      WHERE b.active = 1
        AND b.periodType = 'monthly'
      GROUP BY b.id, b.name, b.budgetAmount, bc.color
      ORDER BY b.budgetAmount DESC
      LIMIT 10
    `, [startDateStr, endDateStr]);

    const budgetComparisonFormatted = budgetComparison.map(b => ({
      ...b,
      budgeted: parseFloat(b.budgeted),
      actual: parseFloat(b.actual),
      variance: parseFloat(b.budgeted) - parseFloat(b.actual)
    }));

    // 4. Summary statistics
    const totalBudgeted = await q<any[]>(`
      SELECT COALESCE(SUM(budgetAmount), 0) as total
      FROM budgets
      WHERE active = 1 AND periodType = 'monthly'
    `);

    const totalSpent = await q<any[]>(`
      SELECT COALESCE(SUM(be.amount), 0) as total
      FROM budget_entries be
      LEFT JOIN budgets b ON be.budgetId = b.id
      WHERE b.active = 1
        AND be.transactionDate >= ?
        AND be.transactionDate <= ?
    `, [startDateStr, endDateStr]);

    const overBudget = await q<any[]>(`
      SELECT COUNT(*) as count
      FROM (
        SELECT b.id, b.budgetAmount, COALESCE(SUM(be.amount), 0) as spent
        FROM budgets b
        LEFT JOIN budget_entries be ON b.id = be.budgetId
          AND be.transactionDate >= ?
          AND be.transactionDate <= ?
        WHERE b.active = 1 AND b.periodType = 'monthly'
        GROUP BY b.id, b.budgetAmount
        HAVING spent > b.budgetAmount
      ) as over_budget
    `, [startDateStr, endDateStr]);

    const underBudget = await q<any[]>(`
      SELECT COUNT(*) as count
      FROM (
        SELECT b.id, b.budgetAmount, COALESCE(SUM(be.amount), 0) as spent
        FROM budgets b
        LEFT JOIN budget_entries be ON b.id = be.budgetId
          AND be.transactionDate >= ?
          AND be.transactionDate <= ?
        WHERE b.active = 1 AND b.periodType = 'monthly'
        GROUP BY b.id, b.budgetAmount
        HAVING spent <= b.budgetAmount
      ) as under_budget
    `, [startDateStr, endDateStr]);

    const budgetedAmount = parseFloat(totalBudgeted[0]?.total || 0);
    const spentAmount = parseFloat(totalSpent[0]?.total || 0);

    const summary = {
      totalBudgeted: budgetedAmount,
      totalSpent: spentAmount,
      remainingBudget: budgetedAmount - spentAmount,
      percentUsed: budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0,
      overBudgetCount: parseInt(overBudget[0]?.count || 0),
      underBudgetCount: parseInt(underBudget[0]?.count || 0)
    };

    res.json({
      categoryBreakdown: categoryBreakdownWithPercent,
      monthlyTrends,
      budgetComparison: budgetComparisonFormatted,
      summary,
      period: {
        type: period,
        startDate: startDateStr,
        endDate: endDateStr,
        year: currentYear,
        month: currentMonth
      }
    });
  } catch (err) {
    console.error('Failed to get budget analytics:', err);
    res.status(500).json({ error: 'Failed to get budget analytics' });
  }
}

// ============================================
// GET SUMMARY (quick overview)
// ============================================
export async function getSummary(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Total budgeted (monthly)
    const totalBudgeted = await q<any[]>(`
      SELECT COALESCE(SUM(budgetAmount), 0) as total
      FROM budgets
      WHERE active = 1 AND periodType = 'monthly'
    `);

    // Total spent this month
    const totalSpent = await q<any[]>(`
      SELECT COALESCE(SUM(be.amount), 0) as total
      FROM budget_entries be
      LEFT JOIN budgets b ON be.budgetId = b.id
      WHERE b.active = 1
        AND be.transactionDate >= ?
        AND be.transactionDate <= ?
    `, [startDateStr, endDateStr]);

    // Number of budgets
    const budgetCount = await q<any[]>(`
      SELECT COUNT(*) as count FROM budgets WHERE active = 1
    `);

    // Number of entries this month
    const entryCount = await q<any[]>(`
      SELECT COUNT(*) as count
      FROM budget_entries be
      LEFT JOIN budgets b ON be.budgetId = b.id
      WHERE b.active = 1
        AND be.transactionDate >= ?
        AND be.transactionDate <= ?
    `, [startDateStr, endDateStr]);

    // Top spending category this month
    const topCategory = await q<any[]>(`
      SELECT
        bc.name,
        bc.color,
        bc.icon,
        COALESCE(SUM(be.amount), 0) as total
      FROM budget_categories bc
      LEFT JOIN budgets b ON bc.id = b.categoryId AND b.active = 1
      LEFT JOIN budget_entries be ON b.id = be.budgetId
        AND be.transactionDate >= ?
        AND be.transactionDate <= ?
      WHERE bc.active = 1
      GROUP BY bc.id, bc.name, bc.color, bc.icon
      HAVING total > 0
      ORDER BY total DESC
      LIMIT 1
    `, [startDateStr, endDateStr]);

    // Recent entries
    const recentEntries = await q<any[]>(`
      SELECT
        be.id,
        be.amount,
        be.description,
        be.transactionDate,
        be.vendor,
        b.name as budgetName,
        bc.color as categoryColor,
        bc.icon as categoryIcon
      FROM budget_entries be
      LEFT JOIN budgets b ON be.budgetId = b.id
      LEFT JOIN budget_categories bc ON b.categoryId = bc.id
      WHERE b.active = 1
      ORDER BY be.transactionDate DESC, be.createdAt DESC
      LIMIT 5
    `);

    const budgetedAmount = parseFloat(totalBudgeted[0]?.total || 0);
    const spentAmount = parseFloat(totalSpent[0]?.total || 0);

    res.json({
      summary: {
        totalBudgeted: budgetedAmount,
        totalSpent: spentAmount,
        remainingBudget: budgetedAmount - spentAmount,
        percentUsed: budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0,
        budgetCount: parseInt(budgetCount[0]?.count || 0),
        entryCount: parseInt(entryCount[0]?.count || 0),
        topCategory: topCategory[0] || null
      },
      recentEntries,
      period: {
        month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        startDate: startDateStr,
        endDate: endDateStr
      }
    });
  } catch (err) {
    console.error('Failed to get budget summary:', err);
    res.status(500).json({ error: 'Failed to get budget summary' });
  }
}
