'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiChevronDown } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/client';

// Debounce function for search input
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch cart count only when user changes
  useEffect(() => {
    if (user) {
      fetchCartCount();
    } else {
      setCartCount(0);
    }
  }, [user]);

  const fetchCartCount = useCallback(async () => {
    try {
      const { data: cart } = await supabase
        .from('cart')
        .select('id, cart_items(count)')
        .eq('user_id', user?.id)
        .single();
      if (cart?.cart_items) setCartCount(cart.cart_items.length);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  }, [user, supabase]);

  // Handle search with debounced value
  useEffect(() => {
    if (debouncedSearchQuery && isSearchFocused) {
      // Optional: Add live search suggestions here
    }
  }, [debouncedSearchQuery, isSearchFocused]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
      setSearchQuery('');
    }
  }, [searchQuery, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/blogs', label: 'Blogs' },
    { href: '/contact', label: 'Contact' },
  ];

  // Memoize cart button to prevent unnecessary re-renders
  const CartButton = memo(() => (
    <Link
      href="/cart"
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Shopping cart"
    >
      <FiShoppingCart size={22} className="text-gray-700 dark:text-gray-200" />
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-md"
            aria-label={`${cartCount} items in cart`}
          >
            {cartCount > 99 ? '99+' : cartCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  ));

  CartButton.displayName = 'CartButton';

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo - Optimized for mobile */}
          <Link
            href="/"
            className="flex items-center shrink-0 active:scale-95 transition-transform duration-200"
            aria-label="Go to homepage"
          >
            <Image
              src="/logo.png"
              alt="AziziHub"
              width={100}
              height={34}
              priority
              className="object-contain w-auto h-8 md:h-10"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <span className="ml-2 text-lg md:text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent hidden sm:inline">
              AziziHub
            </span>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  pathname === link.href
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.span
                    layoutId="activeNav"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Search Bar - Desktop only */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full px-4 py-2 pl-10 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
                  aria-label="Search products"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <button 
                  type="submit" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600"
                  aria-label="Submit search"
                >
                  <FiSearch size={18} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <CartButton />

            {/* User Menu */}
            {user ? (
              <div className="relative group">
                <button 
                  className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="User menu"
                >
                  <FiUser size={22} className="text-gray-700 dark:text-gray-200" />
                  <FiChevronDown size={16} className="text-gray-500 hidden sm:block" />
                </button>
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 hidden group-hover:block z-50 border border-gray-100 dark:border-gray-700">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/account/wishlist"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Wishlist
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-white bg-primary-600 rounded-full hover:bg-primary-700 transition shadow-md hover:shadow-lg"
              >
                Login
              </Link>
            )}

            {/* Mobile menu button - Larger touch target */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Optimized for touch */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md"
          >
            <div className="px-4 py-3 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium transition ${
                    pathname === link.href
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <form onSubmit={handleSearch} className="mt-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-10 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                    aria-label="Search products"
                  />
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default memo(Navbar);