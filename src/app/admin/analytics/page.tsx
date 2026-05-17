'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  FiDollarSign, FiShoppingBag, FiTrendingUp, FiPackage, FiUsers, FiRefreshCw
} from 'react-icons/fi';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

// Types
interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface CategoryItem {
  name: string;
  value: number;
}

interface ProductRevenue {
  name: string;
  quantity: number;
  revenue: number;
}

// Memoized Summary Card Component
const SummaryCard = ({ card, loading }: { card: any; loading: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-md p-5 md:p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">{card.title}</p>
        {loading ? (
          <div className="h-7 md:h-8 w-20 md:w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
        )}
      </div>
      <div className={`${card.color} p-2.5 md:p-3 rounded-full text-white shadow-lg`}>
        <card.icon size={20} className="md:w-6 md:h-6" />
      </div>
    </div>
  </motion.div>
);

export default function AnalyticsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [dailyOrdersData, setDailyOrdersData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<ProductRevenue[]>([]);
  const [categorySales, setCategorySales] = useState<CategoryItem[]>([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Theme detection
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getDateRange = useCallback(() => {
    const end = new Date();
    let start = new Date();
    if (timeRange === '7d') start.setDate(end.getDate() - 7);
    else if (timeRange === '30d') start.setDate(end.getDate() - 30);
    else if (timeRange === '90d') start.setDate(end.getDate() - 90);
    else start = new Date(0);
    return { start, end };
  }, [timeRange]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    try {
      // 1. Get delivered orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .eq('status', 'delivered')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      if (ordersError) throw ordersError;

      const totalSales = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // 2. Daily aggregation
      const dailyMap = new Map<string, { date: string; sales: number; orders: number }>();
      orders?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!dailyMap.has(date)) dailyMap.set(date, { date, sales: 0, orders: 0 });
        const day = dailyMap.get(date)!;
        day.sales += order.total_amount;
        day.orders += 1;
      });
      const sortedDays = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      setSalesData(sortedDays);
      setDailyOrdersData(sortedDays);

      // 3. Top products (quantity + revenue)
      const orderIds = orders?.map(o => o.id) || [];
      if (orderIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, product_name, quantity, price')
          .in('order_id', orderIds);
        if (!itemsError && items) {
          const productMap = new Map<string, ProductRevenue>();
          for (const item of items) {
            const existing = productMap.get(item.product_id);
            if (existing) {
              existing.quantity += item.quantity;
              existing.revenue += item.price * item.quantity;
            } else {
              productMap.set(item.product_id, {
                name: item.product_name,
                quantity: item.quantity,
                revenue: item.price * item.quantity,
              });
            }
          }
          const top = Array.from(productMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
          setTopProducts(top);
        } else setTopProducts([]);
      } else setTopProducts([]);

      // 4. Category sales
      if (orderIds.length > 0) {
        const { data: fullData, error: fullError } = await supabase
          .from('order_items')
          .select(`
            quantity,
            price,
            products!inner (
              category_id,
              categories (
                name
              )
            )
          `)
          .in('order_id', orderIds);
        
        if (!fullError && fullData) {
          const catRevenue = new Map<string, number>();
          for (const item of fullData) {
            // Safe navigation for nested data
            const products = (item as any).products;
            const categories = products?.categories;
            const catName = categories?.name || 'Uncategorized';
            const revenue = item.price * item.quantity;
            catRevenue.set(catName, (catRevenue.get(catName) || 0) + revenue);
          }
          const catArray = Array.from(catRevenue.entries()).map(([name, value]) => ({ name, value }));
          setCategorySales(catArray);
        } else {
          setCategorySales([]);
        }
      } else {
        setCategorySales([]);
      }

      // 5. Other counts
      const [productsCount, usersCount] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);

      setSummary({
        totalSales,
        totalOrders,
        avgOrderValue,
        totalProducts: productsCount.count || 0,
        totalUsers: usersCount.count || 0,
      });
    } catch (err) {
      console.error('Analytics error:', err);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, getDateRange]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summaryCards = useMemo(() => [
    { title: 'Total Sales', value: `₨${summary.totalSales.toLocaleString()}`, icon: FiDollarSign, color: 'bg-green-500' },
    { title: 'Total Orders', value: summary.totalOrders, icon: FiShoppingBag, color: 'bg-blue-500' },
    { title: 'Avg Order Value', value: `₨${summary.avgOrderValue.toLocaleString()}`, icon: FiTrendingUp, color: 'bg-purple-500' },
    { title: 'Products in Store', value: summary.totalProducts, icon: FiPackage, color: 'bg-orange-500' },
  ], [summary]);

  const timeRangeOptions = useMemo(() => [
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: '90d', label: '90d' },
    { value: 'all', label: 'All Time' },
  ], []);

  if (loading && summary.totalSales === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
          </div>
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            Analytics & Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
            Monitor your store performance with real‑time insights
          </p>
        </div>
        <div className="flex gap-2">
          {timeRangeOptions.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                timeRange === range.value
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
            aria-label="Refresh data"
          >
            <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} card={card} loading={loading} />
        ))}
      </div>

      {/* Sales & Orders Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4">📈 Sales Revenue (Daily)</h2>
          {salesData.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No sales data available for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `₨${value.toLocaleString()}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none' }}
                  formatter={(value) => `₨${value.toLocaleString()}`}
                />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4">📊 Orders Count (Daily)</h2>
          {dailyOrdersData.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No order data available for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products & Category Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4">🏆 Top 5 Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No product sales in this period.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {topProducts.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-white text-sm md:text-base">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                  </div>
                  <p className="font-semibold text-primary-600 dark:text-primary-400 text-sm md:text-base">
                    ₨{product.revenue.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-4">🥧 Sales by Category</h2>
          {categorySales.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No category revenue data.</p>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categorySales.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₨${value.toLocaleString()}`} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* User Stat Footer */}
      {!loading && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiUsers className="text-primary-600 dark:text-primary-400" size={20} />
            <span className="font-medium text-sm md:text-base">Total registered users:</span>
            <span className="text-lg md:text-xl font-bold text-primary-700 dark:text-primary-300">
              {summary.totalUsers.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}