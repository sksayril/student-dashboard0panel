/**
 * API Types and Interfaces
 * All TypeScript types for API requests and responses
 */

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// Address interface
export interface Address {
  areaname: string;
  city: string;
  pincode: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

// Student Level interface
export interface StudentLevel {
  id: string;
  name: string;
  description?: string;
  classRange?: string;
}

// Agent interface
export interface Agent {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
}

// User/Student interface (for profile response)
export interface User {
  id: string;
  studentId: string;
  name: string;
  email: string;
  contactNumber: string;
  profileImage: string | null;
  studentLevel: StudentLevel | string;
  agent?: Agent;
  addresses?: Address[];
  role: string;
  isActive: boolean;
  lastLogin: string;
  createdAt?: string;
  updatedAt?: string;
}

// Login Response (includes token)
export interface LoginResponse extends User {
  token: string;
}

// Signup Request
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  studentLevel: string;
  contactNumber: string;
  profileImage?: File;
  addresses?: Address[];
  agentId?: string; // Optional - Agent ObjectId who referred/onboarded this student
}

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
}

// Update Profile Request
export interface UpdateProfileRequest {
  name?: string;
  contactNumber?: string;
  studentLevel?: string;
  addresses?: Address[];
  profileImage?: File | string; // File for upload or string URL
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request Options
export interface RequestOptions {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: BodyInit | null;
  timeout?: number;
  requireAuth?: boolean;
}

// Course Types
export interface CourseRating {
  average: number;
  count: number;
}

export interface CourseTutor {
  _id: string;
  name: string;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl: string;
  price: number;
  currency: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  rating: CourseRating;
  lessonsCount: number;
  durationMinutes: number;
  tutorId: CourseTutor;
  tags: string[];
  createdAt: string;
}

export interface CoursePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CoursesResponse {
  items: Course[];
  pagination: CoursePagination;
}

// Course Filters Request
export interface CourseFiltersRequest {
  page?: number;
  limit?: number;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  minRating?: number;
  maxRating?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'rating' | 'price-low' | 'price-high' | 'newest';
}

// Course Detail Types
export interface CourseCategory {
  _id: string;
  name: string;
}

export interface CourseTutorDetail extends CourseTutor {
  email?: string;
}

export interface CourseDetail extends Course {
  longDescription?: string;
  language?: string;
  visibility?: 'public' | 'private';
  isPublished?: boolean;
  isApproved?: boolean;
  tutorId: CourseTutorDetail;
  category?: CourseCategory;
  updatedAt?: string;
}

export interface LessonResource {
  _id: string;
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'video' | 'image' | 'other';
}

export interface Lesson {
  _id: string;
  courseId?: string;
  sectionId?: string;
  title: string;
  description: string;
  contentType: 'video' | 'text' | 'quiz' | 'assignment' | 'other';
  contentUrl?: string;
  order: number;
  durationMinutes: number;
  isPreview: boolean;
  resources?: LessonResource[];
  createdAt: string;
  updatedAt?: string;
}

export interface CourseSection {
  _id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

export interface EnrollmentProgress {
  lessonsCompleted: number;
  totalLessons: number;
  percentage: number;
  completedLessons: string[];
  lastAccessedAt?: string;
  lastAccessedLesson?: string;
}

export interface Enrollment {
  progress: EnrollmentProgress;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
}

export interface CourseDetailsResponse {
  course: CourseDetail;
  sections: CourseSection[];
  lessons: Lesson[];
  enrollment: Enrollment | null;
  isEnrolled: boolean;
}

export interface CourseLessonsResponse {
  course: {
    _id: string;
    title: string;
    thumbnailUrl: string;
  };
  sections: CourseSection[];
  lessons: Lesson[];
  enrollment: Enrollment | null;
}

// Enrollment Types
export interface EnrollmentRequest {
  couponCode?: string;
  batchId?: string;
}

export interface StudentInfo {
  _id: string;
  name: string;
  email: string;
}

export interface BatchInfo {
  _id: string;
  code?: string;
  title?: string;
}

export interface EnrollmentData {
  _id: string;
  studentId: StudentInfo | string;
  courseId: {
    _id: string;
    title: string;
    thumbnailUrl: string;
  } | string;
  batchId: BatchInfo | string | null;
  enrolledVia: 'direct' | 'batch';
  pricePaid: number;
  couponUsed: string | null;
  couponDiscount: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired' | 'pending_payment' | 'reserved';
  reservationId?: string;
  progress: EnrollmentProgress;
  enrolledAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentResponse {
  success: true;
  message: string;
  data: EnrollmentData;
}

export interface WaitlistResponse {
  waitlistId: string;
  position: number;
  batchId: string;
  batchTitle: string;
}

// Enrolled Course Types
export interface EnrolledCourseItem {
  _id: string;
  studentId: string;
  courseId: {
    _id: string;
    title: string;
    thumbnailUrl: string;
    price: number;
    rating: CourseRating;
  };
  pricePaid: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired' | 'pending_payment' | 'reserved';
  progress: EnrollmentProgress;
  enrolledAt: string;
}

export interface EnrolledCoursesResponse {
  items: EnrolledCourseItem[];
  pagination: CoursePagination;
}

// Enrolled Course with Progress Types
export interface LessonWithProgress extends Lesson {
  isCompleted: boolean;
  completedAt: string | null;
}

export interface SectionWithProgress extends CourseSection {
  lessons: LessonWithProgress[];
  lessonsCount: number;
  completedLessons: number;
  completionPercentage: number;
}

export interface EnrolledCourseWithProgress {
  enrollment: {
    _id: string;
    status: 'active' | 'completed' | 'cancelled' | 'expired' | 'pending_payment' | 'reserved';
    enrolledAt: string;
    completedAt: string | null;
    pricePaid: number;
    enrolledVia: 'direct' | 'batch';
  };
  course: CourseDetail;
  progress: {
    lessonsCompleted: number;
    totalLessons: number;
    percentage: number;
    isCompleted: boolean;
    lastAccessedAt?: string;
    lastAccessedLesson?: string;
  };
  sections: SectionWithProgress[];
  lessons: LessonWithProgress[];
}

export interface EnrolledCoursesWithProgressResponse {
  items: EnrolledCourseWithProgress[];
  pagination: CoursePagination;
}

// Course Progress Types
export interface CourseProgressResponse {
  course: {
    _id: string;
    title: string;
  };
  enrollment: {
    status: 'active' | 'completed' | 'cancelled' | 'expired' | 'pending_payment' | 'reserved';
    enrolledAt: string;
    completedAt: string | null;
  };
  progress: {
    lessonsCompleted: number;
    totalLessons: number;
    percentage: number;
    isCompleted: boolean;
    lastAccessedAt?: string;
    lastAccessedLesson?: string;
  };
  sections: SectionWithProgress[];
  lessons: LessonWithProgress[];
}

// Update Lesson Progress Types
export interface UpdateLessonProgressRequest {
  lessonId: string;
  completed?: boolean; // default: true
}

export interface UpdateLessonProgressResponse {
  lesson: {
    _id: string;
    title: string;
    contentType: string;
    order: number;
    isCompleted: boolean;
  };
  progress: {
    lessonsCompleted: number;
    totalLessons: number;
    percentage: number;
    isCompleted: boolean;
    lastAccessedAt?: string;
    lastAccessedLesson?: string;
  };
  enrollment: {
    status: 'active' | 'completed' | 'cancelled' | 'expired' | 'pending_payment' | 'reserved';
    completedAt: string | null;
  };
}

// Student Dashboard Types
export interface DashboardOverview {
  totalCourses: number;
  activeCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  completedQuizzes: number;
  totalAssignments: number;
  completedAssignments: number;
  totalTimeSpentMinutes: number;
  averageCourseCompletion: number;
  averageQuizScore: number;
}

export interface DashboardGrowth {
  enrollmentGrowth: number;
  completionGrowth: number;
  recentEnrollments: number;
  recentCompleted: number;
}

export interface DashboardCourseProgress {
  lessonsCompleted: number;
  totalLessons: number;
  percentage: number;
  isCompleted: boolean;
  quizzesCompleted: number;
  totalQuizzes: number;
  assignmentsCompleted: number;
  totalAssignments: number;
}

export interface DashboardEnrolledCourse {
  enrollment: {
    _id: string;
    status: 'active' | 'completed' | 'cancelled' | 'expired' | 'pending_payment' | 'reserved';
    enrolledAt: string;
    completedAt: string | null;
  };
  course: {
    _id: string;
    title: string;
    thumbnailUrl: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'all';
    category?: CourseCategory;
    rating: CourseRating;
  };
  progress: DashboardCourseProgress;
}

export interface DashboardQuizPerformance {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  score: number;
  maxScore: number;
  isCompleted: boolean;
  completedAt: string;
}

export interface DashboardQuizData {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  quizzes: DashboardQuizPerformance[];
}

export interface DashboardProgress {
  overallCompletion: number;
  quizCompletion: number;
  assignmentCompletion: number;
}

// Subscription Types
export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  planType: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  originalPrice?: number | null;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  discountPercentage?: number;
}

export interface SubscriptionPlanDetail extends SubscriptionPlan {
  id: string;
}

export interface Subscription {
  _id: string;
  studentId: string;
  planId: SubscriptionPlan | string;
  planType: 'monthly' | 'quarterly' | 'yearly';
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponId?: string | null;
  couponCode?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  paymentStatus: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  daysRemaining?: number;
  isExpired?: boolean;
  nextRechargeDate?: string | null;
  nextRechargeAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MySubscriptionsResponse {
  items: Subscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ActiveSubscriptionResponse {
  hasActiveSubscription: boolean;
  canEnrollInCourses: boolean;
  subscription: Subscription | null;
  daysRemaining?: number;
  nextRechargeDate?: string | null;
}

export interface AvailablePlansResponse {
  plans: SubscriptionPlan[];
}

export interface CreateOrderRequest {
  planId: string;
  couponCode?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  subscription: {
    id: string;
    plan: SubscriptionPlan;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    couponCode: string | null;
  };
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse extends Subscription {}

// Location Tracking Types
export interface DeviceInfo {
  platform?: string;
  userAgent?: string;
  appVersion?: string;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
}

export interface LocationData {
  _id: string;
  userId: string;
  userType: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  isActive: boolean;
  lastUpdated: string;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateLocationResponse {
  _id: string;
  userId: string;
  userType: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  lastUpdated: string;
  isActive: boolean;
}

export interface LocationHistoryResponse {
  items: LocationData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NearbyLocation {
  userId: string;
  userType: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  distance: number;
  distanceKm: string;
  lastUpdated: string;
}

export interface NearbyLocationsResponse {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  count: number;
  locations: NearbyLocation[];
}

export interface StudentDashboardResponse {
  overview: DashboardOverview;
  growth: DashboardGrowth;
  enrolledCourses: DashboardEnrolledCourse[];
  quizPerformance: DashboardQuizData;
  progress: DashboardProgress;
}

