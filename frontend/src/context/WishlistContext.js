import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import API_URL from '../lib/api';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [wishlist, setWishlist] = useState({ products: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && token) {
      fetchWishlist();
    } else {
      setWishlist({ products: [] });
    }
  }, [user, token]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/wishlist`);
      setWishlist(response.data);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      await axios.post(`${API_URL}/wishlist/${productId}`, {});
      await fetchWishlist();
      toast.success('Added to wishlist');
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await axios.delete(`${API_URL}/wishlist/${productId}`);
      await fetchWishlist();
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.products?.some(p => p.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};