import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import API_URL from '../lib/api';

const GOOGLE_OAUTH_STATE_KEY = 'google_oauth_state';

const generateRandomString = (length = 64) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (value) => charset[value % charset.length]).join('');
};

const getGoogleRedirectUri = () =>
  process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';

export const Login = ({ adminOnly = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, logout, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = adminOnly ? '/admin' : location.state?.from?.pathname || '/';

  useEffect(() => {
    if (!authLoading && user?.role === 'admin' && adminOnly) {
      navigate('/admin', { replace: true });
      return;
    }

    if (!authLoading && user && !adminOnly) {
      navigate(from, { replace: true });
    }
  }, [adminOnly, authLoading, from, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedIdentifier = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedIdentifier || !password.trim()) {
      toast.error('Please enter both email/username and password.');
      return;
    }

    if (!isLogin) {
      if (!normalizedName) {
        toast.error('Please enter your name.');
        return;
      }
      if (!normalizedUsername) {
        toast.error('Please enter a username.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const loggedInUser = await login(normalizedIdentifier, password);
        if (adminOnly && loggedInUser.role !== 'admin') {
          await logout();
          toast.error('Admin access required');
          return;
        }
        toast.success('Welcome back!');
      } else {
        await register(normalizedName, normalizedIdentifier, password, normalizedUsername);
        toast.success('Account created successfully!');
      }
      navigate(from, { replace: true });
    } catch (error) {
      const backendHost = API_URL.replace(/\/api$/, '') || 'backend';
      let message = 'Authentication failed';

      if (error.response) {
        message = error.response.data?.detail || error.response.statusText || `Server error ${error.response.status}`;
      } else if (error.request) {
        message = `Cannot reach login server at ${backendHost}. Make sure backend is running, CORS is configured, and http/https is correct.`;
      } else if (error.message === 'Network Error') {
        message = `Network error while connecting to backend at ${backendHost}. Please check your network and try again.`;
      } else {
        message = error.message || message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (user) {
      toast.success('You are already logged in. Redirecting...');
      navigate(from, { replace: true });
      return;
    }

    const redirectUrl = getGoogleRedirectUri();
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-oauth-client-id.apps.googleusercontent.com';
    if (!clientId || clientId === 'your-oauth-client-id.apps.googleusercontent.com') {
      toast.error('Set REACT_APP_GOOGLE_CLIENT_ID in frontend/.env.local with your Google OAuth2 Client ID.');
      return;
    }

    try {
      const stateToken = generateRandomString(48);
      sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, stateToken);

      const authParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUrl,
        scope: 'openid email profile',
        response_type: isLocalDev ? 'token' : 'code',
        prompt: 'select_account',
        access_type: isLocalDev ? 'online' : 'offline',
        include_granted_scopes: 'true',
        state: stateToken,
      });

      window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`);
    } catch (error) {
      console.error('[Login] Google OAuth start failed:', error);
      toast.error('Failed to start Google sign in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-20" data-testid="auth-page">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg p-8 border border-[#E3DCCF] shadow-lg animate-fade-in-up">
          <h1 className="text-3xl font-['Playfair_Display'] font-bold text-[#2D241E] text-center mb-8">
            {adminOnly ? 'Admin Login' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>

          {!adminOnly && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border-2 border-[#E3DCCF] hover:border-[#C25934] text-[#2D241E] rounded-full px-8 py-4 font-medium transition-all duration-300 flex items-center justify-center space-x-3 mb-6 hover:shadow-md transform hover:scale-[1.02]"
                data-testid="google-login-button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-[#E3DCCF]"></div>
                <span className="px-4 text-sm text-[#8A7E74]">or</span>
                <div className="flex-1 border-t border-[#E3DCCF]"></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div className="animate-slide-down">
                  <label className="block text-[#2D241E] font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                    placeholder="Your full name"
                    data-testid="name-input"
                  />
                </div>
                <div className="animate-slide-down">
                  <label className="block text-[#2D241E] font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                    placeholder="Choose a username"
                    data-testid="username-input"
                  />
                </div>
              </>
            )}

            <div className="transform transition-all duration-300">
              <label className="block text-[#2D241E] font-medium mb-2">
                {adminOnly ? 'Username' : isLogin ? 'Email or Username' : 'Email'}
              </label>
              <input
                type={isLogin ? 'text' : 'email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                placeholder={adminOnly ? 'admin' : isLogin ? "your@email.com or username" : "your@email.com"}
                data-testid="email-input"
              />
            </div>

            <div className="transform transition-all duration-300">
              <label className="block text-[#2D241E] font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isLogin ? 1 : 6}
                className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                placeholder="••••••"
                data-testid="password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-8 py-4 font-medium transition-all duration-300 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
              data-testid="submit-button"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          {!adminOnly && (
            <div className="mt-6 text-center">
              <p className="text-[#5C4B40]">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#C25934] hover:underline font-semibold transition-colors duration-300"
                  data-testid="toggle-auth-mode"
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
