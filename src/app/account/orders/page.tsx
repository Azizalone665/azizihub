'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FiPackage, FiEye, FiChevronLeft, FiChevronRight, FiSearch, FiFilter } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ORDERS_PER_PAGE = 5;

// Memoized order item component
const OrderItem = ({ order }: { order: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
  >
    <div className="flex flex-wrap justify-between items-start gap-3">
      <div className="flex-1 min-w-[180px]">
        <p className="font-mono font-medium text-gray-900 dark:text-white text-sm md:text-base">
          Order #: {order.order_number}
        </p>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          {new Date(order.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      <div className="text-right">
        <p className="text-base md:text-lg font-bold text-primary-600">
          ₨{order.total_amount.toLocaleString()}
        </p>
        <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
          order.status === 'delivered' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : order.status === 'shipped' 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
            : order.status === 'processing' 
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {order.status}
        </span>
      </div>
    </div>
    <div className="mt-3 flex justify-end">
      <Link 
        href={`/order-tracking?order=${order.order_number}`} 
        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline flex items-center gap-1 text-xs md:text-sm transition-colors"
      >
        <FiEye size={14} /> Track Order
      </Link>
    </div>
  </motion.div>
);

export default function OrdersPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchTerm]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const filterOrders = useCallback(() => {
    let filtered = [...orders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter (by order number)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(term)
      );
    }
    
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search order #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition appearance-none cursor-pointer"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 md:py-16">
          <FiPackage className="w-12 h-12 md:w-16 md:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">You haven't placed any orders yet.</p>
          <Link href="/products" className="inline-block mt-4 text-primary-600 hover:text-primary-700 text-sm md:text-base">
            Start Shopping →
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders match your filters.</p>
          <button
            onClick={() => {
              setStatusFilter('all');
              setSearchTerm('');
            }}
            className="mt-3 text-primary-600 hover:underline text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:space-y-4">
            <AnimatePresence mode="wait">
              {paginatedOrders.map((order) => (
                <OrderItem key={order.id} order={order} />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
              >
                <FiChevronLeft size={18} />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                      currentPage === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next page"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          )}
          
          {/* Results count */}
          <div className="text-center text-xs text-gray-500 mt-4">
            Showing {((currentPage - 1) * ORDERS_PER_PAGE) + 1} - {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
        </>
      )}
    </div>
  );
}