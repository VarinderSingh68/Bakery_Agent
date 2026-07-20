import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// This is a mock auth hook. Replace with your actual auth context/hook.
// It should return an object like { user: { role: 'admin' | 'customer' }, isAuthenticated: boolean, isLoading: boolean }
import { useAuth } from '../hooks/useAuth'; // Assuming you have a custom auth hook

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner or a blank page while auth state is being determined
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    // Redirect them to the home page if they are not an authenticated admin.
    // We replace the current entry in the history stack so the user can't
    // use the back button to get back to the admin page.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;