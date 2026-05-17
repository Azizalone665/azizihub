'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiMail, FiX, FiHelpCircle } from 'react-icons/fi';

export default function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappNumber = '923288582634'; // without '+' or spaces
  const email = 'adminazizihub@gmail.com';

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${whatsappNumber}?text=Hello%2C%20I%20need%20help%20with%20AziziHub`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:${email}?subject=Support%20Request&body=Hello%2C%20I%20need%20assistance%20with...`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3"
          >
            <button
              onClick={handleWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition flex items-center gap-2"
              aria-label="Chat on WhatsApp"
            >
              <FiMessageCircle size={22} />
              <span className="text-sm font-medium hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleEmail}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition flex items-center gap-2"
              aria-label="Send Email"
            >
              <FiMail size={22} />
              <span className="text-sm font-medium hidden sm:inline">Email</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition flex items-center justify-center gap-2"
        aria-label="Support"
      >
        {isOpen ? <FiX size={24} /> : <FiHelpCircle size={24} />}
        <span className="text-sm font-medium hidden sm:inline">Help</span>
      </button>
    </div>
  );
}