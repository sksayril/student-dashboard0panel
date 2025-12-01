/**
 * API Utility Functions
 * Helper functions for API requests
 */

import { DEMO_TOKEN, REQUEST_TIMEOUT } from './config';
import { ApiResponse, RequestOptions } from './types';

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Check if current session is demo mode
 */
export const isDemoMode = (): boolean => {
  const token = getAuthToken();
  return !token || token === DEMO_TOKEN;
};

/**
 * Build request headers
 */
export const buildHeaders = (
  requireAuth: boolean = false,
  contentType: string = 'application/json'
): HeadersInit => {
  const headers: HeadersInit = {};

  // Set Content-Type only if not FormData
  if (contentType !== 'multipart/form-data') {
    headers['Content-Type'] = contentType;
  }

  // Add authorization header if required
  if (requireAuth) {
    const token = getAuthToken();
    if (token && token !== DEMO_TOKEN) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Handle API response
 */
export const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  try {
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'An error occurred',
        errors: data.errors || [],
      };
    }

    return {
      success: true,
      message: data.message || 'Success',
      data: data.data || data,
    };
  } catch (error) {
    console.error('Error parsing response:', error);
    return {
      success: false,
      message: 'Failed to parse server response',
      errors: [],
    };
  }
};

/**
 * Create a fetch request with timeout
 */
export const fetchWithTimeout = async (
  url: string,
  options: RequestOptions = {}
): Promise<Response> => {
  const { timeout = REQUEST_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    throw error;
  }
};

/**
 * Handle network errors
 */
export const handleNetworkError = (error: unknown): ApiResponse => {
  console.error('Network error:', error);

  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return {
        success: false,
        message: 'Request timeout. Please check your connection and try again.',
        errors: [],
      };
    }

    if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'Network error. Please check your internet connection.',
        errors: [],
      };
    }
  }

  return {
    success: false,
    message: 'An unexpected error occurred. Please try again.',
    errors: [],
  };
};

/**
 * Build full API URL
 */
export const buildApiUrl = (endpoint: string, baseUrl?: string): string => {
  const base = baseUrl || import.meta.env.VITE_API_BASE_URL || '';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};

