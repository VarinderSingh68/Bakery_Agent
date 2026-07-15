import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { getBackendUrl, getGoogleRedirectUri } from '../lib/api';

const GOOGLE_OAUTH_STATE_KEY = 'google_oauth_state';

const isLocalDev = () =>
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const clearOAuthSessionState = () => {
  sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
};

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUserFromOAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        const errorParam = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
        const code = searchParams.get('code');
        const accessToken = hashParams.get('access_token');
        const sessionId = hashParams.get('session_id') || searchParams.get('session_id');
        const state = hashParams.get('state') || searchParams.get('state');

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        let response;
        if (code) {
          const expectedState = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);

          if (!expectedState) {
            throw new Error('Google sign-in session expired. Please try again.');
          }

          if (!state || state !== expectedState) {
            throw new Error('Google sign-in state mismatch. Please try again.');
          }

          response = await axios.post(
            '/api/auth/google/callback',
            {
              code,
              redirect_uri: getGoogleRedirectUri(),
            },
            {
              withCredentials: true,
              timeout: 30000,
            }
          );
        } else if (sessionId) {
          if (isLocalDev()) {
            throw new Error('Stale Google callback detected. Please retry from the current login page.');
          }

          response = await axios.post(
            '/api/auth/google/session',
            {},
            {
              withCredentials: true,
              timeout: 30000,
              headers: {
                'X-Session-ID': sessionId
              }
            }
          );
        }

        const data = response.data;

        if (!data.token) {
          console.error('[AuthCallback] WARNING: No token in OAuth response!');
        }

        setUserFromOAuth({
          id: data.id || data.user?.id,
          email: data.email || data.user?.email,
          name: data.name || data.user?.name,
          role: data.role || data.user?.role || 'customer'
        }, data.token || null);

        toast.success(`Welcome, ${data.name || data.user?.name || 'back'}!`);

        clearOAuthSessionState();
        window.history.replaceState({}, '', '/');
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        const backendHost = getBackendUrl();
        const message = error.response?.data?.detail ||
          (error.request && !error.response
            ? `Cannot reach Google login server at ${backendHost}. Make sure the backend is running and CORS allows this frontend origin.`
            : error.message) ||
          'Authentication failed. Please try again.';
        toast.error(message);

        clearOAuthSessionState();
        window.history.replaceState({}, '', '/login');
        navigate('/login', { replace: true });
      }
    };

    processSession();
  }, [navigate, setUserFromOAuth]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#C25934] border-t-transparent"></div>
        <p className="mt-4 text-lg font-semibold text-[#2D241E]">
          Completing sign in...
        </p>
      </div>
    </div>
  );
};