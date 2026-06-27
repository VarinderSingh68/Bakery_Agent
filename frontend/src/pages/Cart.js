import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-20" data-testid="cart-page-empty">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShoppingBag size={64} className="mx-auto text-[#8A7E74] mb-4" />
          <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-4">
            Your Cart is Empty
          </h2>
          <p className="text-[#5C4B40] mb-6">
            Add some delicious items to your cart
          </p>
          <Link
            to="/shop"
            className="bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-8 py-3 font-medium transition-all duration-300 inline-block"
            data-testid="shop-link"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12" data-testid="cart-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mb-12">
          Shopping Cart
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.product_id}
                className="bg-white rounded-2xl p-6 border border-[#E3DCCF] flex items-center space-x-6"
                data-testid={`cart-item-${item.product_id}`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <h3 className="font-['Playfair_Display'] font-semibold text-lg text-[#2D241E] mb-1">
                    {item.name}
                  </h3>
                  {item.variant && (
                    <span className="inline-block text-xs font-medium bg-[#F3EFE6] text-[#5C4B40] px-3 py-1 rounded-full mb-2" data-testid={`variant-label-${item.product_id}`}>
                      {item.variant}
                    </span>
                  )}
                  <p className="text-[#C25934] font-semibold text-lg">
                    ₹{item.price}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="bg-[#F3EFE6] p-2 rounded-lg hover:bg-[#E3DCCF] transition-colors duration-300"
                    data-testid={`decrease-${item.product_id}`}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-lg font-semibold w-8 text-center" data-testid={`quantity-${item.product_id}`}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="bg-[#F3EFE6] p-2 rounded-lg hover:bg-[#E3DCCF] transition-colors duration-300"
                    data-testid={`increase-${item.product_id}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="text-[#D94848] hover:bg-[#D94848]/10 p-2 rounded-lg transition-colors duration-300"
                  data-testid={`remove-${item.product_id}`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF] sticky top-24">
              <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-6">
                Order Summary
              </h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-[#5C4B40]">
                  <span>Subtotal</span>
                  <span data-testid="cart-subtotal">₹{cart.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5C4B40]">
                  <span>Shipping</span>
                  <span>₹50.00</span>
                </div>
                <div className="flex justify-between text-[#5C4B40]">
                  <span>Tax (5%)</span>
                  <span>₹{(cart.total * 0.05)?.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#E3DCCF] pt-4">
                  <div className="flex justify-between text-xl font-bold text-[#2D241E]">
                    <span>Total</span>
                    <span data-testid="cart-total">
                      ₹{(cart.total + 50 + cart.total * 0.05)?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    toast.error('Please login to continue to checkout');
                    navigate('/login');
                    return;
                  }
                  navigate('/checkout');
                }}
                className="w-full bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-8 py-4 font-medium transition-all duration-300"
                data-testid="checkout-button"
              >
                Proceed to Checkout
              </button>
              <Link
                to="/shop"
                className="block text-center text-[#5C4B40] hover:text-[#C25934] mt-4 transition-colors duration-300"
                data-testid="continue-shopping"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
