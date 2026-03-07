// apps/web/src/api/kiosk.ts
// Kiosk board API module

import { apiClient } from './client';

export interface KioskChoreItem {
  id: number;
  choreId: number;
  title: string;
  status: string;
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
  chores: KioskChoreItem[];
  paidChores: KioskPaidChoreItem[];
  events: KioskEventItem[];
}

export const kioskApi = {
  getBoard(): Promise<{ members: KioskBoardMember[]; date: string }> {
    return apiClient.get('/kiosk/board', { params: undefined });
  },

  verifyPin(userId: number, pin: string): Promise<{ valid: boolean }> {
    return apiClient.post('/auth/pin/verify', { userId, pin });
  },
};
