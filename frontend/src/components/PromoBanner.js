import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const defaultBannerSlides = [
  {
    id: 1,
    title: 'Fresh Baked Daily',
    subtitle: '150+ Artisan Products',
    description: 'From classic cakes to gourmet macarons — everything made fresh every morning',
    cta: 'Shop All',
    ctaLink: '/shop',
    bgFrom: '#2D241E',
    bgTo: '#5C4B40',
    accent: '#F2D780',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800'
  },
  {
    id: 2,
    title: 'New: Macarons Collection',
    subtitle: 'French Elegance',
    description: '12 exquisite flavors — from classic vanilla to lavender rose. Perfect for gifting.',
    cta: 'Explore Macarons',
    ctaLink: '/shop?category=Macarons',
    bgFrom: '#4A6B53',
    bgTo: '#2D5438',
    accent: '#F2D780',
    image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800'
  },
  {
    id: 3,
    title: 'Donut Fest',
    subtitle: 'Get 20% Off',
    description: 'Glazed, frosted, filled — try our 12 irresistible donut varieties. Use code SAVE20.',
    cta: 'Order Donuts',
    ctaLink: '/shop?category=Donuts',
    bgFrom: '#C25934',
    bgTo: '#A84C2A',
    accent: '#F2D780',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800'
  },
  {
    id: 4,
    title: 'Gift Hampers',
    subtitle: 'Perfect Presents',
    description: 'Curated bakery gift boxes for every occasion — birthdays, holidays, corporate events.',
    cta: 'See Gift Hampers',
    ctaLink: '/shop?category=Gift Hampers',
    bgFrom: '#6B4C8A',
    bgTo: '#4A3562',
    accent: '#F2D780',
    image: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=800'
  },
  {
    id: 5,
    title: 'Coffee & Treats',
    subtitle: 'Pair It Up',
    description: 'Freshly brewed espresso, matcha lattes, and smoothies — pair with any pastry.',
    cta: 'View Beverages',
    ctaLink: '/shop?category=Beverages',
    bgFrom: '#3D2B1F',
    bgTo: '#5C4132',
    accent: '#D4A574',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800'
  }
];

export const PromoBanner = () => {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState(defaultBannerSlides);

  const goToSlide = useCallback((index) => {
    setCurrent(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    let mounted = true;

    const loadBanners = async () => {
      try {
        const response = await axios.get('/api/banners', { timeout: 8000 });
        const fetched = Array.isArray(response.data)
          ? response.data.map((banner, index) => ({
              id: banner.id || index,
              title: banner.title,
              subtitle: banner.subtitle || '',
              description: banner.description || '',
              cta: banner.cta || 'Shop Now',
              ctaLink: banner.cta_link || '/shop',
              bgFrom: banner.bg_from || '#2D241E',
              bgTo: banner.bg_to || '#5C4B40',
              accent: banner.accent || '#F2D780',
              image: banner.image || '',
            }))
          : [];

        if (mounted && fetched.length > 0) {
          setSlides(fetched);
          setCurrent(0);
        }
      } catch (error) {
        console.error('Failed to load banners:', error);
      }
    };

    loadBanners();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (current >= slides.length) {
      setCurrent(0);
    }
  }, [current, slides.length]);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(nextSlide, 2800);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  if (!slides.length) {
    return null;
  }

  const slide = slides[current] || slides[0];

  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8" data-testid="promo-banner">
      <div className="max-w-7xl mx-auto">
        <div className="relative min-h-[340px] overflow-hidden rounded-[32px] md:rounded-[40px] border border-white/10 shadow-2xl">
          <div
            className="flex min-h-[340px] w-full transition-transform duration-300 ease-out md:min-h-[400px]"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((banner, index) => (
              <div
                key={banner.id}
                className="relative min-h-[340px] md:min-h-[400px] w-full shrink-0 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${banner.bgFrom} 0%, ${banner.bgTo} 100%)` }}
                aria-hidden={index !== current}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={banner.image}
                    alt=""
                    className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                </div>

                <div
                  className="absolute -top-20 -right-20 h-80 w-80 rounded-full blur-3xl opacity-20"
                  style={{ background: banner.accent }}
                />
                <div
                  className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full blur-3xl opacity-15"
                  style={{ background: banner.accent }}
                />

                <div className="relative z-10 flex min-h-[340px] items-center px-8 py-16 sm:px-10 md:min-h-[400px] md:px-14 md:py-20 lg:px-16">
                  <div className="max-w-2xl">
                    <div
                      className="mb-5 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                      style={{ background: `${banner.accent}30`, color: banner.accent, border: `1px solid ${banner.accent}40` }}
                    >
                      {banner.subtitle}
                    </div>

                    <h2
                      className="mb-4 text-3xl font-['Playfair_Display'] font-bold leading-tight text-white sm:text-4xl md:text-5xl"
                      data-testid={index === current ? 'banner-title' : undefined}
                    >
                      {banner.title}
                    </h2>

                    <p className="mb-8 max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
                      {banner.description}
                    </p>

                    <Link
                      to={banner.ctaLink}
                      className="inline-flex items-center space-x-2 rounded-full px-8 py-4 text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                      style={{ background: banner.accent, color: banner.bgFrom }}
                      data-testid={index === current ? 'banner-cta' : undefined}
                    >
                      <span>{banner.cta}</span>
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:left-6 md:w-12 md:h-12 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 flex items-center justify-center transition-all duration-300"
            data-testid="banner-prev"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:right-6 md:w-12 md:h-12 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/30 flex items-center justify-center transition-all duration-300"
            data-testid="banner-next"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex space-x-2.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === current
                    ? 'w-8 h-2.5'
                    : 'w-2.5 h-2.5 hover:bg-white/60'
                }`}
                style={{
                  background: index === current ? slide.accent : 'rgba(255,255,255,0.35)'
                }}
                data-testid={`banner-dot-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
