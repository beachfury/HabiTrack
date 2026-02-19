// Budget Management Types

export type PeriodType = 'monthly' | 'yearly' | 'weekly' | 'one-time';
export type BudgetType = 'bill' | 'spending';  // bill = fixed recurring, spending = variable with limit

export interface BudgetCategory {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: number | null;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  name: string;
  description: string | null;
  budgetAmount: number;
  budgetType: BudgetType;  // 'bill' for fixed bills, 'spending' for variable budgets
  periodType: PeriodType;
  startDate: string | null;
  endDate: string | null;
  isRecurring: boolean;
  dueDay: number | null;
  active: boolean;
  createdBy: number;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  currentSpent: number;
  remainingAmount: number;
  percentUsed: number;
  entryCount: number;
  isPaidThisPeriod: boolean;  // For bills - was it paid this period?
}

export interface BudgetEntry {
  id: number;
  budgetId: number;
  budgetName: string;
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  amount: number;
  description: string | null;
  transactionDate: string;
  paymentMethod: string | null;
  vendor: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdBy: number;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetHistory {
  id: number;
  budgetId: number;
  previousAmount: number;
  newAmount: number;
  reason: string | null;
  changedBy: number;
  changedByName: string;
  changedAt: string;
}

export interface CategoryBreakdown {
  categoryId: number;
  categoryName: string;
  color: string;
  icon: string | null;
  total: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  monthName: string;
  total: number;
  budgeted: number;
}

export interface BudgetComparison {
  budgetId: number;
  name: string;
  categoryColor: string | null;
  budgeted: number;
  actual: number;
  variance: number;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  percentUsed: number;
  overBudgetCount: number;
  underBudgetCount: number;
  budgetCount?: number;
  entryCount?: number;
  topCategory?: {
    name: string;
    color: string;
    icon: string;
    total: number;
  } | null;
}

export interface BudgetAnalytics {
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  budgetComparison: BudgetComparison[];
  summary: BudgetSummary;
  period: {
    type: string;
    startDate: string;
    endDate: string;
    year: number;
    month: number;
  };
}

// API request/response types
export interface CreateBudgetData {
  categoryId: number;
  name: string;
  description?: string;
  budgetAmount: number;
  budgetType?: BudgetType;  // 'bill' or 'spending', defaults to 'bill'
  periodType?: PeriodType;
  startDate?: string;
  endDate?: string;
  isRecurring?: boolean;
  dueDay?: number;
}

export interface UpdateBudgetData extends Partial<CreateBudgetData> {
  active?: boolean;
  reason?: string; // Reason for budget amount change
}

export interface CreateEntryData {
  budgetId: number;
  amount: number;
  description?: string;
  transactionDate: string;
  paymentMethod?: string;
  vendor?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface UpdateEntryData extends Partial<CreateEntryData> {}

export interface CreateCategoryData {
  name: string;
  icon?: string;
  color?: string;
  parentId?: number;
  sortOrder?: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  active?: boolean;
}

// API Response types
export interface BudgetsResponse {
  budgets: Budget[];
}

export interface BudgetResponse {
  budget: Budget;
  entries: BudgetEntry[];
  periodInfo: {
    startDate: string;
    endDate: string;
    periodType: string;
  };
}

export interface EntriesResponse {
  entries: BudgetEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CategoriesResponse {
  categories: BudgetCategory[];
}

export interface SummaryResponse {
  summary: BudgetSummary;
  recentEntries: BudgetEntry[];
  period: {
    month: string;
    startDate: string;
    endDate: string;
  };
}

export interface HistoryResponse {
  budgetName: string;
  history: BudgetHistory[];
}

// ===========================================
// Income Types
// ===========================================
export type IncomeType = 'salary' | 'bonus' | 'side-income' | 'investment' | 'other';
export type IncomeFrequency = 'monthly' | 'bi-weekly' | 'weekly' | 'yearly' | 'one-time' | 'irregular';

export interface IncomeDefinition {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  incomeType: IncomeType;
  frequency: IncomeFrequency;
  dayOfMonth: number | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  // Computed
  receivedThisMonth: number;
}

export interface IncomeEntry {
  id: number;
  incomeId: number;
  incomeName: string;
  amount: number;
  receivedDate: string;
  notes: string | null;
  createdBy: number;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeSummary {
  totalExpectedMonthly: number;
  totalReceivedThisMonth: number;
  totalBudgetedExpenses: number;
  netPosition: number;
  incomeSourceCount: number;
}

export interface CreateIncomeData {
  name: string;
  description?: string;
  amount: number;
  incomeType?: IncomeType;
  frequency?: IncomeFrequency;
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateIncomeData extends Partial<CreateIncomeData> {
  active?: boolean;
}

export interface CreateIncomeEntryData {
  incomeId: number;
  amount: number;
  receivedDate: string;
  notes?: string;
}
