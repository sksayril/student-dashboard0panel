import { useState, useEffect } from 'react';
import { useToast } from './ToastContainer';
import { subscriptionApi } from '../api';
import { Skeleton, SkeletonCard } from './Skeleton';
import {
  ActiveSubscriptionResponse,
  AvailablePlansResponse,
  SubscriptionPlan,
  Subscription,
  CreateOrderRequest,
  VerifyPaymentRequest,
} from '../api/types';
import {
  CheckCircle,
  XCircle,
  Clock,
  Crown,
  CreditCard,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader,
} from 'lucide-react';

interface SubscriptionProps {
  userData?: any;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionPage({ userData }: SubscriptionProps) {
  const { showSuccess, showError } = useToast();
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscriptionResponse | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [mySubscriptions, setMySubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [activeTab, setActiveTab] = useState<'plans' | 'my-subscriptions'>('plans');
  const [planTypeFilter, setPlanTypeFilter] = useState<'all' | 'yearly' | 'quarterly' | 'monthly'>('all');

  useEffect(() => {
    fetchData();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    if (window.Razorpay) {
      return; // Already loaded
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
    };
    document.body.appendChild(script);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchActiveSubscription(),
        fetchAvailablePlans(),
        fetchMySubscriptions(),
      ]);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveSubscription = async () => {
    try {
      const result = await subscriptionApi.getActiveSubscription();
      if (result.success && result.data) {
        setActiveSubscription(result.data);
      }
    } catch (error) {
      console.error('Error fetching active subscription:', error);
    }
  };

  const fetchAvailablePlans = async () => {
    setIsLoadingPlans(true);
    try {
      const result = await subscriptionApi.getAvailablePlans();
      if (result.success && result.data) {
        setAvailablePlans(result.data.plans);
      } else {
        showError(result.message || 'Failed to load subscription plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      showError('Failed to load subscription plans');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchMySubscriptions = async () => {
    try {
      const result = await subscriptionApi.getMySubscriptions(1, 10);
      if (result.success && result.data) {
        setMySubscriptions(result.data.items);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handlePurchasePlan = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsProcessingPayment(true);

    try {
      const orderRequest: CreateOrderRequest = {
        planId: plan._id,
        couponCode: couponCode.trim() || undefined,
      };

      const result = await subscriptionApi.createOrder(orderRequest);

      if (result.success && result.data) {
        // Initialize Razorpay payment
        const options = {
          key: result.data.keyId,
          amount: result.data.amount * 100, // Convert to paise
          currency: result.data.currency,
          name: 'Adhyanguru',
          description: `Subscription: ${result.data.subscription.plan.name}`,
          order_id: result.data.orderId,
          handler: async (response: any) => {
            await handlePaymentVerification({
              razorpayOrderId: result.data.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          prefill: {
            name: userData?.name || '',
            email: userData?.email || '',
            contact: userData?.contactNumber || '',
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
              setSelectedPlan(null);
            },
          },
        };

        if (window.Razorpay) {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } else {
          showError('Razorpay SDK not loaded. Please refresh the page.');
          setIsProcessingPayment(false);
        }
      } else {
        showError(result.message || 'Failed to create payment order');
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError('An error occurred while processing payment');
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentVerification = async (paymentData: VerifyPaymentRequest) => {
    try {
      const result = await subscriptionApi.verifyPayment(paymentData);

      if (result.success && result.data) {
        showSuccess('Payment successful! Your subscription has been activated. 🎉');
        setIsProcessingPayment(false);
        setSelectedPlan(null);
        setCouponCode('');
        // Refresh data
        await fetchData();
      } else {
        showError(result.message || 'Payment verification failed');
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      showError('Payment verification failed. Please contact support.');
      setIsProcessingPayment(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string, isActive: boolean, isExpired: boolean) => {
    if (isExpired || status === 'expired') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300">
          Expired
        </span>
      );
    }
    if (isActive && status === 'active') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300">
          Active
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300">
          Cancelled
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300">
        Pending
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton variant="text" width="40%" height={48} theme="blue" className="mb-2 bg-white/40" />
          <Skeleton variant="text" width="30%" height={24} theme="blue" className="mb-8 bg-white/40" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} theme="blue" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Subscription Management</h1>
          <p className="text-blue-200">Manage your subscription plans and access</p>
        </div>

        {/* Active Subscription Banner */}
        {activeSubscription?.hasActiveSubscription && activeSubscription.subscription && (
          <div className="bg-gradient-to-r from-green-600/20 to-green-500/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Crown className="text-green-300" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Active Subscription</h3>
                  <p className="text-green-200">
                    {typeof activeSubscription.subscription.planId === 'object'
                      ? activeSubscription.subscription.planId.name
                      : 'Premium Plan'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">
                  {activeSubscription.subscription.daysRemaining || 0}
                </div>
                <p className="text-green-200 text-sm">Days Remaining</p>
                {activeSubscription.subscription.nextRechargeDate && (
                  <p className="text-green-300 text-xs mt-2">
                    Renews on {formatDate(activeSubscription.subscription.nextRechargeDate)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Active Subscription Warning */}
        {!activeSubscription?.hasActiveSubscription && (
          <div className="bg-yellow-600/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-yellow-500/30">
            <div className="flex items-center gap-4">
              <AlertCircle className="text-yellow-300" size={32} />
              <div>
                <h3 className="text-xl font-bold text-white mb-1">No Active Subscription</h3>
                <p className="text-yellow-200">
                  You need an active subscription to enroll in courses and access course content.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            Available Plans
          </button>
          <button
            onClick={() => setActiveTab('my-subscriptions')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'my-subscriptions'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            My Subscriptions
          </button>
        </div>

        {/* Available Plans Tab */}
        {activeTab === 'plans' && (
          <div>
            {/* Plan Type Filter Tabs */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <button
                onClick={() => setPlanTypeFilter('all')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  planTypeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                All Plans
              </button>
              <button
                onClick={() => setPlanTypeFilter('yearly')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  planTypeFilter === 'yearly'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setPlanTypeFilter('quarterly')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  planTypeFilter === 'quarterly'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                Quarterly
              </button>
              <button
                onClick={() => setPlanTypeFilter('monthly')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  planTypeFilter === 'monthly'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                Monthly
              </button>
            </div>

            {isLoadingPlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin text-white" size={32} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePlans
                  .filter((plan) => planTypeFilter === 'all' || plan.planType === planTypeFilter)
                  .sort((a, b) => {
                    // Sort: yearly first, then quarterly, then monthly
                    const order = { yearly: 0, quarterly: 1, monthly: 2 };
                    return (order[a.planType as keyof typeof order] || 3) - (order[b.planType as keyof typeof order] || 3);
                  })
                  .map((plan) => (
                  <div
                    key={plan._id}
                    className={`bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 transition-all hover:scale-105 hover:shadow-2xl flex flex-col ${
                      plan.isPopular
                        ? 'border-yellow-500/50 ring-2 ring-yellow-500/30 shadow-yellow-500/20'
                        : 'border-white/20 hover:border-white/40'
                    } relative`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg">
                          POPULAR
                        </span>
                      </div>
                    )}
                    
                    {/* Plan Header */}
                    <div className="mb-6 text-center">
                      <h3 className="text-2xl font-bold text-white mb-3">{plan.name}</h3>
                      <p className="text-blue-200 text-sm leading-relaxed mb-6">{plan.description}</p>
                      
                      {/* Price Section */}
                      <div className="mb-4">
                        <div className="flex items-baseline justify-center gap-3 mb-2">
                          <span className="text-5xl font-bold text-white">
                            ₹{plan.price}
                          </span>
                          {plan.originalPrice && plan.originalPrice > plan.price && (
                            <span className="text-2xl text-blue-300 line-through opacity-70">
                              ₹{plan.originalPrice}
                            </span>
                          )}
                        </div>
                        {plan.originalPrice && plan.originalPrice > plan.price && plan.discountPercentage && (
                          <div className="mb-3">
                            <span className="inline-block bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                              Save {plan.discountPercentage}%
                            </span>
                          </div>
                        )}
                        <div className="text-blue-200 text-base font-medium">
                          {plan.planType === 'monthly' && 'per month'}
                          {plan.planType === 'quarterly' && 'per 3 months'}
                          {plan.planType === 'yearly' && 'per year'}
                        </div>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="mb-6 flex-1">
                      <h4 className="text-white font-semibold mb-4 text-center">What's Included:</h4>
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3 text-blue-100 text-sm">
                            <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={18} />
                            <span className="leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Subscribe Button */}
                    <button
                      onClick={() => handlePurchasePlan(plan)}
                      disabled={isProcessingPayment || (activeSubscription?.hasActiveSubscription && !activeSubscription.subscription?.isExpired)}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                        plan.isPopular
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg shadow-yellow-500/30'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/30'
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                      {isProcessingPayment && selectedPlan?._id === plan._id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="animate-spin" size={18} />
                          Processing...
                        </span>
                      ) : activeSubscription?.hasActiveSubscription && !activeSubscription.subscription?.isExpired ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle size={18} />
                          Already Subscribed
                        </span>
                      ) : (
                        `Subscribe Now`
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Coupon Code Input */}
            {selectedPlan && (
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Apply Coupon Code</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30 placeholder-blue-300"
                  />
                  <button
                    onClick={() => handlePurchasePlan(selectedPlan)}
                    disabled={isProcessingPayment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Subscriptions Tab */}
        {activeTab === 'my-subscriptions' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            {mySubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="mx-auto text-blue-300 mb-4" size={48} />
                <p className="text-blue-200 text-lg">No subscriptions found</p>
                <p className="text-blue-300 text-sm mt-2">
                  Purchase a plan to get started with your learning journey
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {mySubscriptions.map((subscription) => {
                  const plan = typeof subscription.planId === 'object' ? subscription.planId : null;
                  return (
                    <div
                      key={subscription._id}
                      className="bg-white/5 rounded-xl p-6 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {plan?.name || 'Subscription Plan'}
                          </h3>
                          <p className="text-blue-200 text-sm">
                            {subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1)} Plan
                          </p>
                        </div>
                        {getStatusBadge(subscription.status, subscription.isActive, subscription.isExpired || false)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-blue-200 text-xs mb-1">Amount Paid</p>
                          <p className="text-white font-semibold">₹{subscription.finalAmount}</p>
                        </div>
                        <div>
                          <p className="text-blue-200 text-xs mb-1">Start Date</p>
                          <p className="text-white font-semibold text-sm">{formatDate(subscription.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-blue-200 text-xs mb-1">End Date</p>
                          <p className="text-white font-semibold text-sm">{formatDate(subscription.endDate)}</p>
                        </div>
                        <div>
                          <p className="text-blue-200 text-xs mb-1">Days Remaining</p>
                          <p className="text-white font-semibold">
                            {subscription.daysRemaining !== undefined ? subscription.daysRemaining : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {subscription.couponCode && (
                        <div className="mb-2">
                          <span className="text-blue-200 text-xs">Coupon Applied: </span>
                          <span className="text-green-300 font-semibold">{subscription.couponCode}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-blue-200 text-xs">
                        <Calendar size={14} />
                        <span>Created: {formatDate(subscription.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

