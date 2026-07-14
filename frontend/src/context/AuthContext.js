import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../lib/api';

const AuthContext = createContext();
const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'auth_user';

const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const persistAuthState = (user, token) => {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState(true);

  // Setup axios interceptor to add Authorization header to all requests
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      // Set timeout to 30 seconds for all requests
      config.timeout = 30000;
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    if (token && token.startsWith('mock-jwt-token-')) {
      setLoading(false);
      return;
    }

    // CRITICAL: If we already have user data (from recent OAuth or login), don't refetch
    // just verify token is valid. Skip refetch if user was just set.
    if (user && token) {
      setLoading(false);
      return;
    }

    if (token || user) {
      fetchCurrentUser(token || null);
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async (activeToken = token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
        withCredentials: true  // Include cookies for Google OAuth sessions
      });
      setUser(response.data);
      persistAuthState(response.data, activeToken);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      persistAuthState(null, null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const backendUrl = API_URL.replace(/\/api$/, '');
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim().toLowerCase(),
        password
      }, {
        withCredentials: true,
        timeout: 30000
      });
      const { token: newToken, user: userData } = response.data;
      persistAuthState(userData, newToken);
      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (error) {
      let message = 'Authentication failed';

      if (error.response) {
        message = error.response.data?.detail || error.response.statusText || `Server error ${error.response.status}`;
      } else if (error.request && !error.response) {
        message = `Cannot connect to backend at ${backendUrl}. Backend may not be running or CORS may be misconfigured. Check that http://localhost:8000 is accessible.`;
      } else if (error.code === 'ECONNABORTED') {
        message = `Request timeout connecting to ${backendUrl}. The backend may be slow or unreachable.`;
      } else if (error.message === 'Network Error') {
        message = `Network error while connecting to backend at ${backendUrl}. Please check your internet connection and that the backend server is running.`;
      } else {
        message = error.message || message;
      }
      
      error.message = message;
      throw error;
    }
  };

  const register = async (name, email, password, username = null) => {
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password
    };
    if (username) {
      payload.username = username.trim().toLowerCase();
    }
    const response = await axios.post(`${API_URL}/auth/register`, payload, {
      withCredentials: true
    });
    const { token: newToken, user: userData } = response.data;
    persistAuthState(userData, newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    persistAuthState(null, null);
    setToken(null);
    setUser(null);
  };

  const setUserFromOAuth = (userData, jwtToken) => {
    persistAuthState(userData, jwtToken);
    setUser(userData || null);
    setToken(jwtToken || null);
    if (jwtToken) {
      fetchCurrentUser(jwtToken);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, setUserFromOAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};
