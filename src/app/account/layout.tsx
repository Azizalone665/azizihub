'use client';

import { useEffect, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FiUser, FiPackage, FiHeart, FiLogOut, FiHome, FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/account', label: 'Dashboard', icon: FiHome },
  { href: '/account/profile', label: 'Profile', icon: FiUser },
  { href: '/account/orders', label: 'Orders', icon: FiPackage },
  { href: '/account/wishlist', label: 'Wishlist', icon: FiHeart },
];

// Memoized nav item to prevent re-renders
const NavItem = memo(({ item, isActive, onClick }: { item: typeof navItems[0]; isActive: boolean; onClick?: () => void }) => (
  <Link
    href={item.href}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    <item.icon size={18} />
    <span className="text-sm md:text-base">{item.label}</span>
  </Link>
));

NavItem.displayName = 'NavItem';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push('/');
  }, [signOut, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading account...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Header */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => {
              const sidebar = document.getElementById('mobile-sidebar');
              sidebar?.classList.toggle('hidden');
            }}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm w-full justify-between"
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">Account Menu</span>
            <FiMenu className="text-gray-500" />
          </button>
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-4">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sticky top-24">
              {/* User Info */}
              <div className="text-center mb-4 pb-3 border-b dark:border-gray-700">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold mx-auto mb-2">
                  {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm md:text-base truncate">
                  {profile?.full_name || 'User'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
              
              {/* Navigation */}
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                  />
                ))}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <FiLogOut size={18} />
                  <span className="text-sm md:text-base">Sign Out</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Mobile Sidebar (Drawer) */}
          <AnimatePresence>
            <div id="mobile-sidebar" className="hidden md:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/50" onClick={() => {
                document.getElementById('mobile-sidebar')?.classList.add('hidden');
              }} />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl p-4 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-gray-700">
                  <h2 className="text-lg font-semibold">Account Menu</h2>
                  <button
                    onClick={() => {
                      document.getElementById('mobile-sidebar')?.classList.add('hidden');
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                
                <div className="text-center mb-4 pb-3 border-b dark:border-gray-700">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2">
                    {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                    {profile?.full_name || 'User'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <NavItem
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href}
                      onClick={() => {
                        document.getElementById('mobile-sidebar')?.classList.add('hidden');
                      }}
                    />
                  ))}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <FiLogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </nav>
              </motion.div>
            </div>
          </AnimatePresence>

          {/* Main Content */}
          <main className="md:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}