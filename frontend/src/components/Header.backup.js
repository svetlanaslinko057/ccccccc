import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Package, Heart, Scale, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useComparison } from '../contexts/ComparisonContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import NotificationsDropdown from './NotificationsDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import SearchBar from './SearchBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Header = () => {
  const { isAuthenticated, user, logout, isSeller, isAdmin } = useAuth();
  const { cartItemsCount } = useCart();
  const { favoritesCount } = useFavorites();
  const { comparisonCount } = useComparison();
  const { unreadCount } = useNotifications();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-50 safe-area-top">
      <div data-testid="header" className="container-main py-3 md:py-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link data-testid="logo-link" to="/" className="flex items-center gap-1 md:gap-2 text-lg md:text-xl font-bold text-[#121212]">
            <img src="/logo.webp" alt="Y-store" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
            <span className="hidden sm:inline">Y-store</span>
          </Link>

          {/* Search Bar - Desktop with Autocomplete */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchBar className="w-full" />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Language Switcher - Hidden on mobile */}
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
            
            {/* Comparison - Hidden on mobile */}
            <Link to="/comparison" className="hidden md:flex relative p-2 hover:bg-gray-100 rounded-lg" title="Порівняння">
              <Scale className="w-5 h-5 lg:w-6 lg:h-6 text-[#121212]" />
              {comparisonCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center text-[10px]">
                  {comparisonCount}
                </span>
              )}
            </Link>
            
            {/* Favorites */}
            <Link to="/favorites" className="relative p-2 hover:bg-gray-100 rounded-lg" title="Обране">
              <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-[#121212]" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center text-[10px]">
                  {favoritesCount}
                </span>
              )}
            </Link>
            
            {/* Notifications - Hidden on small mobile */}
            <div className="hidden sm:block">
              <NotificationsDropdown />
            </div>
            
            {/* Cart */}
            {isAuthenticated && (
              <Link data-testid="cart-link" to="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6 text-[#121212]" />
                {cartItemsCount > 0 && (
                  <span data-testid="cart-count" className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center text-[10px]">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button data-testid="user-menu-trigger" variant="ghost" className="flex items-center gap-1 md:gap-2 p-1 md:p-2">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-[#0071E3] rounded-full flex items-center justify-center text-white font-medium text-sm md:text-base">
                      {user?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.full_name}</span>
                      <span className="text-xs text-gray-500">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="profile-link" onClick={() => navigate('/profile')}>
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="orders-link" onClick={() => navigate('/orders')}>
                    My Orders
                  </DropdownMenuItem>
                  {isSeller && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem data-testid="seller-dashboard-link" onClick={() => navigate('/seller/dashboard')}>
                        Seller Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem data-testid="admin-panel-link" onClick={() => navigate('/admin')}>
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="logout-button" onClick={handleLogout} className="text-red-600">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button data-testid="login-button" variant="ghost" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button data-testid="register-button" onClick={() => navigate('/register')}>
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              data-testid="mobile-menu-toggle"
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile with Autocomplete */}
        <div className="md:hidden mt-4">
          <SearchBar className="w-full" />
        </div>
      </div>
    </header>
  );
};

export default Header;