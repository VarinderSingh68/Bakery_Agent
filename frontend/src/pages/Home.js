import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';
import { PromoBanner } from '../components/PromoBanner';
import { ChevronRight, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { useAuth, getAuthHeaders } from '../context/AuthContext';
import API_URL from '../lib/api';
import { fallbackProducts } from '../data/fallbackProducts';

const categories = [
  { name: 'Cakes', icon: 'cake' },
  { name: 'Cupcakes', icon: 'cupcake' },
  { name: 'Pastries', icon: 'croissant' },
  { name: 'Donuts', icon: 'donut' },
  { name: 'Cookies', icon: 'cookie' },
  { name: 'Muffins', icon: 'muffin' },
  { name: 'Breads', icon: 'bread' },
  { name: 'Macarons', icon: 'macaron' },
  { name: 'Pies & Tarts', icon: 'pie' },
  { name: 'Brownies & Bars', icon: 'brownie' },
  { name: 'Ice Cream & Frozen', icon: 'icecream' },
  { name: 'Beverages', icon: 'coffee' },
  { name: 'Gift Hampers', icon: 'gift' },
  { name: 'Savory', icon: 'savory' },
  { name: 'Custom Cakes', icon: 'custom' },
];

const categoryIcons = {
  cake: '/cake', cupcake: '/cupcake', croissant: '/croissant', donut: '/donut',
  cookie: '/cookie', muffin: '/muffin', bread: '/bread', macaron: '/macaron',
  pie: '/pie', brownie: '/brownie', icecream: '/icecream', coffee: '/coffee',
  gift: '/gift', savory: '/savory', custom: '/custom'
};

const heroImages = [
  {
    src: 'https://images.pexels.com/photos/3639541/pexels-photo-3639541.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Fresh bakery products',
  },
  {
    src: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Decorated celebration cake',
  },
  {
    src: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Pastries and desserts display',
  },
  {
    src: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Assorted artisanal baked treats',
  },
];

const normalizeProducts = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row, index) => ({
      ...row,
      id: row?.id || row?.slug || `generated-home-${index + 1}`,
      name: row?.name || 'Unnamed Product',
      category: row?.category || 'Uncategorized',
      description: row?.description || '',
      image: row?.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      price: Number(row?.price) || 0,
      stock: Number.isFinite(Number(row?.stock)) ? Number(row.stock) : 0,
    }))
    .filter((row) => Boolean(row.id));
};

export const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState(fallbackProducts.slice(0, 8));
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [turningImageIndex, setTurningImageIndex] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        if (user) {
          const response = await axios.get(`${API_URL}/recommendations`, {
            headers: getAuthHeaders()
          });
          setRecommendations(response.data);
        } else {
          const response = await axios.get(`${API_URL}/recommendations/trending`);
          setRecommendations(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      }
    };
    loadRecommendations();
  }, [user]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroImageIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % heroImages.length;
        setTurningImageIndex(currentIndex);
        return nextIndex;
      });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (turningImageIndex === null) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setTurningImageIndex(null);
    }, 950);

    return () => window.clearTimeout(timeoutId);
  }, [turningImageIndex]);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`, { timeout: 8000 });
      const normalized = normalizeProducts(response.data);
      const products = normalized.length > 0 ? normalized : fallbackProducts;
      setFeaturedProducts(products.slice(0, 8));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setFeaturedProducts(fallbackProducts.slice(0, 8));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-[700px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F3EFE6] via-[#FDFBF7] to-[#F2D780]/20"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#C25934]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-[#4A6B53]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-full shadow-md border border-[#E3DCCF]">
                <Sparkles size={20} className="text-[#C25934]" />
                <span className="text-sm font-semibold text-[#2D241E] uppercase tracking-wider">
                  Handcrafted Fresh Daily
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-['Playfair_Display'] font-bold text-[#2D241E] leading-none tracking-tight" data-testid="hero-title">
                Artisan Baked
                <br />
                <span className="text-[#C25934] inline-block animate-slide-in">Goods Daily</span>
              </h1>
              <p className="text-lg leading-relaxed text-[#5C4B40] max-w-xl">
                Over 180 handcrafted products across 15 categories. From classic cakes to gourmet macarons,
                fresh-baked donuts to curated gift hampers.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/shop"
                  className="group bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-10 py-5 font-semibold transition-all duration-300 inline-flex items-center space-x-2 shadow-lg hover:shadow-2xl transform hover:scale-105"
                  data-testid="shop-now-button"
                >
                  <span>Shop Now</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <Link
                  to="/contact"
                  className="bg-white border-2 border-[#2D241E] text-[#2D241E] hover:bg-[#2D241E] hover:text-[#FDFBF7] rounded-full px-10 py-5 font-semibold transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
                  data-testid="contact-button"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[34rem] animate-scale-in" style={{animationDelay: '0.3s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#C25934]/20 to-[#4A6B53]/20 rounded-[2rem] blur-2xl transform rotate-6"></div>
              <div className="hero-page-frame relative aspect-square overflow-hidden rounded-[2rem] border-4 border-white bg-[#F8F2E9] shadow-2xl">
                <img
                  src={heroImages[heroImageIndex].src}
                  alt={heroImages[heroImageIndex].alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {turningImageIndex !== null && (
                  <img
                    src={heroImages[turningImageIndex].src}
                    alt={heroImages[turningImageIndex].alt}
                    className="hero-page-turn absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Moving Promo Banners */}
      <PromoBanner />

      {/* Categories Section - Scrollable */}
      <section className="py-20 bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mb-4">
              Browse by Category
            </h2>
            <p className="text-base text-[#5C4B40]">
              15 categories of freshly baked delights to explore
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white rounded-2xl p-5 border border-[#E3DCCF] hover:shadow-lg hover:border-[#C25934]/30 transition-all duration-300 hover:-translate-y-1"
                data-testid={`category-${cat.name.toLowerCase().replace(/[ &]/g, '-')}`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#C25934]/10 to-[#F2D780]/20 flex items-center justify-center text-2xl">
                    {cat.name === 'Cakes' && '🎂'}
                    {cat.name === 'Cupcakes' && '🧁'}
                    {cat.name === 'Pastries' && '🥐'}
                    {cat.name === 'Donuts' && '🍩'}
                    {cat.name === 'Cookies' && '🍪'}
                    {cat.name === 'Muffins' && '🧁'}
                    {cat.name === 'Breads' && '🍞'}
                    {cat.name === 'Macarons' && '🌈'}
                    {cat.name === 'Pies & Tarts' && '🥧'}
                    {cat.name === 'Brownies & Bars' && '🍫'}
                    {cat.name === 'Ice Cream & Frozen' && '🍨'}
                    {cat.name === 'Beverages' && '☕'}
                    {cat.name === 'Gift Hampers' && '🎁'}
                    {cat.name === 'Savory' && '🥖'}
                    {cat.name === 'Custom Cakes' && '🎉'}
                  </div>
                  <h3 className="font-semibold text-sm text-[#2D241E] group-hover:text-[#C25934] transition-colors duration-300 leading-tight">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-gradient-to-b from-[#FDFBF7] to-[#F3EFE6] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#F2D780]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#C25934]/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="text-[#C25934] font-semibold uppercase tracking-wider text-sm">Our Bestsellers</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mb-6">
              Featured Products
            </h2>
            <p className="text-lg text-[#5C4B40] max-w-2xl mx-auto">
              Our most popular items loved by our customers
            </p>
          </div>

  <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4" data-testid="featured-products">
              {featuredProducts.map((product, index) => (
                <div key={product.id} className="stagger-item" style={{animationDelay: `${index * 0.1}s`}}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

          <div className="text-center mt-16 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
            <Link
              to="/shop"
              className="group bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-10 py-5 font-semibold transition-all duration-300 inline-flex items-center space-x-2 shadow-lg hover:shadow-2xl transform hover:scale-105"
              data-testid="view-all-button"
            >
              <span>View All Products</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended For You */}
      {recommendations.length > 0 && (
        <section className="py-24 bg-[#FDFBF7] relative overflow-hidden" data-testid="recommendations-section">
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#4A6B53]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-56 h-56 bg-[#F2D780]/20 rounded-full blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 mb-4">
                {user ? (
                  <Heart size={18} className="text-[#C25934]" />
                ) : (
                  <TrendingUp size={18} className="text-[#C25934]" />
                )}
                <span className="text-[#C25934] font-semibold uppercase tracking-wider text-sm">
                  {user ? 'Picked For You' : 'Trending Now'}
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mb-6">
                {user ? 'Recommended For You' : 'Popular Right Now'}
              </h2>
              <p className="text-lg text-[#5C4B40] max-w-2xl mx-auto">
                {user
                  ? 'Based on your orders and preferences, we think you\'ll love these'
                  : 'Discover what our customers are loving right now'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4" data-testid="recommendations-grid">
              {recommendations.map((product, index) => (
                <div key={product.id} className="stagger-item" style={{animationDelay: `${index * 0.1}s`}}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <Link
                to="/shop"
                className="group bg-white border-2 border-[#C25934] text-[#C25934] hover:bg-[#C25934] hover:text-white rounded-full px-10 py-5 font-semibold transition-all duration-300 inline-flex items-center space-x-2 shadow-md hover:shadow-xl transform hover:scale-105"
                data-testid="explore-more-button"
              >
                <span>Explore More</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About Section - Enhanced */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="relative animate-fade-in-up">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#C25934]/20 to-[#4A6B53]/20 rounded-3xl blur-2xl"></div>
              <img
                src="https://images.pexels.com/photos/7447283/pexels-photo-7447283.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Baker at work"
                className="relative rounded-3xl shadow-2xl w-full h-[450px] object-cover border-4 border-white hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="space-y-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div>
                <span className="text-[#C25934] font-semibold uppercase tracking-wider text-sm">Our Story</span>
                <h2 className="text-4xl sm:text-5xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mt-4 mb-6">
                  Our Craft, Your Delight
                </h2>
              </div>
              <p className="text-lg leading-relaxed text-[#5C4B40]">
                For over 20 years, we've been dedicated to creating exceptional baked goods that bring joy
                to every occasion. Our master bakers combine traditional techniques with innovative flavors
                to deliver products that exceed expectations.
              </p>
              <p className="text-lg leading-relaxed text-[#5C4B40]">
                Every item is made fresh daily using premium ingredients sourced from trusted suppliers.
                We believe in the art of baking and the happiness it brings to our community.
              </p>
              <div className="flex flex-wrap gap-12 pt-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#C25934] font-['Playfair_Display']">20+</div>
                  <div className="text-[#5C4B40] mt-1">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#C25934] font-['Playfair_Display']">180+</div>
                  <div className="text-[#5C4B40] mt-1">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#C25934] font-['Playfair_Display']">100%</div>
                  <div className="text-[#5C4B40] mt-1">Fresh Daily</div>
                </div>
              </div>
              <Link
                to="/contact"
                className="inline-block bg-transparent border-2 border-[#2D241E] text-[#2D241E] hover:bg-[#2D241E] hover:text-[#FDFBF7] rounded-full px-8 py-4 font-semibold transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
