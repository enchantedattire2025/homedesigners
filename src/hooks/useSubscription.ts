import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface SubscriptionStatus {
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  status: string;
  subscriptionId: string | null;
  planName: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    isActive: false,
    isTrial: false,
    isExpired: false,
    daysRemaining: 0,
    status: 'none',
    subscriptionId: null,
    planName: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: designerData } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!designerData) {
        setLoading(false);
        return;
      }

      const { data: subData } = await supabase
        .from('designer_subscriptions')
        .select(`
          id,
          status,
          trial_end_date,
          subscription_end_date,
          subscription_plan:subscription_plans(name)
        `)
        .eq('designer_id', designerData.id)
        .maybeSingle();

      if (!subData) {
        setSubscription({
          isActive: false,
          isTrial: false,
          isExpired: true,
          daysRemaining: 0,
          status: 'none',
          subscriptionId: null,
          planName: null
        });
        setLoading(false);
        return;
      }

      const now = new Date();
      let daysRemaining = 0;
      let isActive = false;
      let isTrial = false;
      let isExpired = false;

      if (subData.status === 'trial') {
        const trialEnd = new Date(subData.trial_end_date);
        const diffTime = trialEnd.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isTrial = true;
        isActive = daysRemaining > 0;
        isExpired = daysRemaining <= 0;
      } else if (subData.status === 'active') {
        isActive = true;
        if (subData.subscription_end_date) {
          const subEnd = new Date(subData.subscription_end_date);
          const diffTime = subEnd.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      } else if (subData.status === 'expired' || subData.status === 'cancelled') {
        isExpired = true;
      }

      setSubscription({
        isActive,
        isTrial,
        isExpired,
        daysRemaining: Math.max(0, daysRemaining),
        status: subData.status,
        subscriptionId: subData.id,
        planName: subData.subscription_plan?.name || null
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return { subscription, loading, refresh: checkSubscription };
};
