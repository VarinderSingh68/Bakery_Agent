import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api'; // Assuming you have a configured axios instance

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (authIsLoading) {
      return; // Wait for authentication check to complete
    }

    if (!isAuthenticated || user?.role !== 'admin') {
      // Not an admin, no need to fetch data. Stop loading and let the redirect handle it.
      setIsLoading(false);
      return;
    }

    const fetchAdminData = async () => {
      try {
        // Fetch both dashboard stats and the full product list for the admin panel
        const [statsResponse, productsResponse] = await Promise.all([
          api.get('/api/admin/stats'),      // For dashboard summary
          api.get('/api/admin/products')  // For product management
        ]);
        setAdminData(statsResponse.data);
        setProducts(productsResponse.data);
      } catch (err) {
        setError('Failed to load admin data. Please ensure you are logged in as an admin and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data if the user is a confirmed admin
    fetchAdminData();
  }, [authIsLoading, isAuthenticated, user]);

  if (authIsLoading || isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    // Redirect to a dedicated admin login page instead of the homepage.
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  // Pass adminData and the product list to children components
  return React.cloneElement(children, { adminData, products });
};

export default AdminRoute;