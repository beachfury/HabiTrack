// apps/web/src/types/user.ts
// User and authentication related types

import { ReactNode } from 'react';

export interface User {
  id: number;
  displayName: string;
  nickname: string | null;
  email: string | null;
  role: 'admin' | 'member' | 'kid';
  color: string | null;
  avatarUrl: string | null;
}

export interface FamilyMember extends User {
  active: boolean;
  hasPassword: boolean;
  hasPin: boolean;
  createdAt: string;
}

export interface UserOption {
  roleId: ReactNode;
  id: number;
  displayName: string;
  nickname: string | null;
  color: string | null;
  avatarUrl?: string | null;
}

export interface UserSettings {
  user(user: any): unknown;
  id: number;
  displayName: string;
  nickname: string | null;
  email: string | null;
  color: string | null;
  theme: 'light' | 'dark' | 'system';
  accentColor: string | null;
  avatarUrl: string | null;
}

export interface CreateFamilyMemberData {
  displayName: string;
  nickname?: string;
  email?: string;
  role: 'admin' | 'member' | 'kid';
  color?: string;
  password?: string;
  pin?: string;
}

export interface HouseholdSettings {
  household(household: any): unknown;
  name: string;
  brandColor: string;
  logoUrl: string | null;
  loginBackground: 'gradient' | 'solid' | 'image';
  loginBackgroundValue: string | null;
  timezone: string;
}

export interface PinUser {
  id: number;
  displayName: string;
  nickname: string | null;
  color: string | null;
  avatarUrl: string | null;
}
