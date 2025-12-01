/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// API Base URL
export const API_BASE_URL = 'https://7bb3rgsz-3000.inc1.devtunnels.ms';

// API Endpoints
export const API_ENDPOINTS = {
  // Student endpoints
  STUDENTS: {
    SIGNUP: '/api/students/signup',
    LOGIN: '/api/students/login',
    LOGOUT: '/api/students/logout',
    PROFILE: '/api/students/profile',
    UPDATE_PROFILE: '/api/students/profile',
  },
} as const;

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Demo token identifier
export const DEMO_TOKEN = 'demo-token';

