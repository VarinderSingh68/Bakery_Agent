import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, Menu, X, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { WhatsAppButton } from './WhatsAppButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const NAV_LINKS = [
  { to: '/', label: 'Home', testId: 'nav-home' },
  { to: '/shop', label: 'Shop', testId: 'nav-shop' },
  { to: '/offers', label: 'Offers', testId: 'nav-offers' },
  { to: '/contact', label: 'Contact', testId: 'nav-contact' },
];

export const Header = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Mirrors the reference site's nav: subtle at the top of the page, then
  // gains a firmer background + shadow once the page starts scrolling.
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu on route change so it never lingers open.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    navigate(trimmedQuery ? `/shop?search=${encodeURIComponent(trimmedQuery)}` : '/shop');
    setMobileMenuOpen(false);
  };

  const cartItemsCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const wishlistCount = wishlist?.products?.length || 0;

  return (
    <header
      className={`site-header sticky top-0 z-50 backdrop-blur-xl border-b border-[#E3DCCF] transition-colors duration-500 ${
        isScrolled ? 'bg-[#FDFBF7]/95 is-scrolled' : 'bg-[#FDFBF7]/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between transition-[height] duration-500 ${
            isScrolled ? 'h-16' : 'h-20'
          }`}
        >
          {/* Logo */}
          <Link to="/" className="appear appear-scale flex items-center" style={{ '--d': '0.08s' }} data-testid="logo-link">
            <h1
              className={`font-bold text-[#C25934] font-['Playfair_Display'] tracking-tight transition-all duration-500 ${
                isScrolled ? 'text-2xl' : 'text-3xl'
              }`}
            >
              Artisan Bakery
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" data-testid="desktop-nav">
            {NAV_LINKS.map((link, index) => {
              const isActive = location.pathname === link.to;
              const delays = ['0.16s', '0.28s', '0.4s', '0.52s'];
              const appearVariant = index % 2 === 0 ? 'appear-scale' : 'appear-soft';
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`appear ${appearVariant} nav-underline font-medium transition-colors duration-300 ${
                    isActive ? 'text-[#C25934] is-active' : 'text-[#2D241E] hover:text-[#C25934]'
                  }`}
                  style={{ '--d': delays[index] || '0.5s' }}
                  data-testid={link.testId}
                >
                  {link.label}
                </Link>
              );
            })}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7E74]" size={16} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-56 rounded-full border border-[#E3DCCF] bg-white py-2 pl-10 pr-4 text-sm text-[#2D241E] outline-none transition-all duration-300 focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/15 focus:w-64"
                data-testid="header-search-input"
              />
            </form>
            <WhatsAppButton className="hidden lg:flex" />
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-6">
            {/* Wishlist */}
            {user && (
              <Link to="/wishlist" className="relative text-[#2D241E] hover:text-[#C25934] transition-all duration-300 hover:scale-110" data-testid="wishlist-link">
                <Heart size={24} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#4A6B53] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse" data-testid="wishlist-count">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative text-[#2D241E] hover:text-[#C25934] transition-all duration-300 hover:scale-110" data-testid="cart-link">
              <ShoppingCart size={24} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#C25934] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-scale-in" data-testid="cart-count">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="text-[#2D241E] hover:text-[#C25934] transition-all duration-300 hover:scale-110 outline-none" data-testid="user-menu">
                  <User size={24} />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-[#E3DCCF] rounded-xl" align="end">
                  <div className="px-4 py-2">
                    <p className="font-semibold text-[#2D241E]">{user.name}</p>
                    <p className="text-sm text-[#8A7E74]">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-[#E3DCCF]" />
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer" data-testid="my-orders-link">
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer" data-testid="admin-panel-link">
                        <ShieldCheck className="mr-2" size={16} />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-[#E3DCCF]" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#D94848]" data-testid="logout-button">
                    <LogOut className="mr-2" size={16} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="appear appear-scale btn-shine bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-6 py-2 font-medium transition-all duration-300 transform hover:scale-105"
                style={{ '--d': '0.34s' }}
                data-testid="login-button"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-[#2D241E] transition-transform duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              <span className={`inline-block transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileMenuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
          }`}
          data-testid="mobile-menu"
        >
          <div className="py-4 border-t border-[#E3DCCF]">
            <form onSubmit={handleSearchSubmit} className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7E74]" size={16} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-full border border-[#E3DCCF] bg-white py-2.5 pl-10 pr-4 text-sm text-[#2D241E] outline-none transition-all duration-300 focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/15"
                data-testid="mobile-header-search-input"
              />
            </form>
            <div className="mb-4">
              <WhatsAppButton iconOnly={false} className="w-full rounded-xl justify-center" />
            </div>
            <nav className="flex flex-col space-y-1">
              {NAV_LINKS.map((link, index) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-1 py-2 font-medium transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                  } ${location.pathname === link.to ? 'text-[#C25934]' : 'text-[#2D241E] hover:text-[#C25934] hover:translate-x-1'}`}
                  style={{ transitionDelay: mobileMenuOpen ? `${index * 60}ms` : '0ms' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-1 py-2 text-[#2D241E] hover:text-[#C25934] font-medium transition-all duration-300 hover:translate-x-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
