import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EmailConfirmation = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // With detectSessionInUrl: true and flowType: 'pkce', Supabase automatically
        // processes the ?code= param from the URL and establishes a session before
        // this component even mounts. We must NOT call exchangeCodeForSession manually
        // (that would fail with "code already used"). Instead, just wait briefly for
        // the auto-processing to complete, then check the session.

        const searchParams = new URLSearchParams(window.location.search);
        const hasCode = searchParams.has('code');

        // Also handle legacy hash-based token (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasHashToken = hashParams.has('access_token');

        if (!hasCode && !hasHashToken) {
          // No token at all — not a valid confirmation URL
          setStatus('error');
          setMessage('Invalid confirmation link. Please request a new one.');
          return;
        }

        // Give Supabase's detectSessionInUrl a moment to process the code
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setMessage('Email confirmation failed. Please try again or request a new link.');
          return;
        }

        if (sessionData.session?.user) {
          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in to your account.');
          setTimeout(() => navigate('/'), 3000);
        } else {
          // Session not established — try onAuthStateChange as a last resort
          // (handles cases where the event fires slightly after getSession)
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              subscription.unsubscribe();
              setStatus('success');
              setMessage('Email confirmed successfully! You can now sign in to your account.');
              setTimeout(() => navigate('/'), 3000);
            }
          });

          // If still no session after 4 more seconds, show error
          setTimeout(() => {
            subscription.unsubscribe();
            setStatus((prev) => {
              if (prev === 'loading') {
                setMessage('Email confirmation failed. The link may have expired or already been used.');
                return 'error';
              }
              return prev;
            });
          }, 4000);
        }
      } catch (err) {
        console.error('Unexpected error during email confirmation:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    confirmEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirming Your Email</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Email Confirmed!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you to the homepage...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirmation Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Go to Homepage
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmation;
