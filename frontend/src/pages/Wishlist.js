import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';

export const Wishlist = () => {
  const { wishlist, loading } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#C25934] border-t-transparent"></div>
      </div>
    );
  }

  if (!wishlist?.products || wishlist.products.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-20" data-testid="wishlist-page-empty">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart size={64} className="mx-auto text-[#8A7E74] mb-4" />
          <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-4">
            Your Wishlist is Empty
          </h2>
          <p className="text-[#5C4B40] mb-6">
            Add products you love to your wishlist
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-8 py-3 font-medium transition-all duration-300"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12" data-testid="wishlist-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mb-12">
          My Wishlist
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlist.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};