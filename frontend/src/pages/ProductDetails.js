import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Heart, Star, ChevronLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth, getAuthHeaders } from '../context/AuthContext';
import { toast } from 'sonner';
import API_URL from '../lib/api';
import { ProductCard } from '../components/ProductCard';
import { fallbackProducts } from '../data/fallbackProducts';

const normalizeProducts = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row, index) => ({
      ...row,
      id: row?.id || row?.slug || `generated-details-${index + 1}`,
      name: row?.name || 'Unnamed Product',
      category: row?.category || 'Uncategorized',
      description: row?.description || '',
      image: row?.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      price: Number(row?.price) || 0,
      stock: Number.isFinite(Number(row?.stock)) ? Number(row.stock) : 0,
      variants: Array.isArray(row?.variants) ? row.variants : [],
    }))
    .filter((row) => Boolean(row.id));
};

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    let resolvedProduct = null;

    try {
      const response = await axios.get(`${API_URL}/products/${id}`, { timeout: 8000 });
      resolvedProduct = response.data || null;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      const stateProduct = location.state?.product;
      if (stateProduct && String(stateProduct.id) === String(id)) {
        resolvedProduct = stateProduct;
      } else {
        try {
          // Secondary fallback for direct/refresh loads: resolve from product list.
          const allProductsResponse = await axios.get(`${API_URL}/products`, { timeout: 8000 });
          const allProducts = normalizeProducts(allProductsResponse.data);
          resolvedProduct = allProducts.find((p) => String(p.id) === String(id)) || null;
        } catch (fallbackError) {
          resolvedProduct = null;
        }
      }
    }

    if (!resolvedProduct) {
      toast.error('Product not found');
      navigate('/shop');
      setLoading(false);
      return;
    }

    setProduct(resolvedProduct);
    setSelectedVariant(0);
    fetchRecommendedProducts(resolvedProduct);
    setLoading(false);
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews/${id}`, { timeout: 8000 });
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchRecommendedProducts = async (currentProduct) => {
    try {
      const response = await axios.get(`${API_URL}/products`, { timeout: 8000 });
      const allProducts = normalizeProducts(response.data);
      const sameCategory = allProducts.filter(
        (p) => p.id !== currentProduct.id && p.category === currentProduct.category
      );
      const fallbackPool = allProducts.filter((p) => p.id !== currentProduct.id);
      const selected = (sameCategory.length >= 4 ? sameCategory : fallbackPool).slice(0, 4);
      setRecommendedProducts(selected);
    } catch (error) {
      const fallback = fallbackProducts
        .filter((p) => p.id !== currentProduct.id)
        .slice(0, 4);
      setRecommendedProducts(fallback);
    }
  };

  const getVariantPrice = () => {
    if (!product) return 0;
    const variants = product.variants || [];
    if (variants.length === 0) return product.price;
    return Math.round(product.price * variants[selectedVariant].multiplier);
  };

  const getVariantLabel = () => {
    if (!product) return '';
    const variants = product.variants || [];
    if (variants.length === 0) return '';
    return variants[selectedVariant].label;
  };

  const handleAddToCart = () => {
    const variantLabel = getVariantLabel();
    const variantPrice = getVariantPrice();
    addToCart({
      ...product,
      price: variantPrice,
      variant: variantLabel
    }, quantity);
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    try {
      setSubmittingReview(true);
      await axios.post(
        `${API_URL}/reviews`,
        { product_id: id, rating, comment },
        { headers: getAuthHeaders() }
      );
      toast.success('Review submitted successfully');
      setComment('');
      setRating(5);
      fetchReviews();
      fetchProduct();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to submit review';
      toast.error(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[#C25934] border-t-transparent"></div>
      </div>
    );
  }

  if (!product) return null;

  const variants = product.variants || [];
  const currentPrice = getVariantPrice();

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12" data-testid="product-details-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-[#5C4B40] hover:text-[#C25934] mb-8 transition-colors duration-300"
          data-testid="back-button"
        >
          <ChevronLeft size={20} />
          <span>Back to Shop</span>
        </button>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF]">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-[500px] object-cover rounded-xl"
              data-testid="product-image"
            />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-[#8A7E74] uppercase tracking-wider font-semibold mb-2">
                {product.category}
              </p>
              <h1 className="text-4xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mb-4" data-testid="product-name">
                {product.name}
              </h1>
              {product.rating > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={i < Math.floor(product.rating) ? 'fill-[#F2D780] text-[#F2D780]' : 'text-[#E3DCCF]'}
                      />
                    ))}
                  </div>
                  <span className="text-[#5C4B40]">
                    {product.rating} ({product.reviews_count} reviews)
                  </span>
                </div>
              )}
            </div>

            <p className="text-base leading-relaxed text-[#5C4B40]">
              {product.description}
            </p>

            {/* Weight/Size Variants */}
            {variants.length > 1 && (
              <div data-testid="variant-selector">
                <label className="text-[#2D241E] font-semibold mb-3 block">
                  Select Size / Weight:
                </label>
                <div className="flex flex-wrap gap-3">
                  {variants.map((v, idx) => {
                    const vPrice = Math.round(product.price * v.multiplier);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(idx)}
                        className={`relative px-5 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-300 ${
                          selectedVariant === idx
                            ? 'border-[#C25934] bg-[#C25934]/5 text-[#C25934] shadow-md'
                            : 'border-[#E3DCCF] bg-white text-[#2D241E] hover:border-[#C25934]/50'
                        }`}
                        data-testid={`variant-${idx}`}
                      >
                        <div className="font-semibold">{v.label}</div>
                        <div className={`text-xs mt-0.5 ${selectedVariant === idx ? 'text-[#C25934]' : 'text-[#8A7E74]'}`}>
                          ₹{vPrice}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-bold text-[#C25934]" data-testid="product-price">
                ₹{currentPrice}
              </span>
              {selectedVariant > 0 && (
                <span className="text-lg text-[#8A7E74] line-through">
                  ₹{product.price}
                </span>
              )}
              {variants.length > 0 && (
                <span className="text-sm text-[#5C4B40] bg-[#F3EFE6] px-3 py-1 rounded-full" data-testid="selected-variant-label">
                  {variants[selectedVariant].label}
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center space-x-4">
              <label className="text-[#2D241E] font-semibold">Quantity:</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-white border border-[#E3DCCF] px-4 py-2 rounded-lg hover:bg-[#F3EFE6] transition-colors duration-300"
                  data-testid="decrease-quantity"
                >
                  -
                </button>
                <span className="text-xl font-semibold w-12 text-center" data-testid="quantity-value">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="bg-white border border-[#E3DCCF] px-4 py-2 rounded-lg hover:bg-[#F3EFE6] transition-colors duration-300"
                  data-testid="increase-quantity"
                >
                  +
                </button>
              </div>
              <span className="text-[#5C4B40]">
                ({product.stock} in stock)
              </span>
            </div>

            {/* Total */}
            <div className="bg-[#F3EFE6] rounded-xl p-4 flex items-center justify-between">
              <span className="text-[#5C4B40] font-medium">Subtotal:</span>
              <span className="text-2xl font-bold text-[#2D241E]" data-testid="subtotal">
                ₹{currentPrice * quantity}
              </span>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center space-x-2 px-8 py-4 rounded-full font-medium transition-all duration-300 ${
                  product.stock === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#C25934] text-white hover:bg-[#A84C2A]'
                }`}
                data-testid="add-to-cart-button"
              >
                <ShoppingCart size={20} />
                <span>Add to Cart</span>
              </button>

              {user && (
                <button
                  onClick={handleWishlistToggle}
                  className="bg-white border border-[#E3DCCF] p-4 rounded-full hover:bg-[#F3EFE6] transition-all duration-300"
                  data-testid="wishlist-button"
                >
                  <Heart
                    size={24}
                    className={isInWishlist(product.id) ? 'fill-[#C25934] text-[#C25934]' : 'text-[#5C4B40]'}
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF]">
          <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-8">
            Customer Reviews
          </h2>

          {/* Submit Review */}
          {user && (
            <form onSubmit={handleSubmitReview} className="mb-12 p-6 bg-[#F3EFE6] rounded-xl" data-testid="review-form">
              <h3 className="font-semibold text-lg text-[#2D241E] mb-4">Write a Review</h3>
              <div className="mb-4">
                <label className="block text-[#2D241E] mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="transition-colors duration-200"
                      data-testid={`rating-star-${value}`}
                    >
                      <Star
                        size={32}
                        className={value <= rating ? 'fill-[#F2D780] text-[#F2D780]' : 'text-[#E3DCCF]'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[#2D241E] mb-2">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                  placeholder="Share your experience..."
                  data-testid="review-comment"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-6 py-3 font-medium transition-all duration-300 disabled:opacity-50"
                data-testid="submit-review-button"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p className="text-center text-[#5C4B40] py-8">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-6" data-testid="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-[#E3DCCF] pb-6 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-[#2D241E]">{review.user_name}</p>
                      <div className="flex mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? 'fill-[#F2D780] text-[#F2D780]' : 'text-[#E3DCCF]'}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-[#8A7E74]">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[#5C4B40] leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight">
                  Recommended Products
                </h2>
                <p className="text-[#5C4B40] mt-2">
                  You may also like these similar picks
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" data-testid="recommended-products-grid">
              {recommendedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
