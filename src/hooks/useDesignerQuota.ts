import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface DesignerQuotaInfo {
  allowed: boolean;
  reason: string;
  message: string;
  planName?: string;
  maxQuotes?: number;
  quotesUsed?: number;
  quotesRemaining?: number;
  periodEnd?: string;
  status?: string;
}

export interface DesignerUsageInfo {
  subscriptionStatus: string;
  planName: string;
  limits: {
    maxQuotes: number;
    maxProjects: number;
  };
  usage: {
    quotesUsed: number;
    projectsUsed: number;
    quotesRemaining: number;
    projectsRemaining: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export const useDesignerQuota = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDesignerQuota = async (designerId: string): Promise<DesignerQuotaInfo | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('can_designer_accept_assignment', { p_designer_id: designerId });

      if (rpcError) {
        console.error('Error checking designer quota:', rpcError);
        setError('Failed to check designer availability');
        return null;
      }

      return data as DesignerQuotaInfo;
    } catch (err: any) {
      console.error('Error in checkDesignerQuota:', err);
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getDesignerUsageInfo = async (designerId: string): Promise<DesignerUsageInfo | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_designer_subscription_info', { p_designer_id: designerId });

      if (rpcError) {
        console.error('Error getting designer usage info:', rpcError);
        setError('Failed to get designer usage information');
        return null;
      }

      return data as DesignerUsageInfo;
    } catch (err: any) {
      console.error('Error in getDesignerUsageInfo:', err);
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    checkDesignerQuota,
    getDesignerUsageInfo
  };
};
