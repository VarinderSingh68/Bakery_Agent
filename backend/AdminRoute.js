import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // While checking auth status, show a loading indicator.
    // This prevents a flicker from the login page to the admin page on refresh.
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  if (user && user.role === 'admin') {
    // If the user is authenticated and has the 'admin' role, render the children (the Admin page).
    return children;
  }

  // If the user is not an admin or is not logged in, redirect them to the admin-specific login page.
  return <Navigate to="/admin-login" state={{ from: location }} replace />;
};

export default AdminRoute;