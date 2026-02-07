// apps/web/src/api/upload.ts
// File upload API endpoints
// FIXED: All endpoints now match actual backend router paths
//   POST /upload/avatar       → upload.uploadAvatar
//   DELETE /upload/avatar     → upload.deleteAvatar
//   POST /upload/logo         → upload.uploadLogo
//   POST /upload/background   → upload.uploadBackground
//   GET /uploads              → upload.listUploads (returns all types)
//   DELETE /uploads/:id       → upload.deleteUpload (:id = filename)
//   POST /uploads/:id/select  → upload.selectUpload (:id = 'select', body has url+type)

import { apiClient } from './client';

export interface UploadedFile {
  type: string;
  filename: string;
  url: string;
  size: number;
  createdAt: Date;
}

export const uploadApi = {
  // ===========================================================================
  // Avatar uploads
  // ===========================================================================

  /** POST /api/upload/avatar - Upload user avatar as base64 */
  async uploadAvatar(
    image: string,
    mimeType: string,
  ): Promise<{ success: boolean; avatarUrl: string }> {
    return apiClient['post']('/upload/avatar', { image, mimeType });
  },

  /** DELETE /api/upload/avatar - Remove user avatar */
  async deleteAvatar(): Promise<{ success: boolean }> {
    return apiClient['delete']('/upload/avatar', undefined);
  },

  // ===========================================================================
  // Household branding uploads (admin only)
  // ===========================================================================

  /** POST /api/upload/logo - Upload household logo as base64 */
  async uploadLogo(
    image: string,
    mimeType: string,
  ): Promise<{ success: boolean; logoUrl: string }> {
    return apiClient['post']('/upload/logo', { image, mimeType });
  },

  /** POST /api/upload/background - Upload login background as base64 */
  async uploadBackground(
    image: string,
    mimeType: string,
  ): Promise<{ success: boolean; backgroundUrl: string }> {
    return apiClient['post']('/upload/background', { image, mimeType });
  },

  // ===========================================================================
  // Upload management (admin only)
  // ===========================================================================

  /**
   * GET /api/uploads - List ALL uploaded files across all types.
   * Optionally filter client-side by type.
   */
  async listUploads(
    type?: 'logos' | 'backgrounds' | 'avatars',
  ): Promise<{ files: UploadedFile[] }> {
    const data = await apiClient['get']<{ files: UploadedFile[] }>('/uploads', {
      params: undefined,
    });
    if (type) {
      return { files: data.files.filter((f: UploadedFile) => f.type === type) };
    }
    return data;
  },

  /**
   * DELETE /api/uploads/:filename - Delete an uploaded file by filename.
   * Backend searches all type directories for matching filename.
   */
  async deleteUploadedFile(_type: string, filename: string): Promise<{ success: boolean }> {
    return apiClient['delete'](`/uploads/${encodeURIComponent(filename)}`, undefined);
  },

  /**
   * POST /api/uploads/select - Select an existing upload to use as logo or background.
   * Backend expects { url, type } in body where type is 'logo' | 'background'.
   * We use a dummy :id param of 'select' since the backend route is /uploads/:id/select
   * but the actual logic reads from req.body.
   */
  async selectUpload(type: 'logos' | 'backgrounds', url: string): Promise<{ success: boolean }> {
    // Map frontend type names to backend expected values
    const backendType = type === 'logos' ? 'logo' : 'background';
    return apiClient['post']('/uploads/select/select', { url, type: backendType });
  },
};

// ===========================================================================
// Helper functions
// ===========================================================================

/** Convert File to base64 data URL */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Validate file size in MB */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/** Validate image MIME type */
export function validateImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}
