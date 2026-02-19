// Income Management API Client
import { apiClient } from './client';
import type {
  IncomeDefinition,
  IncomeEntry,
  IncomeSummary,
  CreateIncomeData,
  UpdateIncomeData,
  CreateIncomeEntryData,
} from '../types/budget';

export const incomeApi = {
  // ===================
  // Income Definitions
  // ===================
  getDefinitions(params?: { active?: boolean }): Promise<{ incomeDefinitions: IncomeDefinition[] }> {
    const searchParams = new URLSearchParams();
    if (params?.active !== undefined) searchParams.set('active', String(params.active));
    const query = searchParams.toString();
    return apiClient.get(`/income${query ? `?${query}` : ''}`, { params: undefined });
  },

  getDefinition(id: number): Promise<{ incomeDefinition: IncomeDefinition; entries: IncomeEntry[] }> {
    return apiClient.get(`/income/${id}`, { params: undefined });
  },

  createDefinition(data: CreateIncomeData): Promise<{ id: number; message: string }> {
    return apiClient.post('/income', data);
  },

  updateDefinition(id: number, data: UpdateIncomeData): Promise<{ success: boolean; message: string }> {
    return apiClient.put(`/income/${id}`, data);
  },

  deleteDefinition(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/income/${id}`, undefined);
  },

  // ===================
  // Income Entries
  // ===================
  getEntries(params?: {
    incomeId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: IncomeEntry[]; pagination: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params?.incomeId) searchParams.set('incomeId', String(params.incomeId));
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    return apiClient.get(`/income/entries${query ? `?${query}` : ''}`, { params: undefined });
  },

  createEntry(data: CreateIncomeEntryData): Promise<{ id: number; message: string }> {
    return apiClient.post('/income/entries', data);
  },

  updateEntry(id: number, data: Partial<CreateIncomeEntryData>): Promise<{ success: boolean; message: string }> {
    return apiClient.put(`/income/entries/${id}`, data);
  },

  deleteEntry(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/income/entries/${id}`, undefined);
  },

  // ===================
  // Summary
  // ===================
  getSummary(): Promise<{ summary: IncomeSummary }> {
    return apiClient.get('/income/summary', { params: undefined });
  },
};

export default incomeApi;
