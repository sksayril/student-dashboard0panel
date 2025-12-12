/**
 * Courses API Endpoints
 * All course-related API calls
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config';
import { buildHeaders, handleResponse, handleNetworkError, fetchWithTimeout, isDemoMode } from '../utils';
import { 
  ApiResponse, 
  CourseFiltersRequest, 
  CoursesResponse, 
  CourseDetailsResponse, 
  CourseLessonsResponse,
  EnrollmentRequest,
  EnrollmentData,
  WaitlistResponse,
  EnrolledCoursesResponse,
  EnrolledCoursesWithProgressResponse,
  CourseProgressResponse,
  UpdateLessonProgressRequest,
  UpdateLessonProgressResponse,
  StudentDashboardResponse,
} from '../types';

/**
 * Courses API endpoints
 */
export const coursesApi = {
  /**
   * Get Available Courses with Filters
   * Fetches courses available for enrollment with optional filters
   */
  getCourses: async (filters?: CourseFiltersRequest): Promise<ApiResponse<CoursesResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Courses not available in demo mode',
          errors: [],
        };
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters?.page) {
        queryParams.append('page', filters.page.toString());
      }
      if (filters?.limit) {
        queryParams.append('limit', filters.limit.toString());
      }
      if (filters?.level) {
        queryParams.append('level', filters.level);
      }
      if (filters?.minRating !== undefined) {
        queryParams.append('minRating', filters.minRating.toString());
      }
      if (filters?.maxRating !== undefined) {
        queryParams.append('maxRating', filters.maxRating.toString());
      }
      if (filters?.minPrice !== undefined) {
        queryParams.append('minPrice', filters.minPrice.toString());
      }
      if (filters?.maxPrice !== undefined) {
        queryParams.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters?.sort) {
        queryParams.append('sort', filters.sort);
      }

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}${API_ENDPOINTS.COURSES.FILTERS}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<CoursesResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Course Details by ID
   * Fetches complete course information including sections, lessons, and enrollment status
   * @param courseId - Course ObjectId or slug
   */
  getCourseDetails: async (courseId: string): Promise<ApiResponse<CourseDetailsResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Course details not available in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.COURSES.DETAILS}/${courseId}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<CourseDetailsResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Course Lessons
   * Fetches all lessons and sections for a specific course with detailed lesson information
   * @param courseId - Course ObjectId
   */
  getCourseLessons: async (courseId: string): Promise<ApiResponse<CourseLessonsResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Course lessons not available in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.COURSES.LESSONS}/${courseId}/lessons`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<CourseLessonsResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Enroll in Course
   * Enrolls the student in a course with optional coupon code and batch ID
   * @param courseId - Course ObjectId or slug
   * @param enrollmentData - Optional coupon code and batch ID
   */
  enrollInCourse: async (
    courseId: string,
    enrollmentData?: EnrollmentRequest
  ): Promise<ApiResponse<EnrollmentData | WaitlistResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Enrollment not available in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.COURSES.ENROLL}/${courseId}/enroll`;
      
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify(enrollmentData || {}),
      });

      return handleResponse<EnrollmentData | WaitlistResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Enrolled Courses
   * Returns a list of courses the student is enrolled in
   * @param filters - Optional pagination and status filters
   */
  getEnrolledCourses: async (filters?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'completed' | 'cancelled' | 'expired' | 'pending_payment' | 'reserved';
  }): Promise<ApiResponse<EnrolledCoursesResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Enrolled courses not available in demo mode',
          errors: [],
        };
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters?.page) {
        queryParams.append('page', filters.page.toString());
      }
      if (filters?.limit) {
        queryParams.append('limit', filters.limit.toString());
      }
      if (filters?.status) {
        queryParams.append('status', filters.status);
      }

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}${API_ENDPOINTS.COURSES.ENROLLED}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<EnrolledCoursesResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Enrolled Courses with Progress
   * Returns all enrolled courses with detailed lesson-wise progress
   * @param filters - Optional pagination and status filters
   */
  getEnrolledCoursesWithProgress: async (filters?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'completed' | 'cancelled' | 'expired' | 'pending_payment' | 'reserved';
  }): Promise<ApiResponse<EnrolledCoursesWithProgressResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Enrolled courses with progress not available in demo mode',
          errors: [],
        };
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters?.page) {
        queryParams.append('page', filters.page.toString());
      }
      if (filters?.limit) {
        queryParams.append('limit', filters.limit.toString());
      }
      if (filters?.status) {
        queryParams.append('status', filters.status);
      }

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}${API_ENDPOINTS.COURSES.ENROLLED_WITH_PROGRESS}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<EnrolledCoursesWithProgressResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Course Progress
   * Returns lesson-wise progress for a specific enrolled course
   * @param courseId - Course ObjectId
   */
  getCourseProgress: async (courseId: string): Promise<ApiResponse<CourseProgressResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Course progress not available in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.COURSES.PROGRESS}/${courseId}/progress`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<CourseProgressResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Update Lesson Progress
   * Mark a lesson as completed or incomplete for a specific enrolled course
   * @param courseId - Course ObjectId
   * @param progressData - Lesson ID and completion status
   */
  updateLessonProgress: async (
    courseId: string,
    progressData: UpdateLessonProgressRequest
  ): Promise<ApiResponse<UpdateLessonProgressResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Lesson progress update not available in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.COURSES.PROGRESS}/${courseId}/progress`;
      
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify(progressData),
      });

      return handleResponse<UpdateLessonProgressResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Student Dashboard
   * Returns comprehensive dashboard data including enrolled courses, completion status, quiz performance, and progress metrics
   */
  getStudentDashboard: async (): Promise<ApiResponse<StudentDashboardResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Dashboard data not available in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.COURSES.DASHBOARD}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<StudentDashboardResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Map student level to course level filter
   * Converts student registration level to API level parameter
   * - Junior -> beginner
   * - Intermediate -> intermediate
   * - Advanced/Senior -> advanced
   */
  mapStudentLevelToCourseLevel: (studentLevel: string): 'beginner' | 'intermediate' | 'advanced' | 'all' => {
    const levelMap: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'all'> = {
      'junior': 'beginner',
      'intermediate': 'intermediate',
      'advanced': 'advanced',
      'senior': 'advanced', // Senior maps to advanced as per API docs
    };
    
    return levelMap[studentLevel.toLowerCase()] || 'all';
  },
};

