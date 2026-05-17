'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiSearch, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_method: string;
  shipping_address: any;
  created_at: string;
  order_items?: {
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: FiClock, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  { key: 'processing', label: 'Processing', icon: FiPackage, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { key: 'shipped', label: 'Shipped', icon: FiTruck, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  { key: 'delivered', label: 'Delivered', icon: FiCheckCircle, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  { key: 'cancelled', label: 'Cancelled', icon: FiXCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const urlOrderNumber = params.orderId as string;
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const supabase = createClient();

  // Auto-search if order number is in URL
  useEffect(() => {
    if (urlOrderNumber && urlOrderNumber !== orderNumber) {
      setOrderNumber(urlOrderNumber);
      searchOrder(urlOrderNumber);
    }
  }, [urlOrderNumber]);

  const searchOrder = useCallback(async (orderNum?: string) => {
    const searchNumber = orderNum || orderNumber;
    if (!searchNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }
    setLoading(true);
    setSearched(true);
    setOrder(null);
    setItems([]);

    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', searchNumber.trim())
        .single();

      if (orderError || !orderData) throw new Error('Order not found');

      setOrder(orderData);

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('product_name, quantity, price, total')
        .eq('order_id', orderData.id);

      if (!itemsError && itemsData) setItems(itemsData);
    } catch (err: any) {
      toast.error(err.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  }, [orderNumber, supabase]);

  const getCurrentStep = (status: string) => {
    if (status === 'cancelled') return 4;
    const index = statusSteps.findIndex(s => s.key === status);
    return index !== -1 ? index : 0;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchOrder();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Track Your Order</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
            Enter your order number to get the latest status
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g., AZH-1700000000000-123"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition dark:bg-gray-700 dark:text-white"
              />
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <button
              onClick={() => searchOrder()}
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSearch size={18} />
              )}
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </div>
        </motion.div>

        {/* Not Found State */}
        <AnimatePresence>
          {searched && !loading && !order && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md"
            >
              <FiXCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Order Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Please check your order number and try again.
              </p>
              <Link href="/contact" className="inline-block mt-4 text-primary-600 hover:underline text-sm">
                Need help? Contact us →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Details */}
        <AnimatePresence>
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Order Summary Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">
                      Order #{order.order_number}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold text-primary-600">₨{order.total_amount.toLocaleString()}</p>
                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="my-8 px-2">
                  <div className="relative">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2" />
                    <div className="relative flex justify-between">
                      {statusSteps.map((step, idx) => {
                        const currentStep = getCurrentStep(order.status);
                        const isActive = idx <= currentStep;
                        const isCancelled = order.status === 'cancelled';
                        const Icon = step.icon;
                        return (
                          <div key={step.key} className="text-center flex-1">
                            <div className={`relative w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-all ${
                              isActive && !isCancelled 
                                ? `${step.bgColor} ${step.color}` 
                                : isCancelled && step.key === 'cancelled' 
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <p className={`text-xs mt-2 ${isActive && !isCancelled ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border-t dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    <FiMapPin className="text-primary-500" size={16} /> Shipping Address
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <p>{order.shipping_address?.fullName}</p>
                    <p>{order.shipping_address?.addressLine1}</p>
                    {order.shipping_address?.addressLine2 && <p>{order.shipping_address.addressLine2}</p>}
                    <p>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zipCode}</p>
                    <p className="flex items-center gap-1"><FiPhone size={12} /> {order.shipping_address?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Order Items</h3>
                {items.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No items found.</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b dark:border-gray-700 pb-3 last:border-0">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{item.product_name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-white">₨{item.total.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Help Section */}
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  Need help? <Link href="/contact" className="text-primary-600 hover:underline">Contact our support team</Link>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}