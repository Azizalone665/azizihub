'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiPackage, FiTruck, FiMail, FiPrinter } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  useEffect(() => {
    // Calculate estimated delivery date (5-7 business days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    setEstimatedDelivery(deliveryDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));

    // Track order conversion (optional analytics)
    if (orderNumber) {
      console.log('Order placed:', orderNumber);
    }
  }, [orderNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyOrder = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      toast.success('Order number copied!');
    }
  };

  if (!orderNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-md mx-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Order Found</h1>
          <p className="text-gray-500 mb-6">We couldn't find your order information.</p>
          <Link href="/products" className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 md:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 text-center"
        >
          {/* Success Icon */}
          <div className="mb-6">
            <FiCheckCircle className="w-16 h-16 md:w-20 md:h-20 text-green-500 mx-auto animate-bounce" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Order Placed Successfully!
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>

          {/* Order Number Card */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 my-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Order Number</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg md:text-xl font-mono font-bold text-gray-900 dark:text-white">
                {orderNumber}
              </p>
              <button
                onClick={handleCopyOrder}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                aria-label="Copy order number"
              >
                <FiPrinter size={16} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <FiCheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs md:text-sm font-medium">Order Confirmed</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <FiPackage className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-xs md:text-sm font-medium">Processing</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <FiTruck className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-xs md:text-sm font-medium">Shipped</p>
            </div>
          </div>

          {/* Estimated Delivery */}
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-primary-600 dark:text-primary-400">
              Estimated Delivery: <strong>{estimatedDelivery}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">You'll receive tracking information via email.</p>
          </div>

          {/* What's Next */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">What's Next?</h3>
            <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <FiMail className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <span>You'll receive an order confirmation email shortly.</span>
              </li>
              <li className="flex items-start gap-2">
                <FiPackage className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <span>We'll notify you when your order ships.</span>
              </li>
              <li className="flex items-start gap-2">
                <FiTruck className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <span>Delivery typically takes 3-5 business days.</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link
              href="/account/orders"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition transform hover:scale-[1.02] active:scale-[0.98] text-center"
            >
              View My Orders
            </Link>
            <Link
              href="/products"
              className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-6 py-2.5 rounded-lg font-medium transition text-center"
            >
              Continue Shopping
            </Link>
            <button
              onClick={handlePrint}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <FiPrinter size={16} /> Print Receipt
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500">
              Need help? <Link href="/contact" className="text-primary-600 hover:underline">Contact Support</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}