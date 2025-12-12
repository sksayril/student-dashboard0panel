/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// API Base URL
export const API_BASE_URL = 'https://7cvccltb-3023.inc1.devtunnels.ms';

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
  // Course endpoints
  COURSES: {
    FILTERS: '/api/student/courses/filters',
    DETAILS: '/api/student/courses', // Will append /:courseId
    LESSONS: '/api/student/courses', // Will append /:courseId/lessons
    ENROLL: '/api/student/courses', // Will append /:courseId/enroll
    ENROLLED: '/api/student/courses',
    ENROLLED_WITH_PROGRESS: '/api/student/courses/with-progress',
    PROGRESS: '/api/student/courses', // Will append /:courseId/progress
    DASHBOARD: '/api/student/courses/dashboard',
  },
  // Subscription endpoints
  SUBSCRIPTION: {
    MY_SUBSCRIPTIONS: '/api/student/subscription/my-subscriptions',
    ACTIVE: '/api/student/subscription/active',
    PLANS: '/api/student/subscription/plans',
    CREATE_ORDER: '/api/student/subscription/create-order',
    VERIFY_PAYMENT: '/api/student/subscription/verify-payment',
  },
  // Location endpoints
  LOCATION: {
    UPDATE: '/api/location/update',
    CURRENT: '/api/location/current',
    HISTORY: '/api/location/history',
    NEARBY: '/api/location/nearby',
    STOP: '/api/location/stop',
    ACTIVE: '/api/location/active',
  },
} as const;

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Demo token identifier
export const DEMO_TOKEN = 'demo-token';

