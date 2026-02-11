// Budget Management API Client
import { apiClient } from './client';
import type {
  BudgetCategory,
  Budget,
  BudgetEntry,
  BudgetHistory,
  BudgetAnalytics,
  BudgetsResponse,
  BudgetResponse,
  EntriesResponse,
  CategoriesResponse,
  SummaryResponse,
  HistoryResponse,
  CreateBudgetData,
  UpdateBudgetData,
  CreateEntryData,
  UpdateEntryData,
  CreateCategoryData,
  UpdateCategoryData,
} from '../types/budget';

export const budgetsApi = {
  // ===================
  // Categories
  // ===================
  getCategories(): Promise<CategoriesResponse> {
    return apiClient.get('/budgets/categories', { params: undefined });
  },

  createCategory(data: CreateCategoryData): Promise<{ id: number; message: string }> {
    return apiClient.post('/budgets/categories', data);
  },

  updateCategory(id: number, data: UpdateCategoryData): Promise<{ success: boolean; message: string }> {
    return apiClient.put(`/budgets/categories/${id}`, data);
  },

  deleteCategory(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/budgets/categories/${id}`, undefined);
  },

  // ===================
  // Budgets
  // ===================
  getBudgets(params?: { categoryId?: number; active?: boolean }): Promise<BudgetsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.categoryId) searchParams.set('categoryId', String(params.categoryId));
    if (params?.active !== undefined) searchParams.set('active', String(params.active));
    const query = searchParams.toString();
    return apiClient.get(`/budgets${query ? `?${query}` : ''}`, { params: undefined });
  },

  getBudget(id: number): Promise<BudgetResponse> {
    return apiClient.get(`/budgets/${id}`, { params: undefined });
  },

  createBudget(data: CreateBudgetData): Promise<{ id: number; message: string }> {
    return apiClient.post('/budgets', data);
  },

  updateBudget(id: number, data: UpdateBudgetData): Promise<{ success: boolean; message: string }> {
    return apiClient.put(`/budgets/${id}`, data);
  },

  deleteBudget(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/budgets/${id}`, undefined);
  },

  getBudgetHistory(id: number): Promise<HistoryResponse> {
    return apiClient.get(`/budgets/${id}/history`, { params: undefined });
  },

  // ===================
  // Entries
  // ===================
  getEntries(params?: {
    budgetId?: number;
    categoryId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<EntriesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.budgetId) searchParams.set('budgetId', String(params.budgetId));
    if (params?.categoryId) searchParams.set('categoryId', String(params.categoryId));
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    return apiClient.get(`/budgets/entries${query ? `?${query}` : ''}`, { params: undefined });
  },

  getEntry(id: number): Promise<{ entry: BudgetEntry }> {
    return apiClient.get(`/budgets/entries/${id}`, { params: undefined });
  },

  createEntry(data: CreateEntryData): Promise<{ id: number; message: string }> {
    return apiClient.post('/budgets/entries', data);
  },

  updateEntry(id: number, data: UpdateEntryData): Promise<{ success: boolean; message: string }> {
    return apiClient.put(`/budgets/entries/${id}`, data);
  },

  deleteEntry(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/budgets/entries/${id}`, undefined);
  },

  // ===================
  // Analytics
  // ===================
  getAnalytics(params?: {
    period?: 'month' | 'year';
    year?: number;
    month?: number;
    months?: number;
  }): Promise<BudgetAnalytics> {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.set('period', params.period);
    if (params?.year) searchParams.set('year', String(params.year));
    if (params?.month) searchParams.set('month', String(params.month));
    if (params?.months) searchParams.set('months', String(params.months));
    const query = searchParams.toString();
    return apiClient.get(`/budgets/analytics${query ? `?${query}` : ''}`, { params: undefined });
  },

  getSummary(): Promise<SummaryResponse> {
    return apiClient.get('/budgets/summary', { params: undefined });
  },
};

export default budgetsApi;
