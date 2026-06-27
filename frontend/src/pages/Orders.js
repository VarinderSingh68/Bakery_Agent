import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, getAuthHeaders } from '../context/AuthContext';
import { Package, ShoppingBag } from 'lucide-react';
import API_URL from '../lib/api';

export const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`, {
        headers: getAuthHeaders()
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#C25934] border-t-transparent"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-20" data-testid="orders-page-empty">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShoppingBag size={64} className="mx-auto text-[#8A7E74] mb-4" />
          <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-4">
            No Orders Yet
          </h2>
          <p className="text-[#5C4B40] mb-6">
            You haven't placed any orders yet
          </p>
          <Link
            to="/shop"
            className="bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-8 py-3 font-medium transition-all duration-300 inline-block"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12" data-testid="orders-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mb-12">
          My Orders
        </h1>

        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-8 border border-[#E3DCCF]"
              data-testid={`order-${order.order_number}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-xl font-['Playfair_Display'] font-bold text-[#2D241E]">
                      Order #{order.order_number}
                    </h3>
                    <span className="bg-[#4A6B53] text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[#8A7E74]">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#C25934]">₹{order.total.toFixed(2)}</p>
                  <p className="text-sm text-[#8A7E74]">{order.payment_method}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-4 py-3 border-t border-[#E3DCCF]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-[#2D241E]">{item.name}</p>
                      <p className="text-sm text-[#8A7E74]">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-[#C25934]">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-[#E3DCCF]">
                <div>
                  <p className="text-sm text-[#8A7E74] mb-1">Delivery Date</p>
                  <p className="font-semibold text-[#2D241E]">{order.delivery_date}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8A7E74] mb-1">Delivery Address</p>
                  <p className="font-semibold text-[#2D241E] text-right">
                    {order.shipping_address}, {order.shipping_city}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};