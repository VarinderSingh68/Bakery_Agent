import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export const Header = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FDFBF7]/85 border-b border-[#E3DCCF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center" data-testid="logo-link">
            <h1 className="text-3xl font-bold text-[#C25934] font-['Playfair_Display'] tracking-tight">
              Artisan Bakery
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" data-testid="desktop-nav">
            <Link to="/" className="text-[#2D241E] hover:text-[#C25934] font-medium transition-colors duration-300" data-testid="nav-home">
              Home
            </Link>
            <Link to="/shop" className="text-[#2D241E] hover:text-[#C25934] font-medium transition-colors duration-300" data-testid="nav-shop">
              Shop
            </Link>
            <Link to="/offers" className="text-[#2D241E] hover:text-[#C25934] font-medium transition-colors duration-300" data-testid="nav-offers">
              Offers
            </Link>
            <Link to="/contact" className="text-[#2D241E] hover:text-[#C25934] font-medium transition-colors duration-300" data-testid="nav-contact">
              Contact
            </Link>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7E74]" size={16} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-56 rounded-full border border-[#E3DCCF] bg-white py-2 pl-10 pr-4 text-sm text-[#2D241E] outline-none transition-all duration-300 focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/15"
                data-testid="header-search-input"
              />
            </form>
            <WhatsAppButton className="hidden lg:flex" />
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-6">
            {/* Wishlist */}
            {user && (
              <Link to="/wishlist" className="relative text-[#2D241E] hover:text-[#C25934] transition-colors duration-300" data-testid="wishlist-link">
                <Heart size={24} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#4A6B53] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse" data-testid="wishlist-count">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative text-[#2D241E] hover:text-[#C25934] transition-colors duration-300" data-testid="cart-link">
              <ShoppingCart size={24} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#C25934] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold" data-testid="cart-count">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="text-[#2D241E] hover:text-[#C25934] transition-colors duration-300 outline-none" data-testid="user-menu">
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
                className="bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-6 py-2 font-medium transition-all duration-300"
                data-testid="login-button"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-[#2D241E]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#E3DCCF]" data-testid="mobile-menu">
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
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="text-[#2D241E] hover:text-[#C25934] font-medium" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/shop" className="text-[#2D241E] hover:text-[#C25934] font-medium" onClick={() => setMobileMenuOpen(false)}>
                Shop
              </Link>
              <Link to="/offers" className="text-[#2D241E] hover:text-[#C25934] font-medium" onClick={() => setMobileMenuOpen(false)}>
                Offers
              </Link>
              <Link to="/contact" className="text-[#2D241E] hover:text-[#C25934] font-medium" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-[#2D241E] hover:text-[#C25934] font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
