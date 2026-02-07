// apps/web/src/types/api.ts
// API related types

export interface ApiError {
  code: string;
  message?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface UploadedFile {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

// Generic success response
export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// Auth responses
export interface LoginResponse {
  success: boolean;
  user: {
    id: number;
    displayName: string;
    role: string;
  };
}

export interface SessionResponse {
  authenticated: boolean;
  user?: {
    id: number;
    displayName: string;
    email: string | null;
    role: string;
    color: string | null;
    avatarUrl: string | null;
    impersonatedBy?: number;
  };
  household?: {
    name: string;
    brandColor: string;
    logoUrl: string | null;
  };
}
