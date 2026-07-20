import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#C25934] border-t-transparent" />
    </div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;