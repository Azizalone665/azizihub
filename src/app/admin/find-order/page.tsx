'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { FiSearch, FiPackage, FiUser, FiPhone, FiMapPin, FiCalendar, FiCreditCard, FiDollarSign } from 'react-icons/fi';

interface OrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  total: number;
}

export default function FindOrderPage() {
  const supabase = createClient();
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const searchOrder = async () => {
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }
    setLoading(true);
    setSearched(true);
    setError('');
    setOrder(null);
    setItems([]);

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber.trim())
      .single();

    if (orderError || !orderData) {
      setError('Order not found');
      setLoading(false);
      return;
    }

    setOrder(orderData);

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderData.id);

    if (!itemsError && itemsData) {
      setItems(itemsData);
    }

    setLoading(false);
  };

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
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
        Find Order by Number
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        {/* Search Box */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Enter order number (e.g., AZH-1778307677238-127)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={searchOrder}
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiSearch />
            )}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Error State */}
        {searched && !loading && error && (
          <div className="text-center py-8">
            <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="border dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <FiPackage className="w-4 h-4" />
                    <span className="font-medium">Order #:</span>
                    <span className="font-mono">{order.order_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <FiCalendar className="w-4 h-4" />
                    <span className="font-medium">Date:</span>
                    <span>{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <FiCreditCard className="w-4 h-4" />
                    <span className="font-medium">Payment:</span>
                    <span>{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600 dark:text-gray-300">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <FiDollarSign className="w-4 h-4" />
                    <span className="font-medium">Total:</span>
                    <span className="text-lg font-bold text-primary-600">₨{order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Address Card */}
            <div className="border dark:border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiUser className="w-5 h-5" /> Customer Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Full Name</p>
                  <p className="font-medium">{order.shipping_address?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium flex items-center gap-1"><FiPhone className="w-3 h-3" /> {order.shipping_address?.phone || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 dark:text-gray-400">Address</p>
                  <p className="font-medium flex items-center gap-1">
                    <FiMapPin className="w-3 h-3" />
                    {order.shipping_address?.addressLine1}
                    {order.shipping_address?.addressLine2 && `, ${order.shipping_address.addressLine2}`}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zipCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Card */}
            <div className="border dark:border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Products Ordered</h3>
              {items.length === 0 ? (
                <p className="text-gray-500">No items found for this order.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left">Image</th>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2">
                            {item.product_image ? (
                              <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100">
                                <Image
                                  src={item.product_image}
                                  alt={item.product_name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                                No img
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{item.product_name}</td>
                          <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">₨{item.price.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">₨{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}