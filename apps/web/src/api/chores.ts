// apps/web/src/api/chores.ts
// Chores API endpoints

import { apiClient } from './client';
import type {
  Chore,
  ChoreInstance,
  ChoreCategory,
  ChoreStats,
  LeaderboardEntry,
  ChoreTemplate,
  CreateChoreData,
  UpdateChoreData,
  CompleteChoreData,
} from '../types';

export const choresApi = {
  // =============================================================================
  // Categories
  // =============================================================================
  getCategories(): Promise<{ categories: ChoreCategory[] }> {
    return apiClient['get']('/chores/categories', { params: undefined });
  },

  createCategory(data: { name: string; icon?: string; color?: string }): Promise<{ id: number }> {
    return apiClient['post']('/chores/categories', data);
  },

  updateCategory(
    id: number,
    data: { name?: string; icon?: string; color?: string },
  ): Promise<{ success: boolean }> {
    return apiClient['put'](`/chores/categories/${id}`, data);
  },

  deleteCategory(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/chores/categories/${id}`, undefined);
  },

  // =============================================================================
  // Chore Definitions
  // =============================================================================
  getChores(): Promise<{ chores: Chore[] }> {
    return apiClient['get']('/chores', { params: undefined });
  },

  getChore(id: number): Promise<{ chore: Chore }> {
    return apiClient['get'](`/chores/${id}`, { params: undefined });
  },

  createChore(data: CreateChoreData): Promise<{ id: number }> {
    return apiClient['post']('/chores', data);
  },

  updateChore(id: number, data: UpdateChoreData): Promise<{ success: boolean }> {
    return apiClient['put'](`/chores/${id}`, data);
  },

  deleteChore(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/chores/${id}`, undefined);
  },

  // =============================================================================
  // Chore Instances
  // =============================================================================
  getInstances(params?: {
    startDate?: string;
    endDate?: string;
    mine?: boolean;
    status?: string;
  }): Promise<{ instances: ChoreInstance[] }> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.mine) searchParams.set('mine', 'true');
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return apiClient['get'](`/chores/instances${query ? `?${query}` : ''}`, { params: undefined });
  },

  getInstance(id: number): Promise<{ instance: ChoreInstance }> {
    return apiClient['get'](`/chores/instances/${id}`, { params: undefined });
  },

  // =============================================================================
  // Chore Actions
  // =============================================================================
  completeChore(
    instanceId: number,
    data: { notes?: string; forUserId?: number },
  ): Promise<{
    success: boolean;
    pointsAwarded?: number;
    pointsRecipient?: number;
    awaitsApproval?: boolean;
  }> {
    return apiClient['post'](`/chores/instances/${instanceId}/complete`, data);
  },

  approveChore(
    instanceId: number,
    data?: { pointsAwarded?: number },
  ): Promise<{ success: boolean }> {
    return apiClient['post'](`/chores/instances/${instanceId}/approve`, data || {});
  },

  rejectChore(instanceId: number, data?: { reason?: string }): Promise<{ success: boolean }> {
    return apiClient['post'](`/chores/instances/${instanceId}/reject`, data || {});
  },

  skipChore(instanceId: number, data?: { reason?: string }): Promise<{ success: boolean }> {
    return apiClient['post'](`/chores/instances/${instanceId}/skip`, data || {});
  },

  reassignChore(instanceId: number, userId: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/chores/instances/${instanceId}/reassign`, { userId });
  },

  //=============================================================================
  // Assignments Management (for admin to manage assigned chores)
  // =============================================================================
  getAssignments(params?: {
    choreId?: string;
    assignedTo?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    futureOnly?: string;
  }): Promise<{
    assignments: Array<{
      id: number;
      choreId: number;
      title: string;
      description: string | null;
      categoryId: number | null;
      categoryName: string | null;
      categoryColor: string | null;
      dueDate: string;
      dueTime: string | null;
      assignedTo: number | null;
      assignedToName: string | null;
      status: 'pending' | 'completed' | 'skipped' | 'pending_approval';
      recurrenceRule: string | null;
    }>;
    filters: {
      chores: Array<{ id: number; title: string }>;
      users: Array<{ id: number; displayName: string }>;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return apiClient['get'](`/chores/assignments${query ? `?${query}` : ''}`, {
      params: undefined,
    });
  },

  deleteAssignment(instanceId: number): Promise<{ success: boolean; deletedId: number }> {
    return apiClient['delete'](`/chores/assignments/${instanceId}`, undefined);
  },

  bulkDeleteAssignments(params: {
    instanceIds?: number[];
    choreId?: number;
    assignedTo?: number;
    startDate?: string;
    endDate?: string;
    futureOnly?: boolean;
    statusFilter?: string;
  }): Promise<{ success: boolean; deletedCount: number; message: string }> {
    return apiClient['post']('/chores/assignments/bulk-delete', params);
  },

  // =============================================================================
  // Stats & Leaderboard
  // =============================================================================
  getStats(userId?: number): Promise<{ stats: ChoreStats }> {
    const params = userId ? `?userId=${userId}` : '';
    return apiClient['get'](`/chores/stats${params}`, { params: undefined });
  },

  getLeaderboard(
    period?: 'day' | 'week' | 'month' | 'all',
  ): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const params = period ? `?period=${period}` : '';
    return apiClient['get'](`/chores/leaderboard${params}`, { params: undefined });
  },

  // =============================================================================
  // Points Management (Admin)
  // =============================================================================
  adjustPoints(
    userId: number,
    amount: number,
    reason?: string,
  ): Promise<{ success: boolean; newTotal: number }> {
    return apiClient['post']('/chores/points/adjust', { userId, amount, reason });
  },

  getPointsHistory(userId: number): Promise<{
    history: Array<{
      id: number;
      points: number;
      reason: string;
      createdAt: string;
      choreTitle?: string;
    }>;
  }> {
    return apiClient['get'](`/chores/points/history/${userId}`, { params: undefined });
  },

  // =============================================================================
  // Templates
  // =============================================================================
  getTemplates(): Promise<{ templates: ChoreTemplate[] }> {
    return apiClient['get']('/chores/templates', { params: undefined });
  },

  applyTemplate(
    templateId: number,
    options?: {
      assignedTo?: number;
      recurrenceType?: string;
      recurrenceInterval?: number;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{ success: boolean; choreId: number; instancesCreated: number }> {
    return apiClient['post'](`/chores/templates/${templateId}/apply`, options || {});
  },

  createTemplate(data: {
    title: string;
    description?: string;
    categoryId?: number;
    difficulty?: string;
    defaultPoints?: number;
    estimatedMinutes?: number;
  }): Promise<{ template: ChoreTemplate; templateId: number }> {
    return apiClient['post']('/chores/templates', data);
  },

  updateTemplate(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      categoryId: number;
      difficulty: string;
      defaultPoints: number;
      estimatedMinutes: number;
    }>,
  ): Promise<{ template: ChoreTemplate }> {
    return apiClient['put'](`/chores/templates/${id}`, data);
  },

  deleteTemplate(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/chores/templates/${id}`, undefined);
  },
};
