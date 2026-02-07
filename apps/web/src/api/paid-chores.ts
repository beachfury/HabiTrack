// apps/web/src/api/paid-chores.ts
// Frontend API client for Paid Chores (Chore Race feature)

const API_BASE = '/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// TYPES
// =============================================================================

export interface PaidChore {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  categoryId: number | null;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number | null;
  requirePhoto: boolean;
  status: 'available' | 'claimed' | 'completed' | 'verified' | 'cancelled';
  claimedBy: number | null;
  claimerName?: string;
  claimerColor?: string;
  claimedAt: string | null;
  completedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: number | null;
  verifierName?: string;
  completionNotes: string | null;
  completionPhotoUrl: string | null;
  expiresAt: string | null;
  createdBy: number;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaidChoreInput {
  title: string;
  description?: string;
  amount: number;
  categoryId?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedMinutes?: number;
  requirePhoto?: boolean;
  expiresAt?: string;
}

export interface UpdatePaidChoreInput {
  title?: string;
  description?: string;
  amount?: number;
  categoryId?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedMinutes?: number;
  requirePhoto?: boolean;
  expiresAt?: string;
}

export interface Earning {
  id: number;
  userId: number;
  paidChoreId: string;
  amount: number;
  earnedAt: string;
  choreTitle?: string;
  choreDescription?: string;
}

export interface LeaderboardEntry {
  id: number;
  displayName: string;
  nickname: string | null;
  color: string;
  avatarUrl: string | null;
  totalEarnings: number;
  choresCompleted: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

export async function listPaidChores(status?: string): Promise<PaidChore[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetchApi<{ chores: PaidChore[] }>(`/paid-chores${params}`);
  return response.chores;
}

export async function getPaidChore(id: string): Promise<PaidChore> {
  const response = await fetchApi<{ chore: PaidChore }>(`/paid-chores/${encodeURIComponent(id)}`);
  return response.chore;
}

export async function createPaidChore(input: CreatePaidChoreInput): Promise<PaidChore> {
  const response = await fetchApi<{ chore: PaidChore }>('/paid-chores', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.chore;
}

export async function updatePaidChore(id: string, input: UpdatePaidChoreInput): Promise<PaidChore> {
  const response = await fetchApi<{ chore: PaidChore }>(`/paid-chores/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return response.chore;
}

export async function deletePaidChore(id: string): Promise<void> {
  await fetchApi<{ success: boolean }>(`/paid-chores/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function claimPaidChore(id: string): Promise<{ chore: PaidChore; message: string }> {
  return fetchApi<{ chore: PaidChore; message: string }>(`/paid-chores/${encodeURIComponent(id)}/claim`, {
    method: 'POST',
  });
}

export async function completePaidChore(
  id: string,
  data: { notes?: string; photoUrl?: string }
): Promise<{ chore: PaidChore; message: string }> {
  return fetchApi<{ chore: PaidChore; message: string }>(`/paid-chores/${encodeURIComponent(id)}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyPaidChore(id: string): Promise<{ chore: PaidChore; message: string }> {
  return fetchApi<{ chore: PaidChore; message: string }>(`/paid-chores/${encodeURIComponent(id)}/verify`, {
    method: 'POST',
  });
}

export async function rejectPaidChore(
  id: string,
  reopen: boolean = true
): Promise<{ chore: PaidChore; message: string }> {
  return fetchApi<{ chore: PaidChore; message: string }>(`/paid-chores/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reopen }),
  });
}

export async function getEarnings(userId?: number): Promise<{
  user: { id: number; displayName: string; color: string };
  totalEarnings: number;
  history: Earning[];
}> {
  const params = userId ? `?userId=${userId}` : '';
  return fetchApi(`/paid-chores/earnings${params}`);
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const response = await fetchApi<{ leaderboard: LeaderboardEntry[] }>('/paid-chores/leaderboard');
  return response.leaderboard;
}
