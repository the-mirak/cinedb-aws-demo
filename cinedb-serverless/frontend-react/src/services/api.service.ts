import { authService } from './auth.service';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Get authentication headers
  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    try {
      // Check for demo mode first
      const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
      if (isDemoMode) {
        const demoToken = localStorage.getItem('demoToken');
        if (demoToken) {
          headers['Authorization'] = `Bearer ${demoToken}`;
          return headers;
        }
      }

      // Otherwise, use real Cognito session
      const session = await authService.getCurrentSession();
      if (session) {
        const idToken = session.getIdToken().getJwtToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    return headers;
  }

  // Generic request handler
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        undefined,
        error
      );
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Upload file (multipart/form-data)
  async upload<T>(endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const headers: HeadersInit = {};
      
      // Check for demo mode first
      const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
      if (isDemoMode) {
        const demoToken = localStorage.getItem('demoToken');
        if (demoToken) {
          headers['Authorization'] = `Bearer ${demoToken}`;
        }
      } else {
        // Otherwise, use real Cognito session
        const session = await authService.getCurrentSession();
        if (session) {
          const idToken = session.getIdToken().getJwtToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        }
      }

      const response = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Upload failed',
        undefined,
        error
      );
    }
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Movie API endpoints (adapt these to match your actual Lambda endpoints)
export const movieApi = {
  // Get all movies
  getMovies: async (params?: { genre?: string; year?: string; search?: string }) => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return apiClient.get<any>(`/movies${queryString}`);
  },

  // Get single movie
  getMovie: async (id: string) => {
    return apiClient.get<any>(`/movies/${id}`);
  },

  // Create movie
  createMovie: async (movieData: any) => {
    return apiClient.post<any>('/movies', movieData);
  },

  // Upload movie with poster (multipart/form-data)
  uploadMovie: async (formData: FormData) => {
    return apiClient.upload<any>('/movies', formData);
  },

  // Update movie with poster (multipart/form-data)
  updateMovieWithPoster: async (id: string, formData: FormData) => {
    return apiClient.upload<any>(`/movies/${id}`, formData, 'PUT');
  },

  // Update movie
  updateMovie: async (id: string, movieData: any) => {
    return apiClient.put<any>(`/movies/${id}`, movieData);
  },

  // Delete movie
  deleteMovie: async (id: string) => {
    return apiClient.delete<any>(`/movies/${id}`);
  },
};

// Admin API endpoints
export const adminApi = {
  // Get all users
  getUsers: async () => {
    return apiClient.get<any>('/admin/users');
  },

  // Get stats
  getStats: async () => {
    return apiClient.get<any>('/admin/stats');
  },
};

export { apiClient as default };
