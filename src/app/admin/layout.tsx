'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiLayout, FiPackage, FiTag, FiShoppingBag, FiSearch, FiUsers, 
  FiMessageSquare, FiFileText, FiPercent, FiBarChart2, FiSettings, 
  FiLogOut, FiMenu, FiX, FiUser 
} from 'react-icons/fi';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: FiLayout },
  { href: '/admin/products', label: 'Products', icon: FiPackage },
  { href: '/admin/categories', label: 'Categories', icon: FiTag },
  { href: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { href: '/admin/find-order', label: 'Find Order', icon: FiSearch },
  { href: '/admin/users', label: 'Users', icon: FiUsers },
  { href: '/admin/messages', label: 'Messages', icon: FiMessageSquare },
  { href: '/admin/blogs', label: 'Blogs', icon: FiFileText },
  { href: '/admin/coupons', label: 'Coupons', icon: FiPercent },
  { href: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
];

// Memoized nav item component
const NavItem = ({ item, isActive, onClick }: { 
  item: typeof navItems[0]; 
  isActive: boolean; 
  onClick?: () => void;
}) => (
  <Link
    href={item.href}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-primary-600 text-white shadow-md'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <item.icon size={18} />
    <span className="text-sm">{item.label}</span>
  </Link>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      
      // Fetch admin name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile?.full_name) {
        setAdminName(profile.full_name.split(' ')[0]);
      }
    };
    checkAuth();
  }, [supabase]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }, [supabase, router]);

  // If on login page, render children directly (no layout)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Not authenticated -> redirect to login
  if (isAuthenticated === false) {
    router.push('/admin/login');
    return null;
  }

  // Still checking -> show loading spinner
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
          AziziHub Admin
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 sticky top-0 h-screen overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              AziziHub
            </h1>
            <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
          </div>
          
          {/* Admin User Info */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Welcome,</p>
              <p className="text-sm text-gray-300">{adminName}</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
          
          <button
            onClick={handleLogout}
            className="mt-8 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
          >
            <FiLogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </aside>

        {/* Mobile Sidebar (Drawer) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <div 
                className="absolute inset-0 bg-black/50" 
                onClick={() => setIsMobileMenuOpen(false)} 
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="absolute left-0 top-0 h-full w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                    AziziHub Admin
                  </h1>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-800 transition"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                
                {/* Admin User Info */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                    {adminName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Welcome,</p>
                    <p className="text-sm text-gray-300">{adminName}</p>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <NavItem
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
                </nav>
                
                <button
                  onClick={handleLogout}
                  className="mt-8 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                >
                  <FiLogOut size={18} />
                  <span className="text-sm">Logout</span>
                </button>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}