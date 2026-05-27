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
        // Supabase PKCE flow: confirmation link has ?code=... in query string
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');

        // Legacy flow: access_token in hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const hashType = hashParams.get('type');

        if (code) {
          // PKCE flow — exchange code for session, which also confirms the email
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Code exchange error:', error);
            setStatus('error');
            setMessage('Email confirmation failed. The link may have expired or already been used.');
            return;
          }

          if (data.user) {
            setStatus('success');
            setMessage('Email confirmed successfully! You can now sign in to your account.');
            setTimeout(() => navigate('/'), 3000);
          } else {
            setStatus('error');
            setMessage('Could not confirm email. Please request a new confirmation link.');
          }
        } else if (accessToken && hashType === 'signup') {
          // Legacy implicit flow
          const { data, error } = await supabase.auth.getUser(accessToken);

          if (error || !data.user) {
            console.error('Confirmation error:', error);
            setStatus('error');
            setMessage('Email confirmation failed. The link may have expired or is invalid.');
            return;
          }

          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in to your account.');
          setTimeout(() => navigate('/'), 3000);
        } else {
          // No recognisable token — Supabase may have already processed it automatically;
          // check if there is an active session before showing an error.
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.user) {
            setStatus('success');
            setMessage('Email confirmed successfully! You can now sign in to your account.');
            setTimeout(() => navigate('/'), 3000);
          } else {
            setStatus('error');
            setMessage('Invalid or expired confirmation link. Please request a new one.');
          }
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
