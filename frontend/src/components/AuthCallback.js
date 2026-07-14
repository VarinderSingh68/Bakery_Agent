import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import API_URL from '../lib/api';

const GOOGLE_OAUTH_STATE_KEY = 'google_oauth_state';

const getGoogleRedirectUri = () =>
  process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';

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

        if (!code && !accessToken && !sessionId) {
          throw new Error('No authorization data found in callback URL');
        }

        let response;
        if (accessToken && isLocalDev()) {
          const expectedState = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);

          if (!expectedState) {
            throw new Error('Google sign-in session expired. Please try again.');
          }

          if (!state || state !== expectedState) {
            throw new Error('Google sign-in state mismatch. Please try again.');
          }

          const googleProfileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!googleProfileResponse.ok) {
            const errorText = await googleProfileResponse.text();
            throw new Error(`Google profile fetch failed: ${errorText}`);
          }

          const googleProfile = await googleProfileResponse.json();
          response = await axios.post(
            `${API_URL}/auth/google/browser`,
            {
              email: googleProfile.email,
              name: googleProfile.name,
              picture: googleProfile.picture,
              google_id: googleProfile.id,
            },
            {
              withCredentials: true,
            }
          );
        } else if (code) {
          const expectedState = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);

          if (!expectedState) {
            throw new Error('Google sign-in session expired. Please try again.');
          }

          if (!state || state !== expectedState) {
            throw new Error('Google sign-in state mismatch. Please try again.');
          }

          response = await axios.post(
            `${API_URL}/auth/google/callback`,
            {
              code,
              redirect_uri: getGoogleRedirectUri(),
            },
            {
              withCredentials: true,
            }
          );
        } else if (sessionId) {
          if (isLocalDev()) {
            throw new Error('Stale Google callback detected. Please retry from the current login page.');
          }

          response = await axios.post(
            `${API_URL}/auth/google/session`,
            {},
            {
              withCredentials: true,
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
        const message =
          error.response?.data?.detail ||
          error.message ||
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
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#C25934] border-t-transparent mb-4"></div>
        <p className="text-[#2D241E] text-lg">Completing sign in...</p>
      </div>
    </div>
  );
};
