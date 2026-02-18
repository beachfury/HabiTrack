// apps/web/src/api/family.ts
// Family/user management API endpoints

import { apiClient } from './client';
import type { FamilyMember, CreateFamilyMemberData, UserOption } from '../types';

export const familyApi = {
  // Get all family members
  getMembers(): Promise<{ members: FamilyMember[] }> {
    return apiClient['get']('/family/members', { params: undefined });
  },

  // Get single member
  getMember(id: number): Promise<{ member: FamilyMember }> {
    return apiClient['get'](`/family/members/${id}`, { params: undefined });
  },

  // Create new family member (admin only)
  createMember(data: CreateFamilyMemberData): Promise<{ id: number; inviteUrl?: string }> {
    return apiClient['post']('/family/members', data);
  },

  // Update family member
  updateMember(id: number, data: Partial<CreateFamilyMemberData>): Promise<{ success: boolean }> {
    return apiClient['put'](`/family/members/${id}`, data);
  },

  // Delete/deactivate family member (soft delete)
  deleteMember(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/family/members/${id}`, undefined);
  },

  // Reactivate family member
  reactivateMember(id: number): Promise<{ success: boolean }> {
    return apiClient['post'](`/family/members/${id}/reactivate`);
  },

  // Permanently delete a deactivated family member (hard delete)
  hardDeleteMember(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/family/members/${id}/permanent`, undefined);
  },

  // Get simple user list (for dropdowns)
  getUsers(): Promise<{ users: UserOption[] }> {
    return apiClient['get']('/calendar/users', { params: undefined });
  },

  // Send/resend invite
  sendInvite(memberId: number): Promise<{ success: boolean; inviteUrl?: string }> {
    return apiClient['post'](`/family/members/${memberId}/invite`);
  },

  // Reset member password (admin only)
  resetMemberPassword(memberId: number): Promise<{ success: boolean; tempPassword?: string }> {
    return apiClient['post'](`/family/members/${memberId}/reset-password`);
  },

  // Set member password (admin only) - for FamilyPage.tsx
  setMemberPassword(memberId: number, password: string): Promise<{ success: boolean }> {
    return apiClient['post'](`/family/members/${memberId}/password`, { password });
  },

  // Set member PIN (admin only)
  setMemberPin(memberId: number, pin: string | null): Promise<{ success: boolean }> {
    return apiClient['post'](`/family/members/${memberId}/pin`, { pin });
  },

  // Remove member PIN
  removeMemberPin(memberId: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/family/members/${memberId}/pin`, undefined);
  },
};
