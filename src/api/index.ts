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
  Agent,
  User,
  LoginResponse,
  SignupRequest,
  LoginRequest,
  UpdateProfileRequest,
  HttpMethod,
  RequestOptions,
  Course,
  CourseRating,
  CourseTutor,
  CourseTutorDetail,
  CoursePagination,
  CoursesResponse,
  CourseFiltersRequest,
  CourseDetail,
  CourseCategory,
  Lesson,
  LessonResource,
  CourseSection,
  Enrollment,
  EnrollmentProgress,
  CourseDetailsResponse,
  CourseLessonsResponse,
  EnrollmentRequest,
  EnrollmentData,
  WaitlistResponse,
  EnrolledCoursesResponse,
  EnrolledCoursesWithProgressResponse,
  EnrolledCourseItem,
  EnrolledCourseWithProgress,
  LessonWithProgress,
  SectionWithProgress,
  CourseProgressResponse,
  UpdateLessonProgressRequest,
  UpdateLessonProgressResponse,
  StudentDashboardResponse,
  DashboardOverview,
  DashboardGrowth,
  DashboardEnrolledCourse,
  DashboardQuizPerformance,
  DashboardQuizData,
  DashboardProgress,
  SubscriptionPlan,
  Subscription,
  MySubscriptionsResponse,
  ActiveSubscriptionResponse,
  AvailablePlansResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  UpdateLocationRequest,
  UpdateLocationResponse,
  LocationData,
  LocationHistoryResponse,
  NearbyLocationsResponse,
  NearbyLocation,
  DeviceInfo,
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
export { coursesApi } from './endpoints/courses';
export { subscriptionApi } from './endpoints/subscription';
export { locationApi } from './endpoints/location';

// Main API object (for backward compatibility)
import { studentApi } from './endpoints/student';
import { coursesApi } from './endpoints/courses';
import { subscriptionApi } from './endpoints/subscription';
import { locationApi } from './endpoints/location';

export const api = {
  // Student endpoints
  signup: studentApi.signup,
  login: (email: string, password: string) => 
    studentApi.login({ email, password }),
  logout: studentApi.logout,
  getProfile: studentApi.getProfile,
  updateProfile: studentApi.updateProfile,
  // Course endpoints
  getCourses: coursesApi.getCourses,
  getCourseDetails: coursesApi.getCourseDetails,
  getCourseLessons: coursesApi.getCourseLessons,
  enrollInCourse: coursesApi.enrollInCourse,
  getEnrolledCourses: coursesApi.getEnrolledCourses,
  getEnrolledCoursesWithProgress: coursesApi.getEnrolledCoursesWithProgress,
  getCourseProgress: coursesApi.getCourseProgress,
  updateLessonProgress: coursesApi.updateLessonProgress,
  getStudentDashboard: coursesApi.getStudentDashboard,
  mapStudentLevelToCourseLevel: coursesApi.mapStudentLevelToCourseLevel,
  // Subscription endpoints
  getMySubscriptions: subscriptionApi.getMySubscriptions,
  getActiveSubscription: subscriptionApi.getActiveSubscription,
  getAvailablePlans: subscriptionApi.getAvailablePlans,
  createSubscriptionOrder: subscriptionApi.createOrder,
  verifySubscriptionPayment: subscriptionApi.verifyPayment,
  // Location endpoints
  updateLocation: locationApi.updateLocation,
  getCurrentLocation: locationApi.getCurrentLocation,
  getLocationHistory: locationApi.getLocationHistory,
  getNearbyLocations: locationApi.getNearbyLocations,
  stopLocationTracking: locationApi.stopLocationTracking,
};
