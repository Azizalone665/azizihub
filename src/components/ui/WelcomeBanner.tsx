'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiGift } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const BANNER_DISMISSED_KEY = 'azizihub_welcome_banner_dismissed';

export default function WelcomeBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  // Check if banner should be shown
  useEffect(() => {
    if (user) {
      // User is logged in → never show banner
      setIsVisible(false);
      return;
    }

    // Check if permanently dismissed (only cleared upon login)
    const permDismissed = localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
    if (permDismissed) {
      setIsVisible(false);
      return;
    }

    // Check cooldown (temporary dismiss)
    const cooldownEnd = sessionStorage.getItem('welcome_banner_cooldown');
    if (cooldownEnd && Date.now() < parseInt(cooldownEnd)) {
      setIsVisible(false);
      setCooldownUntil(parseInt(cooldownEnd));
      // Schedule reappearance
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCooldownUntil(null);
      }, parseInt(cooldownEnd) - Date.now());
      return () => clearTimeout(timer);
    }

    // Show banner
    setIsVisible(true);

    // Auto‑hide after 10 seconds
    const autoHide = setTimeout(() => {
      setIsVisible(false);
      // Set 5 second cooldown
      const newCooldown = Date.now() + 5000;
      sessionStorage.setItem('welcome_banner_cooldown', newCooldown.toString());
      setCooldownUntil(newCooldown);
    }, 10000);

    return () => clearTimeout(autoHide);
  }, [user]);

  const handleClose = () => {
    setIsVisible(false);
    // Set 5 second cooldown
    const newCooldown = Date.now() + 5000;
    sessionStorage.setItem('welcome_banner_cooldown', newCooldown.toString());
    setCooldownUntil(newCooldown);
  };

  // If user is logged in, never render
  if (user) return null;
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
      >
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <FiGift className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm sm:text-base">🎉 Welcome to AziziHub!</p>
              <p className="text-xs sm:text-sm opacity-90 mt-1">
                Register now and enjoy exclusive discounts, flash deals, and a smooth shopping experience.
              </p>
              <div className="mt-2 flex gap-2">
                <Link
                  href="/register"
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition"
                >
                  Login
                </Link>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}