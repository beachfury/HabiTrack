// apps/web/src/api/kiosk.ts
// Kiosk board API module

import { apiClient } from './client';

export interface KioskChoreItem {
  id: number;
  choreId: number;
  title: string;
  status: string;
  dueDate: string;
  dueTime: string | null;
  completedAt: string | null;
  points: number;
  requireApproval: boolean;
  categoryColor: string | null;
}

export interface KioskPaidChoreItem {
  id: string;
  title: string;
  amount: number;
  status: string;
  completedAt: string | null;
}

export interface KioskEventItem {
  id: number;
  title: string;
  startTime: string;
  startDate: string;
  endTime: string | null;
  color: string | null;
  allDay: boolean;
}

export interface KioskBoardMember {
  id: number;
  displayName: string;
  nickname: string | null;
  color: string | null;
  avatarUrl: string | null;
  roleId: string;
  totalPoints: number;
  chores: KioskChoreItem[];
  paidChores: KioskPaidChoreItem[];
  events: KioskEventItem[];
}

export interface KioskMealItem {
  id: number;
  date: string;
  recipeName: string | null;
  recipeImage: string | null;
  customMealName: string | null;
  isFendForYourself: boolean;
  ffyMessage: string | null;
  status: string;
}

export const kioskApi = {
  getBoard(): Promise<{ members: KioskBoardMember[]; date: string; meal: KioskMealItem | null }> {
    return apiClient.get('/kiosk/board', { params: undefined });
  },

  verifyPin(userId: number, pin: string): Promise<{ valid: boolean }> {
    return apiClient.post('/auth/pin/verify', { userId, pin });
  },

  completeChore(
    userId: number,
    pin: string,
    choreInstanceId: number,
  ): Promise<{ success: boolean; pointsAwarded?: number; awaitsApproval?: boolean; bonusPoints?: number }> {
    return apiClient.post('/kiosk/complete-chore', { userId, pin, choreInstanceId });
  },

  completePaidChore(
    userId: number,
    pin: string,
    paidChoreId: string,
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/kiosk/complete-paid-chore', { userId, pin, paidChoreId });
  },
};
