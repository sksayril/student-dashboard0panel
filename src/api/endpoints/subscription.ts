/**
 * Subscription API Endpoints
 * All subscription-related API calls
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config';
import { buildHeaders, handleResponse, handleNetworkError, fetchWithTimeout, isDemoMode } from '../utils';
import {
  ApiResponse,
  MySubscriptionsResponse,
  ActiveSubscriptionResponse,
  AvailablePlansResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  Subscription,
} from '../types';

/**
 * Subscription API endpoints
 */
export const subscriptionApi = {
  /**
   * Get My Subscriptions
   * Returns all subscriptions (active, expired, cancelled) for the student
   */
  getMySubscriptions: async (
    page: number = 1,
    limit: number = 10,
    status?: 'active' | 'expired' | 'cancelled' | 'pending'
  ): Promise<ApiResponse<MySubscriptionsResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Subscriptions not available in demo mode',
          errors: [],
        };
      }

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) {
        params.append('status', status);
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTION.MY_SUBSCRIPTIONS}?${params.toString()}`;
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<MySubscriptionsResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Active Subscription
   * Returns the student's currently active subscription
   */
  getActiveSubscription: async (): Promise<ApiResponse<ActiveSubscriptionResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: true,
          message: 'No active subscription found',
          data: {
            hasActiveSubscription: false,
            canEnrollInCourses: false,
            subscription: null,
            daysRemaining: 0,
            nextRechargeDate: null,
          },
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTION.ACTIVE}`;
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<ActiveSubscriptionResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Get Available Subscription Plans
   * Returns all available subscription plans that students can purchase
   */
  getAvailablePlans: async (
    planType?: 'monthly' | 'quarterly' | 'yearly'
  ): Promise<ApiResponse<AvailablePlansResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Subscription plans not available in demo mode',
          errors: [],
        };
      }

      const params = new URLSearchParams();
      if (planType) {
        params.append('planType', planType);
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTION.PLANS}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: buildHeaders(true),
      });

      return handleResponse<AvailablePlansResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Create Razorpay Order for Subscription
   * Creates a Razorpay order for purchasing a subscription plan
   */
  createOrder: async (request: CreateOrderRequest): Promise<ApiResponse<CreateOrderResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Cannot create subscription order in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTION.CREATE_ORDER}`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify(request),
      });

      return handleResponse<CreateOrderResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },

  /**
   * Verify Razorpay Payment
   * Verifies Razorpay payment and activates the subscription
   */
  verifyPayment: async (request: VerifyPaymentRequest): Promise<ApiResponse<VerifyPaymentResponse>> => {
    try {
      if (isDemoMode()) {
        return {
          success: false,
          message: 'Cannot verify payment in demo mode',
          errors: [],
        };
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.SUBSCRIPTION.VERIFY_PAYMENT}`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify(request),
      });

      return handleResponse<VerifyPaymentResponse>(response);
    } catch (error) {
      return handleNetworkError(error);
    }
  },
};

