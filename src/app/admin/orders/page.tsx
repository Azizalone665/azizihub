'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { FiSearch, FiPackage, FiX, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  shipping_address: any;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;
const statusOptions = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Memoized Order Row Component
const OrderRow = ({ order, onViewDetails, onStatusChange, updating }: { 
  order: Order; 
  onViewDetails: (order: Order) => void; 
  onStatusChange: (id: string, status: string) => void;
  updating: string | null;
}) => {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
      <td className="px-6 py-4">
        <button
          onClick={() => onViewDetails(order)}
          className="text-primary-600 hover:underline font-medium"
        >
          {order.order_number}
        </button>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="text-gray-900 dark:text-white">{order.shipping_address?.fullName || 'N/A'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{order.shipping_address?.phone || ''}</p>
        </div>
      </td>
      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
        ₨{order.total_amount.toLocaleString()}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}`}>
          {order.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        {new Date(order.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4">
        <select
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
          disabled={updating === order.id}
          className="text-sm border rounded-lg px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </td>
    </tr>
  );
};

export default function AdminOrders() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
    setCurrentPage(1);
  }, [searchTerm, statusFilter, orders]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const filterOrders = useCallback(() => {
    let filtered = [...orders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(term) ||
        order.shipping_address?.fullName?.toLowerCase().includes(term) ||
        order.shipping_address?.phone?.includes(term)
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      toast.success(`Order status updated to ${newStatus}`);
      await fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(null);
    }
  }, [supabase, fetchOrders]);

  const viewOrderDetails = useCallback(async (order: Order) => {
    setSelectedOrder(order);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      if (error) throw error;
      setOrderItems(data || []);
      setShowModal(true);
    } catch (error: any) {
      toast.error('Could not load order items');
      setOrderItems([]);
    }
  }, [supabase]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">Orders</h1>
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
          Orders Management
          <span className="text-sm font-normal text-gray-500 ml-2">({filteredOrders.length} total)</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 bg-primary-50 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No orders found</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-primary-600 hover:underline text-sm">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence mode="wait">
                    {paginatedOrders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        onViewDetails={viewOrderDetails}
                        onStatusChange={updateOrderStatus}
                        updating={updating}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <FiChevronLeft size={18} />
                </button>
                <div className="flex gap-1">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            )}
            
            {/* Results count */}
            <div className="text-center text-xs text-gray-500 py-3 border-t dark:border-gray-700">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details – {selectedOrder.order_number}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Order Information</h3>
                  <p className="text-sm mt-1"><strong>Status:</strong>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        updateOrderStatus(selectedOrder.id, e.target.value);
                        setSelectedOrder({ ...selectedOrder, status: e.target.value });
                      }}
                      className="ml-2 border rounded px-2 py-0.5 text-sm dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </p>
                  <p className="text-sm"><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                  <p className="text-sm"><strong>Payment:</strong> {selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : selectedOrder.payment_method}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Customer Details</h3>
                  <p className="text-sm"><strong>Name:</strong> {selectedOrder.shipping_address?.fullName}</p>
                  <p className="text-sm"><strong>Phone:</strong> {selectedOrder.shipping_address?.phone}</p>
                  <p className="text-sm"><strong>Address:</strong> {selectedOrder.shipping_address?.addressLine1}</p>
                  {selectedOrder.shipping_address?.addressLine2 && <p className="text-sm">{selectedOrder.shipping_address.addressLine2}</p>}
                  <p className="text-sm">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.zipCode}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2">{item.product_name}</td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">₨{item.price.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">₨{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="border-t dark:border-gray-700 pt-4 text-right">
                <p className="text-lg font-bold">Total: ₨{selectedOrder.total_amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="border-t dark:border-gray-700 p-4 flex justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}