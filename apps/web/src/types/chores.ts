// apps/web/src/types/chores.ts
// Chore related types

import { ReactNode } from 'react';

export type ChoreDifficulty = 'easy' | 'medium' | 'hard';

// Deprecated: Use getDifficultyStyle() instead for CSS variable support
export const DIFFICULTY_COLORS: Record<ChoreDifficulty, string> = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// CSS variable based difficulty styles
export const getDifficultyStyle = (difficulty: ChoreDifficulty) => {
  switch (difficulty) {
    case 'easy':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
        color: 'var(--color-success)',
      };
    case 'hard':
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-destructive) 15%, transparent)',
        color: 'var(--color-destructive)',
      };
    default: // medium
      return {
        backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
        color: 'var(--color-warning)',
      };
  }
};

export type ChoreRecurrenceType =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom'
  | 'x_days';

export type ChoreAssignmentMode = 'fixed' | 'rotating' | 'fair' | 'anyone';

export type ChoreStatus = 'pending' | 'completed' | 'approved' | 'skipped' | 'rejected';

export interface ChoreCategory {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
}

export interface Chore {
  id: number;
  title: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  difficulty: ChoreDifficulty;
  estimatedMinutes: number | null;
  points: number;
  recurrenceType: ChoreRecurrenceType;
  recurrenceInterval: number;
  recurrenceDays: string | null;
  dueTime: string | null;
  assignmentMode: ChoreAssignmentMode;
  assignedTo: number | null;
  assignedToName: string | null;
  requirePhoto: boolean;
  requireApproval: boolean;
  startDate: string;
  endDate: string | null;
  active: boolean;
  createdBy: number;
  createdByName: string;
}

export interface ChoreInstance {
  id: number;
  choreId: number;
  title: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  difficulty: ChoreDifficulty;
  estimatedMinutes: number | null;
  points: number;
  dueDate: string;
  dueTime: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  assignedToColor: string | null;
  status: ChoreStatus;
  completedBy: number | null;
  completedByName: string | null;
  completedAt: string | null;
  completionNotes: string | null;
  photoUrl: string | null;
  requirePhoto: boolean;
  requireApproval: boolean;
  pointsAwarded: number | null;
  isOverdue: boolean;
  chore?: Chore;
}

export interface CreateChoreData {
  title: string;
  description?: string;
  categoryId?: number;
  difficulty?: ChoreDifficulty;
  estimatedMinutes?: number;
  points?: number;
  recurrenceType?: ChoreRecurrenceType;
  recurrenceInterval?: number;
  recurrenceDays?: string;
  dueTime?: string;
  assignmentMode?: ChoreAssignmentMode;
  assignedTo?: number;
  requirePhoto?: boolean;
  requireApproval?: boolean;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

export interface UpdateChoreData extends Partial<CreateChoreData> {
  active?: boolean;
}

export interface CompleteChoreData {
  notes?: string;
  photoUrl?: string;
}

export interface LeaderboardEntry {
  userId: number;
  displayName: string;
  nickname: string | null;
  color: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  completedCount: number;
  streak: number;
  rank: number;
}

export interface ChoreStats {
  thisWeek: number;
  completionRate: number;
  totalPoints: number;
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  pendingCount: number;
  overdueCount: number;
}

export interface ChoreTemplate {
  name: ReactNode;
  chores: any;
  id: number;
  title: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  difficulty: ChoreDifficulty;
  estimatedMinutes: number | null;
  defaultPoints: number;
  suggestedRecurrence: ChoreRecurrenceType | null;
  suggestedDays: string | null;
  requirePhoto: boolean;
  requireApproval: boolean;
  isSystem: boolean;
}

export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  earnedAt: string | null;
}
