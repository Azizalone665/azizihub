'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  FiDollarSign, FiShoppingBag, FiUsers, FiPackage, FiSun, FiMoon, FiBell, FiUser, 
  FiPlusCircle, FiList, FiTag, FiMessageSquare, FiAlertCircle, FiTrendingUp, FiRefreshCw
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

// Memoized Stat Card Component
const StatCard = ({ stat, loading, onClick }: { 
  stat: any; 
  loading: boolean; 
  onClick?: () => void;
}) => (
  <Link href={stat.link} className="group block">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{stat.title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
          )}
          <span className="text-xs text-green-500 inline-flex items-center mt-1">
            <FiTrendingUp className="mr-1" size={12} /> {stat.change}
          </span>
        </div>
        <div className={`${stat.color} p-2.5 md:p-3 rounded-full text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
          <stat.icon size={20} className="md:w-6 md:h-6" />
        </div>
      </div>
    </motion.div>
  </Link>
);

// Memoized Quick Action Component
const QuickAction = ({ action }: { action: any }) => (
  <Link
    href={action.href}
    className={`${action.color} rounded-lg p-2.5 md:p-3 text-center hover:scale-105 transition-transform duration-200`}
  >
    <action.icon className="w-5 h-5 mx-auto mb-1" />
    <span className="text-xs font-medium">{action.title}</span>
  </Link>
);

export default function AdminDashboard() {
  const supabase = createClient();

  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    unreadMessages: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [refreshKey, setRefreshKey] = useState(0);

  // Theme
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch admin name
  useEffect(() => {
    const fetchAdminName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) setAdminName(profile.full_name.split(' ')[0]);
      }
    };
    fetchAdminName();
  }, [supabase]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Run all queries in parallel
      const [
        salesResult,
        ordersCountResult,
        pendingOrdersResult,
        usersCountResult,
        productsCountResult,
        lowStockResult,
        unreadMessagesResult,
        recentOrdersResult,
        messagesResult,
      ] = await Promise.all([
        supabase.from('orders').select('total_amount').eq('status', 'delivered'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('id, name, stock_quantity').lte('stock_quantity', 5).gt('stock_quantity', 0),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalSales = salesResult.data?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      setStats({
        totalSales,
        totalOrders: ordersCountResult.count || 0,
        totalUsers: usersCountResult.count || 0,
        totalProducts: productsCountResult.count || 0,
        lowStockProducts: lowStockResult.data?.length || 0,
        pendingOrders: pendingOrdersResult.count || 0,
        unreadMessages: unreadMessagesResult.count || 0,
      });
      setLowStockItems(lowStockResult.data || []);
      setRecentOrders(recentOrdersResult.data || []);
      setRecentMessages(messagesResult.data || []);

      // Chart data (last 7 days)
      const { data: chartRaw, error: chartError } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('status', 'delivered')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!chartError && chartRaw) {
        const grouped: Record<string, number> = {};
        chartRaw.forEach(order => {
          const date = new Date(order.created_at).toISOString().split('T')[0];
          grouped[date] = (grouped[date] || 0) + order.total_amount;
        });
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();
        setChartData(last7Days.map(date => ({ date, sales: grouped[date] || 0 })));
      } else {
        setChartData([]);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey, fetchDashboardData]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const statCards = useMemo(() => [
    { title: 'Total Sales', value: `₨${stats.totalSales.toLocaleString()}`, icon: FiDollarSign, color: 'bg-green-500', link: '/admin/orders', change: '+12%' },
    { title: 'Total Orders', value: stats.totalOrders, icon: FiShoppingBag, color: 'bg-blue-500', link: '/admin/orders', change: '+5%' },
    { title: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'bg-purple-500', link: '/admin/users', change: '+8%' },
    { title: 'Total Products', value: stats.totalProducts, icon: FiPackage, color: 'bg-orange-500', link: '/admin/products', change: '+3%' },
  ], [stats]);

  const quickActions = useMemo(() => [
    { title: 'Add Product', icon: FiPlusCircle, href: '/admin/products/create', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' },
    { title: 'View Orders', icon: FiList, href: '/admin/orders', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' },
    { title: 'Manage Categories', icon: FiTag, href: '/admin/categories', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' },
    { title: 'Contact Messages', icon: FiMessageSquare, href: '/admin/messages', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300' },
  ], []);

  if (loading && stats.totalOrders === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-lg p-3 md:p-4 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Welcome back, <span className="font-medium text-primary-600">{adminName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Refresh data"
          >
            <FiRefreshCw size={18} className="text-gray-500" />
          </button>
          <Link href="/admin/messages" className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <FiBell size={18} className="text-gray-600 dark:text-gray-300" />
            {stats.unreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </Link>
          <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            {darkMode ? <FiSun size={18} className="text-yellow-400" /> : <FiMoon size={18} className="text-gray-600" />}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
            <FiUser size={16} className="text-white" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat) => (
          <StatCard key={stat.title} stat={stat} loading={loading} />
        ))}
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <QuickAction key={action.title} action={action} />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FiAlertCircle className="text-amber-500" size={18} /> Alerts
          </h2>
          <div className="space-y-3">
            {stats.lowStockProducts > 0 && (
              <Link href="/admin/products" className="block p-3 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 transition">
                <p className="font-medium text-red-700 dark:text-red-300 text-sm">
                  ⚠️ {stats.lowStockProducts} product(s) low on stock
                </p>
                <p className="text-xs text-red-600 mt-1">Stock quantity ≤5 – restock soon</p>
              </Link>
            )}
            {stats.pendingOrders > 0 && (
              <Link href="/admin/orders?status=pending" className="block p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg hover:bg-yellow-100 transition">
                <p className="font-medium text-yellow-700 dark:text-yellow-300 text-sm">
                  📦 {stats.pendingOrders} pending order(s)
                </p>
                <p className="text-xs text-yellow-600 mt-1">Needs your attention</p>
              </Link>
            )}
            {stats.lowStockProducts === 0 && stats.pendingOrders === 0 && (
              <p className="text-gray-500 text-sm">All good! No alerts at the moment.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FiMessageSquare className="text-primary-500" size={18} /> Recent Messages
          </h2>
          {recentMessages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <Link key={msg.id} href="/admin/messages" className="block p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
                  <p className="text-sm font-medium truncate text-gray-800 dark:text-white">
                    {msg.name} – {msg.subject}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4">Sales Overview (Last 7 Days)</h2>
        {chartData.length === 0 && !loading ? (
          <p className="text-gray-500 text-center py-12">No sales data in the last 7 days.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `₨${value.toLocaleString()}`} />
              <Tooltip
                contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none' }}
                formatter={(value) => `₨${value.toLocaleString()}`}
              />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Orders & Low Stock Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b flex justify-between items-center">
            <h2 className="text-base md:text-lg font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-primary-600 text-sm hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 md:px-4 py-2 text-left text-xs">Order #</th>
                  <th className="px-3 md:px-4 py-2 text-left text-xs">Amount</th>
                  <th className="px-3 md:px-4 py-2 text-left text-xs">Status</th>
                  <th className="px-3 md:px-4 py-2 text-left text-xs">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-gray-500">No orders yet</td></tr>
                ) : (
                  recentOrders.map(order => (
                    <tr key={order.id}>
                      <td className="px-3 md:px-4 py-2 text-sm">{order.order_number}</td>
                      <td className="px-3 md:px-4 py-2 text-sm">₨{order.total_amount.toLocaleString()}</td>
                      <td className="px-3 md:px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>{order.status}</span>
                      </td>
                      <td className="px-3 md:px-4 py-2 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b flex justify-between items-center">
            <h2 className="text-base md:text-lg font-semibold">Low Stock Products</h2>
            <Link href="/admin/products" className="text-primary-600 text-sm hover:underline">Manage</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 md:px-4 py-2 text-left text-xs">Product</th>
                  <th className="px-3 md:px-4 py-2 text-left text-xs">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr><td colSpan={2} className="text-center py-6 text-gray-500">No low stock items</td></tr>
                ) : (
                  lowStockItems.map(item => (
                    <tr key={item.id}>
                      <td className="px-3 md:px-4 py-2 text-sm">{item.name}</td>
                      <td className="px-3 md:px-4 py-2 text-sm text-red-600 font-medium">{item.stock_quantity} left</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}