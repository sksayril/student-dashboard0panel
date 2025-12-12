/**
 * Location API Endpoints
 * Real-time location tracking API calls
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config';
import { buildHeaders, handleResponse, handleNetworkError, fetchWithTimeout, isDemoMode } from '../utils';
import {
  ApiResponse,
  UpdateLocationRequest,
  UpdateLocationResponse,
  LocationData,
  LocationHistoryResponse,
  NearbyLocationsResponse,
} from '../types';

/**
 * Location API endpoints
 */
export const locationApi = {
  /**
   * Update Location (Real-time)
   * Update user's current location
   */
  updateLocation: async (locationData: UpdateLocationRequest): Promise<ApiResponse<UpdateLocationResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Location tracking not available in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.LOCATION.UPDATE}`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify(locationData),
      });

      return handleResponse<UpdateLocationResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Current Location
   * Get the user's current active location
   */
  getCurrentLocation: async (): Promise<ApiResponse<LocationData>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Location not available in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.LOCATION.CURRENT}`;
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<LocationData>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Location History
   * Get location history with pagination and date filtering
   */
  getLocationHistory: async (
    page: number = 1,
    limit: number = 50,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<LocationHistoryResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Location history not available in demo mode',
          errors: [],
        };
      }

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${API_BASE_URL}${API_ENDPOINTS.LOCATION.HISTORY}?${params.toString()}`;
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<LocationHistoryResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Nearby Locations
   * Find nearby locations within a specified radius
   */
  getNearbyLocations: async (
    latitude: number,
    longitude: number,
    radius: number = 1000,
    userType?: string,
    excludeSelf: boolean = true
  ): Promise<ApiResponse<NearbyLocationsResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Nearby locations not available in demo mode',
          errors: [],
        };
      }

      const params = new URLSearchParams();
      params.append('latitude', latitude.toString());
      params.append('longitude', longitude.toString());
      params.append('radius', radius.toString());
      if (userType) params.append('userType', userType);
      params.append('excludeSelf', excludeSelf.toString());

      const url = `${API_BASE_URL}${API_ENDPOINTS.LOCATION.NEARBY}?${params.toString()}`;
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<NearbyLocationsResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Stop Location Tracking
   * Stop location tracking for the current user
   */
  stopLocationTracking: async (): Promise<ApiResponse> => {
    try {
      if (isDemoMode()) {
        return {
          success: true,
          message: 'Location tracking stopped (demo mode)',
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.LOCATION.STOP}`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: buildHeaders(true),
      });

      return handleResponse(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },
};

