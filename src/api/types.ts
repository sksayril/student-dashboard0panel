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
}

// User/Student interface
export interface User {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  profileImage: string | null;
  studentLevel: StudentLevel | string;
  role: string;
  isActive: boolean;
  lastLogin: string;
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

