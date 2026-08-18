import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Marks that the admin actively signed in during this browser tab's lifetime.
// A persisted token/user in localStorage is not enough on its own to reach
// /admin - visiting it fresh must always land on the login page first.
export const ADMIN_SESSION_KEY = 'admin_session_active';

const AdminRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#C25934] border-t-transparent" />
    </div>;
  }

  const hasActiveAdminSession = sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';

  if (!user || user.role !== 'admin' || !hasActiveAdminSession) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;
