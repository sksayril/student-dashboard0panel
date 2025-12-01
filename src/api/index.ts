/**
 * API Module - Main Export
 * Centralized API exports for the entire application
 */

// Configuration
export { API_BASE_URL, API_ENDPOINTS, REQUEST_TIMEOUT, DEMO_TOKEN } from './config';

// Types
export type {
  ApiResponse,
  Address,
  StudentLevel,
  User,
  LoginResponse,
  SignupRequest,
  LoginRequest,
  HttpMethod,
  RequestOptions,
} from './types';

// Utilities
export {
  getAuthToken,
  isDemoMode,
  buildHeaders,
  handleResponse,
  fetchWithTimeout,
  handleNetworkError,
  buildApiUrl,
} from './utils';

// API Endpoints
export { studentApi } from './endpoints/student';

// Main API object (for backward compatibility)
import { studentApi } from './endpoints/student';

export const api = {
  // Student endpoints
  signup: studentApi.signup,
  login: (email: string, password: string) => 
    studentApi.login({ email, password }),
  logout: studentApi.logout,
  getProfile: studentApi.getProfile,
  updateProfile: studentApi.updateProfile,
};
