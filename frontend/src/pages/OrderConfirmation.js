import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, getAuthHeaders } from '../context/AuthContext';
import { CheckCircle, Package, Calendar, CreditCard } from 'lucide-react';

export const OrderConfirmation = () => {
  const { orderNumber } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get('/api/orders', {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      const foundOrder = response.data.find(o => o.order_number === orderNumber);
      if (foundOrder) {
        setOrder(foundOrder);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
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

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-4">
            Order not found
          </h2>
          <Link to="/shop" className="text-[#C25934] hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12" data-testid="order-confirmation-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="bg-white rounded-2xl p-12 border border-[#E3DCCF] text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#4A6B53] rounded-full mb-6">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-lg text-[#5C4B40] mb-2">
            Thank you for your order, {user?.name}!
          </p>
          <p className="text-[#8A7E74]">
            A confirmation email has been sent to {user?.email}
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF] mb-8">
          <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-6">
            Order Details
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-start space-x-3">
              <Package className="text-[#C25934] mt-1" size={24} />
              <div>
                <p className="text-sm text-[#8A7E74] mb-1">Order Number</p>
                <p className="font-semibold text-[#2D241E]" data-testid="order-number">{order.order_number}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="text-[#C25934] mt-1" size={24} />
              <div>
                <p className="text-sm text-[#8A7E74] mb-1">Delivery Date</p>
                <p className="font-semibold text-[#2D241E]">{order.delivery_date}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CreditCard className="text-[#C25934] mt-1" size={24} />
              <div>
                <p className="text-sm text-[#8A7E74] mb-1">Payment Method</p>
                <p className="font-semibold text-[#2D241E]">{order.payment_method}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4 mb-6 pb-6 border-b border-[#E3DCCF]">
            <h3 className="font-semibold text-[#2D241E]">Items Ordered</h3>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-semibold text-[#2D241E]">{item.name}</p>
                  <p className="text-sm text-[#8A7E74]">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-[#C25934]">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Price Summary */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-[#5C4B40]">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#5C4B40]">
              <span>Shipping</span>
              <span>₹{order.shipping_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#5C4B40]">
              <span>Tax</span>
              <span>₹{order.tax.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[#4A6B53] font-semibold">
                <span>Discount</span>
                <span>-₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-[#2D241E] pt-2 border-t border-[#E3DCCF]">
              <span>Total</span>
              <span data-testid="order-total">₹{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-[#F3EFE6] rounded-xl p-4">
            <p className="text-sm text-[#8A7E74] mb-2">Delivery Address</p>
            <p className="font-semibold text-[#2D241E]">
              {order.shipping_address}<br />
              {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/orders"
            className="flex-1 bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-8 py-4 font-medium transition-all duration-300 text-center"
            data-testid="view-all-orders"
          >
            View All Orders
          </Link>
          <Link
            to="/shop"
            className="flex-1 bg-transparent border border-[#2D241E] text-[#2D241E] hover:bg-[#2D241E] hover:text-[#FDFBF7] rounded-full px-8 py-4 font-medium transition-all duration-300 text-center"
            data-testid="continue-shopping"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};
