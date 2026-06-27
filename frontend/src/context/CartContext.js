import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import API_URL from '../lib/api';
import { useAuth } from './AuthContext';

const CART_STORAGE_KEY = 'bakery_guest_cart';
const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return action.payload;
    case 'ADD_ITEM':
      const existing = state.items.find(item => item.product_id === action.payload.product_id && 
        item.variant === action.payload.variant);
      if (existing) {
        return {
          ...state,
          items: state.items.map(item => 
            item.product_id === action.payload.product_id && item.variant === action.payload.variant
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
          total: state.total + (action.payload.price * action.payload.quantity)
        };
      }
      return {
        ...state,
        items: [...state.items, action.payload],
        total: state.total + (action.payload.price * action.payload.quantity)
      };
    case 'UPDATE_QUANTITY':
      const updatedItems = state.items.map(item => 
        item.product_id === action.payload.product_id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return {
        ...state,
        items: updatedItems.filter(item => item.quantity > 0),
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };
    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.product_id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        total: filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };
    case 'CLEAR_CART':
      return { items: [], total: 0 };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  const { user, token } = useAuth();

  const addGuestItem = (item, successMessage = `${item.name} added to cart!`) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    if (successMessage) {
      toast.success(successMessage);
    }
  };

  const normalizeCartItem = (product, quantity = 1) => ({
    product_id: product.product_id || product.id,
    name: product.name,
    price: Number(product.price) || 0,
    image: product.image,
    quantity,
    variant: product.variant || null
  });

  const fetchServerCart = async () => {
    if (!user) {
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/cart`);
      dispatch({ type: 'SET_CART', payload: response.data });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  // Load guest cart from localStorage on mount
  useEffect(() => {
    if (!user) {
      try {
        const guestCart = localStorage.getItem(CART_STORAGE_KEY);
        if (guestCart) {
          const parsed = JSON.parse(guestCart);
          dispatch({ type: 'SET_CART', payload: parsed });
        }
      } catch (e) {
        console.error('Failed to load guest cart:', e);
      }
    }
  }, []);

  // Sync cart to localStorage for guest
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to save guest cart:', e);
      }
    }
  }, [cart, user]);

  // Load server cart on login/session restore
  useEffect(() => {
    if (user) {
      fetchServerCart();
    }
  }, [user, token]);

  // Sync guest cart to server on login
  useEffect(() => {
    if (user) {
      const guestCart = localStorage.getItem(CART_STORAGE_KEY);
      if (guestCart) {
        try {
          const parsed = JSON.parse(guestCart);
          // Sync items to server
          parsed.items.forEach(item => {
            axios.post(`${API_URL}/cart`, item).catch(e => console.error('Cart sync failed:', e));
          });
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch (e) {
          console.error('Guest cart sync failed:', e);
        }
      }
    }
  }, [user, token]);

  const addToCart = async (product, quantity = 1) => {
    const item = normalizeCartItem(product, quantity);

    if (!user) {
      addGuestItem(item);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/cart`, item);
      dispatch({ type: 'SET_CART', payload: response.data });
      toast.success(`${item.name} added to cart!`);
    } catch (error) {
      console.error('Add to cart failed:', error);
      const status = error.response?.status;

      if (!status || status === 401 || status === 403 || status >= 500) {
        addGuestItem(item, 'Added to cart');
        return;
      }

      toast.error(error.response?.data?.detail || 'Failed to add to cart');
    }
  };

  const removeFromCart = async (product_id) => {
    if (!user) {
      dispatch({ type: 'REMOVE_ITEM', payload: product_id });
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/cart/${product_id}`);
      dispatch({ type: 'SET_CART', payload: response.data });
    } catch (error) {
      console.error('Remove from cart failed:', error);
    }
  };

  const updateQuantity = async (product_id, quantity) => {
    if (!user) {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { product_id, quantity } });
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/cart/${product_id}?quantity=${quantity}`,
        {}
      );
      dispatch({ type: 'SET_CART', payload: response.data });
    } catch (error) {
      console.error('Update cart failed:', error);
    }
  };

  const clearCart = async () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
