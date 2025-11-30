import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Crown } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

const SubscriptionBanner: React.FC = () => {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();

  if (loading) return null;

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
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Crown className="w-6 h-6 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Free Trial Active</h3>
              <p className="text-green-700">
                You have {subscription.daysRemaining} days remaining in your free trial.
                Explore all features and upgrade when ready.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/designer-subscription')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionBanner;
