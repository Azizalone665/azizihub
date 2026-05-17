'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiShield, FiRefreshCw, FiClock, FiMail, FiPhone, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState('policy');

  const tabs = [
    { id: 'policy', label: 'Return Policy' },
    { id: 'process', label: 'How to Return' },
    { id: 'faq', label: 'FAQ' },
  ];

  const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, viewport: { once: true } };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.div {...fadeUp}>
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">Returns & Refunds</h1>
        <p className="text-center text-gray-600 mb-8">We want you to love your purchase. If something isn't right, we're here to help.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex justify-center border-b mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Return Policy Tab */}
      {activeTab === 'policy' && (
        <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Return Policy</h2>
            <div className="space-y-4 text-gray-600">
              <div className="flex gap-3">
                <FiClock className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-800">30-Day Return Window</h3>
                  <p>You have 30 days from the date of delivery to request a return. Items must be unused, in original packaging, and with all tags attached.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <FiShield className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-800">Condition Requirements</h3>
                  <p>Products must be in their original condition – unwashed, unworn, and with all labels attached. Electronics must be unopened.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <FiRefreshCw className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-800">Non-Returnable Items</h3>
                  <p>Perishable goods, intimate items, gift cards, and software downloads are not eligible for return.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Refund Process</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2"><FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" /> You'll be notified once your return is received and inspected.</li>
              <li className="flex items-start gap-2"><FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" /> Refunds are processed within 5-7 business days.</li>
              <li className="flex items-start gap-2"><FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" /> Refunds go to your original payment method.</li>
              <li className="flex items-start gap-2"><FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" /> Original shipping charges are non-refundable (unless the item was defective).</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">Damaged or Defective Items</h3>
                <p className="text-red-700 mt-1">If you received a damaged or defective product, contact us within 48 hours. We'll arrange a free replacement or full refund, including shipping costs.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* How to Return Tab */}
      {activeTab === 'process' && (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Easy 3-Step Return Process</h2>
            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl">1</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Request a Return</h3>
                  <p className="text-gray-600">Log into your account, go to Order History, select the order and click "Return Item". Or email us at <a href="mailto:support@azizihub.com" className="text-primary-600">support@azizihub.com</a> with your order number and reason.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl">2</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Pack & Ship</h3>
                  <p className="text-gray-600">Pack the item securely in original packaging. Include the order slip. Ship to the address we provide in our return approval email.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl">3</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Get Refund/Exchange</h3>
                  <p className="text-gray-600">Once we receive and inspect the item, we'll process your refund or send a replacement within 5-7 business days. You'll get a confirmation email.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="bg-white rounded-lg shadow-md p-6 divide-y">
            <div className="py-4">
              <h3 className="text-lg font-semibold text-gray-800">How long do I have to return an item?</h3>
              <p className="text-gray-600 mt-1">You have 30 days from the delivery date to initiate a return.</p>
            </div>
            <div className="py-4">
              <h3 className="text-lg font-semibold text-gray-800">Who pays for return shipping?</h3>
              <p className="text-gray-600 mt-1">For non-defective items, the customer pays return shipping. For defective or wrong items, we cover the shipping cost.</p>
            </div>
            <div className="py-4">
              <h3 className="text-lg font-semibold text-gray-800">How soon will I get my refund?</h3>
              <p className="text-gray-600 mt-1">Once we receive the return, refunds are processed within 5-7 business days. It may take additional time for your bank to reflect.</p>
            </div>
            <div className="py-4">
              <h3 className="text-lg font-semibold text-gray-800">Can I exchange an item instead of refund?</h3>
              <p className="text-gray-600 mt-1">Yes. During the return process, select "Exchange" and choose the replacement size/color. We'll ship the new item once the return is received.</p>
            </div>
            <div className="py-4">
              <h3 className="text-lg font-semibold text-gray-800">My item arrived damaged. What do I do?</h3>
              <p className="text-gray-600 mt-1">Contact us within 48 hours of delivery. Provide your order number and photos of the damage. We'll arrange a free replacement or refund immediately.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Contact Support Section */}
      <div className="mt-12 pt-8 border-t text-center">
        <h3 className="text-xl font-semibold mb-4">Still have questions?</h3>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link href="/contact" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <FiMail /> Contact Support
          </Link>
          <span className="inline-flex items-center gap-2 text-gray-600">
            <FiPhone /> +92 328 8582634
          </span>
        </div>
      </div>
    </div>
  );
}