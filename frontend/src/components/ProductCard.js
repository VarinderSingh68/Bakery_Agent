import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import analytics from '../services/analytics';

const safeTrack = (fn) => {
  try {
    fn();
  } catch (error) {
    // Analytics should never block product interactions/rendering.
    console.debug('Analytics tracking skipped:', error?.message || error);
  }
};

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  const inWishlist = isInWishlist(product.id);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  
  const currentVariant = product.variants ? product.variants[selectedVariantIndex] : null;
  const variantPrice = currentVariant ? Math.round(product.price * currentVariant.multiplier) : product.price;

  const handleAddToCart = (e) => {
    e.preventDefault();
    const cartProduct = currentVariant ? {
      ...product,
      price: variantPrice,
      variant: currentVariant.label
    } : product;
    addToCart(cartProduct);
    safeTrack(() => analytics.addToCart(product.id, product.name, variantPrice, 1, currentVariant?.label));
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.id);
      safeTrack(() => analytics.removeFromWishlist(product.id, product.name));
    } else {
      addToWishlist(product.id);
      safeTrack(() => analytics.addToWishlist(product.id, product.name, product.price));
    }
  };

  const handleProductClick = () => {
    safeTrack(() => analytics.productView(product.id, product.name, product.price));
  };

  return (
    <Link
      to={`/product/${encodeURIComponent(product.id)}`}
      state={{ product }}
      onClick={handleProductClick}
      data-testid={`product-card-${product.id}`}
      className="block h-full"
    >
      <div className="group mx-auto flex h-full max-w-[17.5rem] flex-col overflow-hidden rounded-[1.45rem] border border-[#E7DED1] bg-white/95 shadow-[0_12px_26px_rgba(92,75,64,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_22px_42px_rgba(92,75,64,0.14)]">
        {/* Image with lazy loading */}
        <div className="relative aspect-[1.28] overflow-hidden bg-[radial-gradient(circle_at_top,#fff9f0_0%,#f3efe6_62%,#eadfce_100%)]">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            data-testid={`product-image-${product.id}`}
            onLoad={(e) => e.target.setAttribute('data-loaded', 'true')}
          />
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2D241E]/20 via-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          
          {product.stock < 5 && product.stock > 0 && (
            <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[#F2D780] to-[#E9C764] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2D241E] shadow-md">
              Low Stock
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[#D94848] to-[#C23030] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-md">
              Out of Stock
            </div>
          )}
          {user && (
            <button
              onClick={handleWishlistToggle}
              className="absolute left-3 top-3 rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white"
              data-testid={`wishlist-button-${product.id}`}
            >
              <Heart
                size={16}
                className={`transition-colors duration-300 ${inWishlist ? 'fill-[#C25934] text-[#C25934]' : 'text-[#5C4B40]'}`}
              />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3 sm:p-3.5">
          <div className="mb-1 flex items-start justify-between">
            <div>
              <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#8A7E74]">
                {product.category}
              </p>
              <h3 className="font-['Playfair_Display'] text-[0.95rem] font-semibold leading-snug text-[#2D241E] transition-colors duration-300 group-hover:text-[#C25934]" data-testid={`product-name-${product.id}`}>
                {product.name}
              </h3>
            </div>
          </div>

          <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-[#5C4B40]">
            {product.description}
          </p>

          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[1rem] font-bold text-[#C25934]" data-testid={`product-price-${product.id}`}>
                  ₹{variantPrice}
                  {currentVariant && (
                    <span className="ml-1 block text-[9px] text-[#8A7E74]">({currentVariant.label})</span>
                  )}
                </p>
                {product.rating > 0 && (
                  <div className="mt-1 flex items-center">
                    <span className="text-[#F2D780] mr-1 text-lg">★</span>
                    <span className="text-[10px] font-medium text-[#5C4B40]">
                      {product.rating} ({product.reviews_count})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {product.variants && product.variants.length > 1 && (
              <div>
                <select 
                  value={selectedVariantIndex} 
                  onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E3DCCF] bg-white px-2.5 py-2 text-[10px] shadow-sm focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                >
                  {product.variants.map((v, idx) => {
                    const vPrice = Math.round(product.price * v.multiplier);
                    return <option key={idx} value={idx}>{v.label} - ₹{vPrice}</option>;
                  })}
                </select>
              </div>
            )}
            
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`flex w-full items-center justify-center space-x-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all duration-300 ${
                product.stock === 0
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-gradient-to-r from-[#C25934] to-[#A84C2A] text-white shadow-md hover:scale-[1.01] hover:from-[#A84C2A] hover:shadow-lg'
              }`}
              data-testid={`add-to-cart-${product.id}`}
            >
              <ShoppingCart size={14} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};
