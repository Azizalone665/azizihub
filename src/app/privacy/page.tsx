'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiShield, FiLock, FiEye, FiMail, FiDatabase, FiGlobe, FiUser } from 'react-icons/fi';

export default function PrivacyPage() {
  const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, viewport: { once: true } };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div {...fadeUp} className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </motion.div>

      <div className="space-y-8">
        {/* Introduction */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            At AziziHub, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website or make a purchase.
          </p>
        </motion.div>

        {/* Information We Collect */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Information We Collect</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <FiUser className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Personal Information</h3>
                <p className="text-gray-600">Name, email address, phone number, shipping/billing address, and payment details when you place an order or create an account.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <FiDatabase className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Usage Data</h3>
                <p className="text-gray-600">IP address, browser type, device information, pages visited, time spent, and referring URLs.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <FiMail className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Communication Data</h3>
                <p className="text-gray-600">Messages you send us via contact forms, email, or chat support.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* How We Use Your Information */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
            <li>Process and fulfill your orders</li>
            <li>Communicate about order status, updates, and customer support</li>
            <li>Improve our website, products, and services</li>
            <li>Prevent fraud and enhance security</li>
            <li>Send promotional offers (only with your consent)</li>
            <li>Comply with legal obligations</li>
          </ul>
        </motion.div>

        {/* Data Sharing */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Data Sharing & Third Parties</h2>
          <p className="text-gray-600 mb-3">We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
            <li><strong>Service Providers:</strong> Payment processors, shipping companies, email platforms (strictly for order fulfillment)</li>
            <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In case of merger or acquisition</li>
          </ul>
        </motion.div>

        {/* Cookies & Tracking */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Cookies & Tracking</h2>
          <p className="text-gray-600">
            We use cookies to enhance your browsing experience, remember preferences, and analyze site traffic. You can disable cookies in your browser settings, but some features may not work properly.
          </p>
        </motion.div>

        {/* Data Security */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Data Security</h2>
          <div className="flex gap-3">
            <FiLock className="w-5 h-5 text-primary-500 mt-1" />
            <p className="text-gray-600">We implement SSL encryption, secure servers, and access controls to protect your data. However, no online transmission is 100% secure.</p>
          </div>
        </motion.div>

        {/* Your Rights */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Your Rights</h2>
          <p className="text-gray-600 mb-3">You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 ml-2">
            <li>Access, correct, or delete your personal data</li>
            <li>Opt out of marketing emails</li>
            <li>Request data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="text-gray-600 mt-3">To exercise these rights, contact us at <a href="mailto:support@azizihub.com" className="text-primary-600">support@azizihub.com</a>.</p>
        </motion.div>

        {/* Children's Privacy */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Children's Privacy</h2>
          <p className="text-gray-600">Our website is not intended for children under 13. We do not knowingly collect data from minors.</p>
        </motion.div>

        {/* Changes to Policy */}
        <motion.div {...fadeUp} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Changes to This Policy</h2>
          <p className="text-gray-600">We may update this policy occasionally. Changes will be posted on this page with the updated date. Please review periodically.</p>
        </motion.div>

        {/* Contact Us */}
        <motion.div {...fadeUp} className="bg-primary-50 rounded-lg p-6 text-center">
          <FiMail className="w-10 h-10 text-primary-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Questions?</h2>
          <p className="text-gray-600 mb-4">If you have any questions about this Privacy Policy, please contact us:</p>
          <p className="text-gray-700">Email: <a href="mailto:support@azizihub.com" className="text-primary-600">support@azizihub.com</a></p>
          <p className="text-gray-700">Phone: +92 328 8582634</p>
          <p className="text-gray-700">Address: Karachi, Pakistan</p>
        </motion.div>
      </div>
    </div>
  );
}