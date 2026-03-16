import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function AdminAuthDebug() {
  const { user, isAdmin, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [checking, setChecking] = useState(false);

  const checkAuthState = async () => {
    setChecking(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      hookState: {
        user: user ? {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        } : null,
        isAdmin,
        loading
      }
    };

    try {
      // Check session directly
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      info.directSession = {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: sessionError
      };

      if (session?.user) {
        // Check admin_users table
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id);

        info.adminCheck = {
          found: adminData && adminData.length > 0,
          count: adminData?.length || 0,
          data: adminData,
          error: adminError
        };

        // Check if any admin record exists for this user_id (without is_active filter)
        const { data: allAdminData, error: allAdminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id);

        info.allAdminRecords = {
          count: allAdminData?.length || 0,
          data: allAdminData,
          error: allAdminError
        };

        // Try to get user from auth.users
        const { data: authUserData, error: authUserError } = await supabase
          .from('admin_users')
          .select('user_id, email, is_active, role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        info.authUserLookup = {
          data: authUserData,
          error: authUserError
        };
      }

      // Check localStorage
      const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'));
      info.localStorage = {
        supabaseKeys: storageKeys,
        count: storageKeys.length
      };

    } catch (error: any) {
      info.error = {
        message: error.message,
        stack: error.stack
      };
    }

    setDebugInfo(info);
    setChecking(false);
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Admin Auth Debug</h1>

          <div className="mb-6">
            <button
              onClick={checkAuthState}
              disabled={checking}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {checking ? 'Checking...' : 'Refresh Auth State'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-2">useAuth Hook State</h2>
              <div className="bg-gray-50 p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(debugInfo.hookState, null, 2)}</pre>
              </div>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-2">Direct Session Check</h2>
              <div className="bg-gray-50 p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(debugInfo.directSession, null, 2)}</pre>
              </div>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-2">Admin Users Table (Active Only)</h2>
              <div className="bg-gray-50 p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(debugInfo.adminCheck, null, 2)}</pre>
              </div>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-2">All Admin Records (Including Inactive)</h2>
              <div className="bg-gray-50 p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(debugInfo.allAdminRecords, null, 2)}</pre>
              </div>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-2">Auth User Lookup</h2>
              <div className="bg-gray-50 p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(debugInfo.authUserLookup, null, 2)}</pre>
              </div>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-2">LocalStorage Keys</h2>
              <div className="bg-gray-50 p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(debugInfo.localStorage, null, 2)}</pre>
              </div>
            </div>

            {debugInfo.error && (
              <div className="border-b pb-4">
                <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
                <div className="bg-red-50 p-4 rounded font-mono text-sm overflow-x-auto">
                  <pre>{JSON.stringify(debugInfo.error, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">What to look for:</h3>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li><strong>hookState.user:</strong> Should have your user ID and email</li>
              <li><strong>hookState.isAdmin:</strong> Should be true</li>
              <li><strong>directSession.hasSession:</strong> Should be true</li>
              <li><strong>adminCheck.found:</strong> Should be true</li>
              <li><strong>adminCheck.data:</strong> Should have at least one record with is_active: true</li>
              <li><strong>allAdminRecords:</strong> Should show all your admin records (active or not)</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded">
            <h3 className="font-semibold mb-2">Common Issues:</h3>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li><strong>No session:</strong> You need to log in via /admin-login</li>
              <li><strong>Session exists but adminCheck.found is false:</strong> Your user_id is not in admin_users table OR is_active is false</li>
              <li><strong>allAdminRecords shows inactive record:</strong> Set is_active to true in the database</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
