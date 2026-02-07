// apps/web/src/api/client.ts
// Base API client class with common functionality

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface ApiError {
  code: string;
  message?: string;
}

export class ApiClient {
  private csrfToken: string | null = null;

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    // Add CSRF token for mutating requests - use X-HabiTrack-CSRF header
    if (this.csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || '')) {
      (headers as Record<string, string>)['X-HabiTrack-CSRF'] = this.csrfToken;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error?.message || `Request failed: ${response.status}`);
      (error as any).code = errorData.error?.code || 'UNKNOWN_ERROR';
      (error as any).status = response.status;
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async getCsrfToken(): Promise<void> {
    if (this.csrfToken) return;
    const response = await fetch(`${API_BASE}/csrf`, {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      this.csrfToken = data.token;
    }
  }

  clearCsrfToken(): void {
    this.csrfToken = null;
  }

  // Convenience methods - public for use via shoppingApi, etc.
  get<T>(
    endpoint: string,
    p0: { params: { limit?: number; before?: string } | undefined },
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    console.log('[ApiClient.post] Starting request to:', endpoint, 'with data:', data);
    try {
      await this.getCsrfToken();
      console.log('[ApiClient.post] Got CSRF token, making request...');
      const result = await this.request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
      console.log('[ApiClient.post] Request successful:', result);
      return result;
    } catch (err) {
      console.error('[ApiClient.post] Request failed:', err);
      throw err;
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    await this.getCsrfToken();
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    await this.getCsrfToken();
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, undefined: undefined): Promise<T> {
    await this.getCsrfToken();
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
