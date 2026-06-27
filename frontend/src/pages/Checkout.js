import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth, getAuthHeaders } from '../context/AuthContext';
import { toast } from 'sonner';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { CalendarIcon, CreditCard, Banknote, Building2, Tag } from 'lucide-react';
import { format } from 'date-fns';
import API_URL from '../lib/api';

const paymentMethods = [
  { id: 'cod', name: 'Cash on Delivery', icon: Banknote },
  { id: 'upi', name: 'UPI Payment', icon: CreditCard },
  { id: 'netbanking', name: 'Net Banking', icon: Building2 },
];

export const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state (hooks must be unconditional and in same order)
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Punjab');
  const [zip, setZip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
  const [timeSlot, setTimeSlot] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please log in to place an order.');
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-[#2D241E] text-lg">Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const punjabCities = [
    "Amritsar", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", 
    "Pathankot", "Tarn Taran", "Patiala", "Sangrur", "Barnala", 
    "Fatehgarh Sahib", "Ludhiana", "Malerkotla", "Ferozepur", "Fazilka", 
    "Muktsar", "Moga", "Faridkot", "Bathinda", "Mansa", 
    "Rupnagar (Ropar)", "S.A.S. Nagar (Mohali)", "S.B.S. Nagar (Nawanshahr)"
  ];

  if (!cart?.items || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const subtotal = cart.total;
  const shipping = 50;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax - discount;

  const handleValidateCoupon = async () => {
    if (!couponCode) return;

    try {
      setValidatingCoupon(true);
      const response = await axios.post(
        `${API_URL}/coupons/validate`,
        { code: couponCode, total: subtotal },
        { headers: getAuthHeaders() }
      );
      setDiscount(response.data.discount);
      toast.success(`Coupon applied! ${response.data.discount_percentage}% off`);
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid coupon code';
      toast.error(message);
      setDiscount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const getOrderEndpoint = () => {
    const cleanedBase = API_URL?.toString().replace(/\/+$/, '') || '';

    if (cleanedBase.startsWith('http://') || cleanedBase.startsWith('https://')) {
      return `${cleanedBase}/orders`;
    }

    return `${window.location.origin}/api/orders`;
  };

  const checkBackendHealth = async () => {
    try {
      // Try to reach the backend root or health endpoint
      const backendUrls = [
        `${API_URL}/health`,
        `${window.location.origin}/api/health`,
        `http://localhost:8000/api/health`,
        `http://127.0.0.1:8000/api/health`,
      ];

      for (const healthUrl of backendUrls) {
        try {
          const response = await axios.get(healthUrl, { timeout: 3000, validateStatus: () => true });
          console.log('[Checkout] Backend health check passed at:', healthUrl, 'Status:', response.status);
          if (response.status === 200) {
            return { healthy: true, url: healthUrl, message: 'Backend is reachable' };
          }
        } catch (e) {
          console.warn('[Checkout] Health check failed at:', healthUrl, e.message);
        }
      }

      // If no health endpoint responds, try a simple HEAD request to root
      try {
        const rootResponse = await axios.head(`${window.location.origin}/`, { timeout: 3000, validateStatus: () => true });
        console.log('[Checkout] Backend root reachable, status:', rootResponse.status);
        return { healthy: true, message: 'Backend appears reachable (root)', unverified: true };
      } catch (e) {
        console.warn('[Checkout] Backend root not reachable:', e.message);
      }

      return { healthy: false, message: 'Backend does not appear to be running on any accessible endpoint' };
    } catch (error) {
      console.error('[Checkout] Unexpected error during health check:', error);
      return { healthy: false, message: 'Unable to verify backend status' };
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Perform preflight health check
    const healthStatus = await checkBackendHealth();
    console.log('[Checkout] Health check result:', healthStatus);

    if (!healthStatus.healthy && !healthStatus.unverified) {
      setLoading(false);
      const msg = healthStatus.message || 'Backend server is not responding. Please ensure it is running on port 8000.';
      toast.error(msg);
      return;
    }

    try {
        const orderData = {
          items: cart.items.map(item => ({
            product_id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            variant: item.variant
          })),
          subtotal,
          shipping_cost: shipping,
          tax,
          discount,
          total,
          payment_method: paymentMethods.find(pm => pm.id === paymentMethod).name,
          delivery_date: `${format(deliveryDate, 'PPP')} - ${timeSlot}`,
          shipping_address: address,
          shipping_city: city,
          shipping_state: state,
          shipping_zip: zip,
          coupon_code: couponCode || undefined
        };

      const orderUrl = getOrderEndpoint();
      const response = await axios.post(orderUrl, orderData, {
        headers: getAuthHeaders(),
        withCredentials: true
      });

      await clearCart();
      navigate(`/order-confirmation/${response.data.order_number}`);
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('[Checkout] Place order error:', error);
      console.error('[Checkout] Error request:', error.request);
      console.error('[Checkout] Error response:', error.response);

      const statusCode = error.response?.status;
      let message = error.response?.data?.detail || 'Failed to place order';

      if (statusCode === 401) {
        message = 'Your session has expired. Please log in again to place orders.';
        toast.error(message);
        navigate('/login', { replace: true });
        return;
      }

      if (statusCode === 403) {
        message = 'You are not authorized to place this order. Please check your account or contact support.';
        toast.error(message);
        return;
      }

      if (error.request && !error.response) {
        const orderUrl = getOrderEndpoint();
        
        // Provide detailed diagnostics
        let diagnosticMsg = 'Network Error: Unable to reach backend server.\n\n';
        diagnosticMsg += 'Troubleshooting steps:\n';
        diagnosticMsg += '1. Is backend running? (python -m uvicorn server:app --host 0.0.0.0 --port 8000)\n';
        diagnosticMsg += '2. Is backend accessible at: http://localhost:8000?\n';
        diagnosticMsg += '3. Check browser console for CORS errors\n';
        diagnosticMsg += `\nAttempted endpoint: ${orderUrl}`;
        
        console.log('[Checkout]', diagnosticMsg);
        message = `Cannot reach order server at ${orderUrl}. Please check your network connection and ensure the backend is running on port 8000.`;

        // Fallback attempt (helpful for local setups when API_URL override fails):
        if (orderUrl !== `${window.location.origin}/api/orders`) {
          console.log('[Checkout] Attempting fallback endpoint...');
          try {
            const fallbackResponse = await axios.post(`${window.location.origin}/api/orders`, orderData, {
              headers: getAuthHeaders(),
              withCredentials: true,
              timeout: 10000
            });
            await clearCart();
            navigate(`/order-confirmation/${fallbackResponse.data.order_number}`);
            toast.success('Order placed successfully using local fallback endpoint!');
            return;
          } catch (fallbackErr) {
            console.warn('[Checkout] Fallback order endpoint also failed', fallbackErr);
          }
        }
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12" data-testid="checkout-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mb-12">
          Checkout
        </h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Delivery Address */}
              <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF]">
                <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-6">
                  Delivery Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#2D241E] font-medium mb-2">Street Address *</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                      placeholder="House no, street name"
                      data-testid="address-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#2D241E] font-medium mb-2">City *</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                        data-testid="city-select"
                      >
                        <option value="">Select City</option>
                        {punjabCities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#2D241E] font-medium mb-2">State *</label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                      >
                        <option value="Punjab">Punjab (India)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#2D241E] font-medium mb-2">PIN Code *</label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      required
                      pattern="[0-9]{6}"
                      className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                      placeholder="6-digit PIN code"
                      data-testid="zip-input"
                    />
                  </div>
                </div>
              </div>

              {/* Time Slot + Date */}
              <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF]">
                <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-6">
                  Delivery Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#2D241E] font-medium mb-2">Preferred Date *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#E3DCCF] hover:border-[#C25934] bg-white transition-all duration-300"
                          data-testid="date-picker-button"
                        >
                          <span>{format(deliveryDate, 'PPP')}</span>
                          <CalendarIcon size={20} className="text-[#8A7E74]" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-[#E3DCCF] rounded-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={deliveryDate}
                          onSelect={(date) => date && setDeliveryDate(date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="block text-[#2D241E] font-medium mb-2">Time Slot *</label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                    >
                      <option value="">Select Time Slot</option>
                      <option value="morning">Morning (9AM - 12PM)</option>
                      <option value="afternoon">Afternoon (12PM - 3PM)</option>
                      <option value="evening">Evening (3PM - 6PM)</option>
                      <option value="late-evening">Late Evening (6PM - 9PM)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF]">
                <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-6">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <label
                        key={method.id}
                        className={`flex items-center space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          paymentMethod === method.id
                            ? 'border-[#C25934] bg-[#C25934]/5'
                            : 'border-[#E3DCCF] hover:border-[#C25934]/50'
                        }`}
                        data-testid={`payment-${method.id}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="text-[#C25934] focus:ring-[#C25934]"
                        />
                        <Icon size={24} className="text-[#C25934]" />
                        <span className="font-medium text-[#2D241E]">{method.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF] sticky top-24">
                <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-6">
                  Order Summary
                </h2>

                {/* Coupon */}
                <div className="mb-6">
                  <label className="block text-[#2D241E] font-medium mb-2">
                    <Tag size={16} className="inline mr-2" />
                    Apply Coupon
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 px-4 py-2 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                      data-testid="coupon-input"
                    />
                    <button
                      type="button"
                      onClick={handleValidateCoupon}
                      disabled={validatingCoupon || !couponCode}
                      className="bg-[#4A6B53] text-white hover:bg-[#3D5844] rounded-xl px-4 py-2 font-medium transition-all duration-300 disabled:opacity-50"
                      data-testid="apply-coupon-button"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-xs text-[#8A7E74] mt-2">
                    Available: WELCOME10, SAVE20, FESTIVE25
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[#5C4B40]">
                    <span>Subtotal</span>
                    <span data-testid="summary-subtotal">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#5C4B40]">
                    <span>Shipping</span>
                    <span>₹{shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#5C4B40]">
                    <span>Tax (5%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#4A6B53] font-semibold">
                      <span>Discount</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#E3DCCF] pt-3">
                    <div className="flex justify-between text-xl font-bold text-[#2D241E]">
                      <span>Total</span>
                      <span data-testid="summary-total">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-8 py-4 font-medium transition-all duration-300 disabled:opacity-50"
                  data-testid="place-order-button"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
