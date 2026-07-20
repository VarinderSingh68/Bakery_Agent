import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('admin@bakery.com');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const redirectAttemptedRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading: authLoading } = useAuth();

  const from = location.state?.from?.pathname || '/admin';

  // Only auto-redirect admin users ONCE to prevent redirect loops
  // when the stored token is invalid and the backend rejects it
  useEffect(() => {
    if (!authLoading && user?.role === 'admin' && !redirectAttemptedRef.current) {
      redirectAttemptedRef.current = true;
      navigate(from, { replace: true });
    }
  }, [authLoading, user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser && loggedInUser.role === 'admin') {
        toast.success('Welcome Admin!');
        redirectAttemptedRef.current = true;
        navigate(from, { replace: true });
      } else {
        // User exists but is not admin - log them out and show error
        setError('Admin access required. This account does not have admin privileges.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#C25934] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FDFBF7] px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg border border-[#E3DCCF] shadow-lg">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#C25934]">Secure Admin</p>
          <h2 className="mt-2 font-['Playfair_Display'] text-3xl font-bold text-[#2D241E]">Admin Login</h2>
          <p className="mt-2 text-sm text-[#5C4B40]">Sign in to manage your bakery</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#2D241E]">
              Email or Username
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 mt-1.5 rounded-lg border border-[#E3DCCF] outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="admin@bakery.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-[#2D241E]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 mt-1.5 rounded-lg border border-[#E3DCCF] outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-[#D94848]/10 border border-[#D94848]/20 p-3">
              <p className="text-sm text-[#D94848]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#C25934] px-6 py-3 font-semibold text-white hover:bg-[#A84C2A] disabled:cursor-not-allowed disabled:bg-[#C25934]/60 transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8A7E74]">
          <a href="/" className="text-[#C25934] hover:underline font-medium">
            Back to website
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;