/**
 * Student API Endpoints
 * All student-related API calls
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config';
import { buildHeaders, handleResponse, handleNetworkError, fetchWithTimeout, isDemoMode } from '../utils';
import { ApiResponse, SignupRequest, LoginRequest, LoginResponse, UpdateProfileRequest } from '../types';

/**
 * Student API endpoints
 */
export const studentApi = {
  /**
   * Student Signup
   * Creates a new student account
   */
  signup: async (signupData: SignupRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      const formData = new FormData();
      
      // Required fields
      formData.append('name', signupData.name);
      formData.append('email', signupData.email);
      formData.append('password', signupData.password);
      formData.append('studentLevel', signupData.studentLevel);
      formData.append('contactNumber', signupData.contactNumber);

      // Optional agent ID (referral code)
      if (signupData.agentId && signupData.agentId.trim() !== '') {
        formData.append('agentId', signupData.agentId.trim());
      }

      // Optional profile image
      if (signupData.profileImage) {
        formData.append('profileImage', signupData.profileImage);
      }

      // Optional addresses
      if (signupData.addresses && signupData.addresses.length > 0) {
        formData.append('addresses', JSON.stringify(signupData.addresses));
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.STUDENTS.SIGNUP}`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: buildHeaders(false, 'multipart/form-data'),
        body: formData,
      });

      return handleResponse<LoginResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Student Login
   * Authenticates a student and returns token
   */
  login: async (loginData: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.STUDENTS.LOGIN}`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: buildHeaders(false),
        body: JSON.stringify(loginData),
      });

      return handleResponse<LoginResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Student Logout
   * Logs out the current student session
   */
  logout: async (): Promise<ApiResponse> => {
    try {
      // Skip API call for demo mode
      if (isDemoMode()) {
        return {
          success: true,
          message: 'Logged out successfully',
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.STUDENTS.LOGOUT}`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: buildHeaders(true),
      });

      return handleResponse(response);
    } catch (error) {
      // Even if API fails, return success for local logout
      return {
        success: true,
        message: 'Logged out from this device',
      };
    }
  },

  /**
   * Get Student Profile
   * Fetches the current student's profile
   */
  getProfile: async (): Promise<ApiResponse<LoginResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Profile not available in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.STUDENTS.PROFILE}`;
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<LoginResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Update Student Profile
   * Updates the current student's profile
   * Supports both JSON and multipart/form-data (for image uploads)
   */
  updateProfile: async (profileData: UpdateProfileRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Cannot update profile in demo mode',
          errors: [],
        };
      }

      // Check if profileImage is a File (needs multipart/form-data)
      const hasFileUpload = profileData.profileImage instanceof File;
      
      if (hasFileUpload) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        if (profileData.name) formData.append('name', profileData.name);
        if (profileData.contactNumber) formData.append('contactNumber', profileData.contactNumber);
        if (profileData.studentLevel) formData.append('studentLevel', profileData.studentLevel);
        if (profileData.profileImage instanceof File) {
          formData.append('profileImage', profileData.profileImage);
        }
        if (profileData.addresses && profileData.addresses.length > 0) {
          formData.append('addresses', JSON.stringify(profileData.addresses));
        }

        const url = `${API_BASE_URL}${API_ENDPOINTS.STUDENTS.UPDATE_PROFILE}`;
        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: buildHeaders(true, 'multipart/form-data'),
          body: formData,
        });

        return handleResponse<LoginResponse>(response);
      } else {
        // Use JSON for non-file updates
        const jsonData: any = {};
        
        if (profileData.name) jsonData.name = profileData.name;
        if (profileData.contactNumber) jsonData.contactNumber = profileData.contactNumber;
        if (profileData.studentLevel) jsonData.studentLevel = profileData.studentLevel;
        if (typeof profileData.profileImage === 'string') {
          jsonData.profileImage = profileData.profileImage;
        }
        if (profileData.addresses && profileData.addresses.length > 0) {
          jsonData.addresses = profileData.addresses;
        }

        const url = `${API_BASE_URL}${API_ENDPOINTS.STUDENTS.UPDATE_PROFILE}`;
        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: buildHeaders(true),
          body: JSON.stringify(jsonData),
        });

        return handleResponse<LoginResponse>(response);
      }
    } catch (error) {
      return handleNetworkError(error);
    }
  },
};

