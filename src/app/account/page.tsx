'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FiPackage, FiHeart, FiTrendingUp, FiUser, FiClock, FiShoppingBag, FiHelpCircle, FiShield } from 'react-icons/fi';

// Quick action items - static to prevent re-creation
const QUICK_ACTIONS = [
  { href: '/account/profile', label: 'Edit Profile', icon: FiUser, color: 'text-primary-500' },
  { href: '/account/orders', label: 'Order History', icon: FiShoppingBag, color: 'text-primary-500' },
  { href: '/account/wishlist', label: 'My Wishlist', icon: FiHeart, color: 'text-primary-500' },
  { href: '/contact', label: 'Support', icon: FiHelpCircle, color: 'text-primary-500' },
];

// Memoized stat card component
const StatCard = ({ href, title, value, icon: Icon, color, delay }: { 
  href: string; title: string; value: number | string; icon: any; color: string; delay: number 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Link href={href} className="group block">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 md:p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
          <div className={`${color} p-2.5 md:p-3 rounded-full group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

// Memoized recent order item
const RecentOrderItem = ({ order }: { order: any }) => (
  <div className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
    <div className="flex justify-between items-center flex-wrap gap-2">
      <div>
        <p className="font-medium text-gray-800 dark:text-white text-sm md:text-base">{order.order_number}</p>
        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary-600 text-sm md:text-base">₨{order.total_amount.toLocaleString()}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
          order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          order.status === 'shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
          order.status === 'processing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {order.status}
        </span>
      </div>
    </div>
  </div>
);

export default function AccountDashboard() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentOrders();
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    try {
      // Run queries in parallel for better performance
      const [ordersResult, ordersCountResult, wishlistResult] = await Promise.all([
        supabase.from('orders').select('total_amount').eq('user_id', user?.id).eq('status', 'delivered'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('wishlist').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
      ]);

      const totalSpent = ordersResult.data?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      setStats({
        totalOrders: ordersCountResult.count || 0,
        totalSpent,
        wishlistCount: wishlistResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user, supabase]);

  const fetchRecentOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('order_number, total_amount, status, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (!error) setRecentOrders(data || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const firstName = useMemo(() => {
    if (profile?.full_name) return profile.full_name.split(' ')[0];
    return 'Valued Customer';
  }, [profile?.full_name]);

  const userInitial = useMemo(() => {
    return profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  }, [profile?.full_name, user?.email]);

  const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

  if (loading && recentOrders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Header */}
      <motion.div {...fadeUp} className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-5 md:p-6 text-white">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center text-lg md:text-2xl font-bold">
            {userInitial}
          </div>
          <div className="flex-1">
            <h1 className="text-lg md:text-2xl font-bold">Welcome back, {firstName}!</h1>
            <p className="text-white/80 text-xs md:text-sm">Manage your orders, wishlist, and profile settings from here.</p>
          </div>
          <FiShield className="w-8 h-8 md:w-10 md:h-10 text-white/20 hidden sm:block" />
        </div>
      </motion.div>

      {/* Stats Cards - Optimized with parallel animations */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          href="/account/orders" 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={FiPackage} 
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
          delay={0.1} 
        />
        <StatCard 
          href="/account/orders" 
          title="Total Spent" 
          value={`₨${stats.totalSpent.toLocaleString()}`} 
          icon={FiTrendingUp} 
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
          delay={0.15} 
        />
        <StatCard 
          href="/account/wishlist" 
          title="Wishlist Items" 
          value={stats.wishlistCount} 
          icon={FiHeart} 
          color="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" 
          delay={0.2} 
        />
      </div>

      {/* Recent Orders & Quick Links */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FiClock className="text-primary-500 w-4 h-4 md:w-5 md:h-5" /> Recent Orders
            </h2>
            {recentOrders.length > 0 && (
              <Link href="/account/orders" className="text-xs md:text-sm text-primary-600 hover:underline">
                View all ({stats.totalOrders})
              </Link>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <FiShoppingBag className="w-10 h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm md:text-base">No orders yet.</p>
              <Link href="/products" className="inline-block mt-3 text-primary-600 hover:underline text-sm">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {recentOrders.map((order, idx) => (
                <RecentOrderItem key={idx} order={order} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Links & Support */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 md:p-6">
          <h2 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
            <FiUser className="text-primary-500 w-4 h-4 md:w-5 md:h-5" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-2.5 md:p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <action.icon className="w-4 h-4 md:w-5 md:h-5 text-primary-500" />
                <span className="text-sm md:text-base">{action.label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-5 md:mt-6 pt-3 md:pt-4 border-t dark:border-gray-700">
            <p className="text-xs md:text-sm text-gray-500">
              Need help? <Link href="/contact" className="text-primary-600 hover:underline">Contact support</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}