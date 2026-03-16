import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDesigner, setIsDesigner] = useState(false);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      console.log('useAuth - Getting session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('useAuth - Session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      });

      setUser(session?.user ?? null);

      // Check if user is admin or designer
      if (session?.user) {
        console.log('useAuth - Checking admin status for:', session.user.id);

        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('id, is_active')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .maybeSingle();

        console.log('useAuth - Admin check result:', { adminData, adminError });

        const { data: designerData, error: designerError } = await supabase
          .from('designers')
          .select('id, is_active')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .maybeSingle();

        console.log('useAuth - Designer check result:', { designerData, designerError });

        setIsAdmin(!!adminData);
        setIsDesigner(!!designerData);

        console.log('useAuth - Final state:', {
          isAdmin: !!adminData,
          isDesigner: !!designerData
        });
      } else {
        console.log('useAuth - No session, clearing admin/designer flags');
        setIsAdmin(false);
        setIsDesigner(false);
      }

      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);

        // Use async block inside callback to avoid deadlock
        (async () => {
          // Check if user is admin or designer
          if (session?.user) {
            const { data: adminData } = await supabase
              .from('admin_users')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('is_active', true)
              .maybeSingle();

            const { data: designerData } = await supabase
              .from('designers')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('is_active', true)
              .maybeSingle();

            setIsAdmin(!!adminData);
            setIsDesigner(!!designerData);
          } else {
            setIsAdmin(false);
            setIsDesigner(false);
          }

          setLoading(false);
        })();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();

      // Clear Supabase-related items from storage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear session storage
      sessionStorage.clear();

    } catch (error) {
      console.error('Error signing out:', error);
      // Clear storage even on error
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();
    }
  };

  return {
    user,
    loading,
    isAdmin,
    isDesigner,
    signOut
  };
};