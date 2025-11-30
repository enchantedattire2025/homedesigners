import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Check, Clock, AlertCircle, Crown, Zap, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_period: string;
  features: string[];
  max_projects: number;
  max_quotes: number;
  priority_support: boolean;
  sort_order: number;
}

interface DesignerSubscription {
  id: string;
  status: string;
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  auto_renew: boolean;
  subscription_plan: SubscriptionPlan;
}

interface UsageStats {
  projects_created: number;
  quotes_generated: number;
  max_projects: number;
  max_quotes: number;
}

const DesignerSubscription: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<DesignerSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: designerData } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!designerData) {
        navigate('/designer-registration');
        return;
      }

      const { data: subData } = await supabase
        .from('designer_subscriptions')
        .select(`
          *,
          subscription_plan:subscription_plans(*)
        `)
        .eq('designer_id', designerData.id)
        .maybeSingle();

      if (subData) {
        setSubscription({
          ...subData,
          subscription_plan: subData.subscription_plan as SubscriptionPlan
        });
      }

      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (plansData) {
        setPlans(plansData.map(plan => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features : []
        })));
      }

      const currentDate = new Date();
      const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const { data: usageData } = await supabase
        .from('subscription_usage_tracking')
        .select('*')
        .eq('designer_subscription_id', subData?.id)
        .gte('period_start', periodStart.toISOString())
        .maybeSingle();

      if (usageData && subData?.subscription_plan) {
        setUsage({
          projects_created: usageData.projects_created || 0,
          quotes_generated: usageData.quotes_generated || 0,
          max_projects: subData.subscription_plan.max_projects,
          max_quotes: subData.subscription_plan.max_quotes
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTrialDays = () => {
    if (!subscription || subscription.status !== 'trial') return 0;
    const now = new Date();
    const endDate = new Date(subscription.trial_end_date);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      trial: { text: 'Free Trial', color: 'bg-blue-100 text-blue-800', icon: Clock },
      active: { text: 'Active', color: 'bg-green-100 text-green-800', icon: Check },
      expired: { text: 'Expired', color: 'bg-red-100 text-red-800', icon: AlertCircle },
      cancelled: { text: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      suspended: { text: 'Suspended', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
    };

    const badge = badges[status as keyof typeof badges] || badges.expired;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getPlanIcon = (planName: string) => {
    if (planName === 'Premium') return Crown;
    if (planName === 'Professional') return Zap;
    return Shield;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Subscription Management</h1>
          <p className="text-xl text-gray-600">Choose the plan that fits your business needs</p>
        </div>

        {subscription && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Current Plan</h2>
                <p className="text-gray-600">{subscription.subscription_plan.name}</p>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(subscription.status)}
                {subscription.status === 'trial' && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Trial ends in</p>
                    <p className="text-2xl font-bold text-blue-600">{getRemainingTrialDays()} days</p>
                  </div>
                )}
              </div>
            </div>

            {usage && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Projects this month</h3>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold text-gray-900">{usage.projects_created}</span>
                    <span className="text-sm text-gray-500">of {usage.max_projects}</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((usage.projects_created / usage.max_projects) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Quotes this month</h3>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold text-gray-900">{usage.quotes_generated}</span>
                    <span className="text-sm text-gray-500">of {usage.max_quotes}</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min((usage.quotes_generated / usage.max_quotes) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.name);
            const isCurrentPlan = subscription?.subscription_plan.id === plan.id;
            const isPremium = plan.name === 'Premium';

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  isPremium ? 'ring-2 ring-blue-600' : ''
                }`}
              >
                {isPremium && (
                  <div className="bg-blue-600 text-white text-center py-2 font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-10 h-10 ${isPremium ? 'text-blue-600' : 'text-gray-700'}`} />
                    {isCurrentPlan && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isPremium
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : subscription?.status === 'trial' ? 'Start Subscription' : 'Upgrade'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showPaymentModal && selectedPlan && (
          <PaymentModal
            plan={selectedPlan}
            subscription={subscription}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              setShowPaymentModal(false);
              loadSubscriptionData();
            }}
          />
        )}
      </div>
    </div>
  );
};

interface PaymentModalProps {
  plan: SubscriptionPlan;
  subscription: DesignerSubscription | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ plan, subscription, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!user || !subscription) return;

    setProcessing(true);

    try {
      const paymentData = {
        designer_subscription_id: subscription.id,
        amount: plan.price,
        currency: 'INR',
        payment_method: paymentMethod,
        payment_gateway: 'razorpay',
        transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        payment_status: 'completed',
        payment_date: new Date().toISOString(),
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          plan_name: plan.name,
          payment_method: paymentMethod
        }
      };

      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert([paymentData]);

      if (paymentError) throw paymentError;

      const { error: subError } = await supabase
        .from('designer_subscriptions')
        .update({
          subscription_plan_id: plan.id,
          status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (subError) throw subError;

      alert('Payment successful! Your subscription has been activated.');
      onSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{plan.name} Plan</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
              <span className="text-gray-600">/month</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="space-y-2">
            {[
              { value: 'card', label: 'Credit/Debit Card' },
              { value: 'upi', label: 'UPI' },
              { value: 'netbanking', label: 'Net Banking' },
              { value: 'wallet', label: 'Wallet' }
            ].map((method) => (
              <label key={method.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment-method"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-900">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a demo payment interface. In production, this would integrate with Razorpay or Stripe payment gateway.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay ₹{plan.price}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignerSubscription;
