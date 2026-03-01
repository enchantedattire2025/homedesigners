import { supabase } from '../lib/supabase';

// Admin logout - clears everything
export const adminLogout = async () => {
  try {
    console.log('Admin logout initiated...');

    // Sign out from Supabase with global scope
    const { error } = await supabase.auth.signOut({ scope: 'global' });

    if (error) {
      console.error('Supabase signOut error:', error);
    }

    // Clear all storage completely for admin
    localStorage.clear();
    sessionStorage.clear();

    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log('Admin logged out successfully');
  } catch (error) {
    console.error('Error during admin logout:', error);
    localStorage.clear();
    sessionStorage.clear();
  }
};

// Customer/Designer logout - selective clearing to preserve user preferences
export const customerDesignerLogout = async () => {
  try {
    console.log('Customer/Designer logout initiated...');

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signOut error:', error);
    }

    // Clear only Supabase auth-related items from localStorage
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

    console.log('Customer/Designer logged out successfully');
  } catch (error) {
    console.error('Error during customer/designer logout:', error);
    // Clear Supabase keys on error
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
  }
};

// Legacy function for backward compatibility - now routes to appropriate logout
export const forceLogoutAll = async () => {
  console.log('forceLogoutAll called - using customer/designer logout');
  await customerDesignerLogout();
};
