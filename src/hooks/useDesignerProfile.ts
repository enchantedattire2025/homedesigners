import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Designer } from '../lib/supabase';

export const useDesignerProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [designer, setDesigner] = useState<Designer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDesignerProfile = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setDesigner(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching designer profile for user:', user.id, user.email);
      
      // Fetch designer data with better error handling
      const { data, error } = await supabase
        .from('designers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        setError(error.message);
        setDesigner(null);
      } else {
        console.log('Designer profile data:', data);
        setDesigner(data);
        
        // Additional logging for debugging
        if (data) {
          console.log('Designer found:', {
            id: data.id,
            name: data.name,
            email: data.email,
            user_id: data.user_id,
            is_active: data.is_active
          });
        } else {
          console.log('No designer profile found for user');
        }
      }
    } catch (error: any) {
      console.error('Error fetching designer profile:', error);
      setError(error.message);
      setDesigner(null);
    } finally {
      // Remove the artificial delay that might be causing issues
      setLoading(false);
    } 
  }, [user, authLoading]);

  useEffect(() => {
    fetchDesignerProfile();
  }, [fetchDesignerProfile]);

  const updateDesignerProfile = async (updates: Partial<Designer>) => {
    if (!user || !designer) {
      console.error('Cannot update: missing user or designer', { user: !!user, designer: !!designer });
      return { error: 'No designer profile found or user not authenticated' };
    }

    try {
      console.log('Updating designer profile with:', updates);
      console.log('Current designer ID:', designer.id);
      console.log('Current user ID:', user.id);
      
      // First, let's verify the designer exists and belongs to the current user
      const { data: existingDesigner, error: checkError } = await supabase
        .from('designers')
        .select('*')
        .eq('id', designer.id)
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        console.error('Error verifying designer ownership:', checkError);
        return { error: 'Cannot verify designer ownership: ' + checkError.message };
      }

      if (!existingDesigner) {
        console.error('Designer not found or does not belong to current user');
        return { error: 'Designer profile not found or access denied' };
      }

      console.log('Designer ownership verified, proceeding with update');

      // Perform the update using the designer ID (more reliable than user_id)
      const { data, error } = await supabase
        .from('designers')
        .update(updates)
        .eq('id', designer.id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);
      
      // Update local state with new data
      setDesigner(data);
      return { error: null, data };
    } catch (error: any) {
      console.error('Error updating designer profile:', error);
      return { error: error.message };
    }
  };

  const createDesignerProfile = async (profileData: Omit<Designer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      return { error: 'User not authenticated' };
    }

    try {
      console.log('Creating new designer profile for user:', user.id);
      
      // Check if designer profile already exists
      const { data: existingDesigner } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingDesigner) {
        return { error: 'Designer profile already exists for this user' };
      }

      const dataToInsert = {
        ...profileData,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('designers')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        console.error('Create error:', error);
        throw error;
      }

      console.log('Designer profile created successfully:', data);
      
      // Update local state with new data
      setDesigner(data);
      return { error: null, data };
    } catch (error: any) {
      console.error('Error creating designer profile:', error);
      return { error: error.message };
    }
  };

  return {
    designer,
    loading,
    error,
    isDesigner: !!designer,
    updateDesignerProfile,
    createDesignerProfile,
    refreshProfile: fetchDesignerProfile
  };
};