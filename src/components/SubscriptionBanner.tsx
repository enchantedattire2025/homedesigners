import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Crown } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';

const SubscriptionBanner: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const [subscriptionManagementEnabled, setSubscriptionManagementEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionManagementSetting();
  }, []);

  const fetchSubscriptionManagementSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('is_active')
        .eq('setting_key', 'subscription_management_enabled')
        .maybeSingle();

      if (error) throw error;

      setSubscriptionManagementEnabled(data?.is_active || false);
    } catch (error) {
      console.error('Error fetching subscription management setting:', error);
      setSubscriptionManagementEnabled(false);
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading || settingsLoading) return null;

  if (!subscriptionManagementEnabled) return null;

  if (subscription.isExpired) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Subscription Expired</h3>
              <p className="text-red-700">
                Your subscription has expired. Please renew to continue accessing all features.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/designer-subscription')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Renew Now
          </button>
        </div>
      </div>
    );
  }

  if (subscription.isTrial && subscription.daysRemaining <= 7) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Trial Ending Soon</h3>
              <p className="text-blue-700">
                Your free trial ends in {subscription.daysRemaining} day{subscription.daysRemaining !== 1 ? 's' : ''}.
                Upgrade now to continue enjoying all features.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/designer-subscription')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  if (subscription.isTrial) {
    return null;
  }

  return null;
};

export default SubscriptionBanner;
