'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiShield, FiFileText, FiShoppingBag, FiCreditCard, FiTruck, FiRefreshCw, FiUser, FiAlertCircle } from 'react-icons/fi';

export default function TermsPage() {
  const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, viewport: { once: true } };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div {...fadeUp} className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </motion.div>

      <div className="space-y-8">
        {/* Acceptance */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using AziziHub website, you agree to be bound by these Terms & Conditions. If you disagree with any part, please do not use our services.
          </p>
        </motion.div>

        {/* Account Registration */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Account Registration</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <FiUser className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Account Responsibility</h3>
                <p className="text-gray-600">You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities under your account.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <FiAlertCircle className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Accurate Information</h3>
                <p className="text-gray-600">You must provide accurate, current, and complete information during registration and update it promptly.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Orders & Pricing */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. Orders & Pricing</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
            <li>All prices are in Pakistani Rupees (PKR) and inclusive of applicable taxes unless stated otherwise.</li>
            <li>We reserve the right to change prices without notice. However, prices for confirmed orders remain fixed.</li>
            <li>Placing an order does not guarantee acceptance. We may cancel orders due to stock unavailability, payment issues, or suspected fraud.</li>
            <li>Order confirmation emails are sent upon successful order placement. The contract is formed only when we dispatch the goods.</li>
          </ul>
        </motion.div>

        {/* Payment */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Payment</h2>
          <div className="flex gap-3">
            <FiCreditCard className="w-5 h-5 text-primary-500 mt-1" />
            <p className="text-gray-600">We accept Cash on Delivery (COD), credit/debit cards (Visa/Mastercard), and bank transfers. Online card payments are processed through secure gateways; we do not store your card details. For COD, payment is due upon delivery.</p>
          </div>
        </motion.div>

        {/* Shipping & Delivery */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Shipping & Delivery</h2>
          <div className="flex gap-3">
            <FiTruck className="w-5 h-5 text-primary-500 mt-1" />
            <p className="text-gray-600">Delivery times are estimates and not guaranteed. We are not liable for delays caused by courier services or force majeure. Risk of loss passes to you upon delivery. Please inspect goods immediately; report damages within 48 hours.</p>
          </div>
        </motion.div>

        {/* Returns & Refunds */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Returns & Refunds</h2>
          <div className="flex gap-3">
            <FiRefreshCw className="w-5 h-5 text-primary-500 mt-1" />
            <p className="text-gray-600">We accept returns within 30 days of delivery. Items must be unused, in original packaging, with tags attached. Refunds are processed within 5-7 business days after we receive the return. Some items (e.g., perishables, intimates) are non-returnable. See our <Link href="/returns" className="text-primary-600">Returns Policy</Link> for details.</p>
          </div>
        </motion.div>

        {/* Intellectual Property */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Intellectual Property</h2>
          <div className="flex gap-3">
            <FiShield className="w-5 h-5 text-primary-500 mt-1" />
            <p className="text-gray-600">All content on this site (logos, text, graphics, images, software) is the property of AziziHub or its licensors. You may not reproduce, distribute, or create derivative works without written permission.</p>
          </div>
        </motion.div>

        {/* Prohibited Conduct */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Prohibited Conduct</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
            <li>Using the site for illegal purposes</li>
            <li>Uploading malicious code or attempting to hack</li>
            <li>Interfering with other users' access</li>
            <li>Scraping data without permission</li>
            <li>Violating any applicable laws</li>
          </ul>
        </motion.div>

        {/* Limitation of Liability */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">9. Limitation of Liability</h2>
          <p className="text-gray-600">
            To the maximum extent permitted by law, AziziHub shall not be liable for any indirect, incidental, or consequential damages arising from your use of our website or products. Our total liability shall not exceed the amount you paid for the product in question.
          </p>
        </motion.div>

        {/* Indemnification */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">10. Indemnification</h2>
          <p className="text-gray-600">You agree to indemnify and hold AziziHub harmless from any claims, damages, or expenses arising from your violation of these Terms or infringement of any third‑party rights.</p>
        </motion.div>

        {/* Governing Law */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">11. Governing Law</h2>
          <p className="text-gray-600">These Terms shall be governed by and construed in accordance with the laws of Pakistan. Any disputes shall be resolved in the courts of Karachi.</p>
        </motion.div>

        {/* Changes to Terms */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">12. Changes to Terms</h2>
          <p className="text-gray-600">We may revise these Terms at any time by updating this page. Your continued use of the site after changes constitutes acceptance. It is your responsibility to check periodically.</p>
        </motion.div>

        {/* Contact Information */}
        <motion.div {...fadeUp} className="bg-primary-50 rounded-lg p-6 text-center">
          <FiFileText className="w-10 h-10 text-primary-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Questions About These Terms?</h2>
          <p className="text-gray-600 mb-4">If you have any questions regarding these Terms & Conditions, please contact us:</p>
          <p className="text-gray-700">Email: <a href="mailto:adminazizihub@gmail.com" className="text-primary-600">adminazizihub@gmail.com</a></p>
          <p className="text-gray-700">Phone: +92 300 1234567</p>
        </motion.div>
      </div>
    </div>
  );
}