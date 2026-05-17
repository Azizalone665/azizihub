'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiShoppingCart, FiTruck, FiShield, FiCreditCard, FiHelpCircle, FiRefreshCw, FiUser, FiMail } from 'react-icons/fi';
import Link from 'next/link';

const faqCategories = [
  {
    id: 'orders',
    label: 'Orders & Shipping',
    icon: FiShoppingCart,
    faqs: [
      { q: 'How do I place an order?', a: 'Simply browse our products, add items to your cart, proceed to checkout, enter your shipping details, and complete payment. You\'ll receive an order confirmation via email.' },
      { q: 'Can I change or cancel my order?', a: 'Orders can be cancelled within 1 hour of placement. Contact support immediately. Once processed, cancellations are not possible.' },
      { q: 'How do I track my order?', a: 'Use our Order Tracking page with your order number. You\'ll also receive tracking updates via email and SMS.' },
      { q: 'What shipping methods do you offer?', a: 'We offer standard delivery (3-5 business days) and express delivery (1-2 business days). Free shipping on orders over ₨5000.' },
      { q: 'Do you ship internationally?', a: 'Currently we ship only within Pakistan. International shipping will be available soon.' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & Refunds',
    icon: FiCreditCard,
    faqs: [
      { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD), credit/debit cards (Visa/Mastercard), and bank transfers. Online payments will be launched soon.' },
      { q: 'Is it safe to pay online?', a: 'Yes, we use secure payment gateways with encryption. Your financial details are never stored on our servers.' },
      { q: 'How do I get a refund?', a: 'Refunds are processed within 5-7 business days after we receive the returned item. The amount goes to your original payment method.' },
      { q: 'Will I be charged for return shipping?', a: 'For defective items or wrong shipments, we cover shipping. For other returns, the customer pays return shipping.' },
    ],
  },
  {
    id: 'products',
    label: 'Products & Stock',
    icon: FiShield,
    faqs: [
      { q: 'Are the products authentic?', a: 'Yes, all products are sourced directly from brands or authorized distributors. We guarantee 100% authenticity.' },
      { q: 'What if an item is out of stock?', a: 'You can sign up for "Notify Me" on the product page. We\'ll email you when it becomes available.' },
      { q: 'Can I see a product before buying?', a: 'We provide detailed descriptions, multiple images, and customer reviews to help you decide. For certain items, we offer video consultations.' },
      { q: 'How do I know my size?', a: 'Check the size chart on each product page. If unsure, contact our support for guidance.' },
    ],
  },
  {
    id: 'account',
    label: 'Account & Support',
    icon: FiUser,
    faqs: [
      { q: 'How do I create an account?', a: 'Click "Login" → "Sign Up" and fill in your details. Or you can checkout as a guest.' },
      { q: 'I forgot my password. What should I do?', a: 'Click "Forgot Password" on the login page. We\'ll send a reset link to your email.' },
      { q: 'How do I contact customer support?', a: 'Use our Contact Us page, email support@azizihub.com, or call +92 300 1234567 (Mon-Fri, 9am-6pm).' },
      { q: 'Can I update my personal information?', a: 'Yes, log into your account and go to Account Settings > Profile.' },
    ],
  },
  {
    id: 'returns',
    label: 'Returns & Warranty',
    icon: FiRefreshCw,
    faqs: [
      { q: 'What is your return policy?', a: 'We accept returns within 30 days of delivery. Items must be unused, with original packaging and tags.' },
      { q: 'How long does the return process take?', a: 'Once we receive the item, refunds are processed in 5-7 business days. Exchanges take 7-10 business days.' },
      { q: 'Do you offer warranties?', a: 'Most electronics come with manufacturer warranty (6-12 months). Check product page for details.' },
      { q: 'What if I receive a damaged item?', a: 'Contact us within 48 hours with photos. We\'ll arrange free replacement or refund immediately.' },
    ],
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('orders');
  const [openFaqs, setOpenFaqs] = useState<string[]>([]);

  const toggleFaq = (question: string) => {
    setOpenFaqs(prev =>
      prev.includes(question) ? prev.filter(q => q !== question) : [...prev, question]
    );
  };

  const currentCategory = faqCategories.find(c => c.id === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions about orders, payments, products, and more.
        </p>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {faqCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              activeCategory === cat.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="max-w-3xl mx-auto">
        {currentCategory?.faqs.map((faq, idx) => (
          <motion.div
            key={faq.q}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="border-b border-gray-200 last:border-0"
          >
            <button
              onClick={() => toggleFaq(faq.q)}
              className="w-full py-4 flex justify-between items-center text-left"
            >
              <span className="font-medium text-gray-800 text-lg">{faq.q}</span>
              {openFaqs.includes(faq.q) ? <FiChevronUp className="text-gray-500" /> : <FiChevronDown className="text-gray-500" />}
            </button>
            {openFaqs.includes(faq.q) && (
              <div className="pb-4 text-gray-600 leading-relaxed">
                {faq.a}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Still need help? */}
      <div className="mt-16 text-center bg-gray-50 rounded-lg p-8">
        <FiHelpCircle className="w-12 h-12 text-primary-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Still have questions?</h2>
        <p className="text-gray-600 mb-6">We're here to help. Contact our support team.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
          >
            <FiMail /> Contact Us
          </Link>
          <Link
            href="/returns"
            className="inline-flex items-center gap-2 border border-primary-600 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            <FiRefreshCw /> View Return Policy
          </Link>
        </div>
      </div>
    </div>
  );
}