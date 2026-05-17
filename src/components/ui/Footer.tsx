'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, memo } from 'react';
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiMail, FiPhone, FiMapPin, FiSend, FiArrowUp } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

// Memoized footer section to prevent unnecessary re-renders
const FooterSection = memo(({ title, links }: { title: string; links: { name: string; href: string }[] }) => (
  <div>
    <h3 className="text-gray-800 dark:text-gray-800 font-semibold mb-4 text-base">{title}</h3>
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.name}>
          <Link href={link.href} className="text-gray-500 dark:text-gray-500 hover:text-primary-600 transition-colors text-sm block py-1">
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
));

FooterSection.displayName = 'FooterSection';

// Memoized social link
const SocialLink = memo(({ icon: Icon, href, label }: { icon: any; href: string; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="bg-gray-100 dark:bg-gray-100 hover:bg-primary-600 text-gray-600 dark:text-gray-600 hover:text-white p-2 rounded-full transition-all duration-300"
    aria-label={label}
  >
    <Icon size={16} />
  </a>
));

SocialLink.displayName = 'SocialLink';

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    address: 'Islamabad, Pakistan',
    phone: '+92 328 8582634',
    email: 'adminazizihub@gmail.com',
  });
  const supabase = createClient();

  // Throttled scroll handler for better performance
  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => {
      setShowScrollTop(window.scrollY > 500);
    });
  }, []);

  useEffect(() => {
    fetchSettings();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['address', 'contact_phone', 'contact_email']);
      if (!error && data) {
        const settings: any = {};
        data.forEach((s) => (settings[s.key] = s.value?.value));
        setContactInfo({
          address: settings.address || 'Karachi, Pakistan',
          phone: settings.contact_phone || '+92 300 1234567',
          email: settings.contact_email || 'support@azizihub.com',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [supabase]);

  const handleNewsletterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email })
        .select();
      if (error) {
        if (error.code === '23505') toast.error('Already subscribed');
        else toast.error('Subscription failed');
      } else {
        toast.success('Subscribed!');
        setNewsletterEmail('');
      }
    } catch (error) {
      toast.error('Subscription failed');
    } finally {
      setLoading(false);
    }
  }, [newsletterEmail, supabase]);

  const footerLinks = {
    shop: [
      { name: 'All Products', href: '/products' },
      { name: 'New Arrivals', href: '/products?sort=newest' },
      { name: 'Best Sellers', href: '/products?sort=popularity' },
      { name: 'Flash Deals', href: '/products?discount=true' },
    ],
    categories: [
      { name: 'Clothing', href: '/categories/clothing' },
      { name: 'Electronics', href: '/categories/electronics' },
      { name: 'Health & Beauty', href: '/categories/health-beauty' },
      { name: 'Watches', href: '/categories/watches' },
      { name: 'Shoes', href: '/categories/shoes' },
      { name: 'Kids & Girls', href: '/categories/kids-girls' },
    ],
    customerService: [
      { name: 'Contact Us', href: '/contact' },
      { name: 'About Us', href: '/about' },
      { name: 'Order Tracking', href: '/order-tracking' },
      { name: 'Returns & Refunds', href: '/returns' },
      { name: 'FAQs', href: '/faqs' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms & Conditions', href: '/terms' },
    ],
    account: [
      { name: 'My Account', href: '/account' },
      { name: 'Order History', href: '/account/orders' },
      { name: 'Wishlist', href: '/account/wishlist' },
      { name: 'Shipping Info', href: '/shipping-info' },
    ],
  };

  const socialLinks = [
    { icon: FiFacebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: FiTwitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: FiInstagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: FiYoutube, href: 'https://youtube.com', label: 'YouTube' },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-50 border-t border-gray-100 dark:border-gray-200">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent inline-block mb-3 md:mb-4">
              AziziHub
            </Link>
            <p className="text-gray-500 dark:text-gray-500 mb-3 md:mb-4 text-xs md:text-sm leading-relaxed">
              Your one‑stop destination for quality products at unbeatable prices.
            </p>
            <div className="space-y-2 text-xs md:text-sm">
              <div className="flex items-center gap-2 md:gap-3 text-gray-500 dark:text-gray-500">
                <FiMapPin className="text-primary-500 flex-shrink-0" size={16} />
                <span>{contactInfo.address}</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3 text-gray-500 dark:text-gray-500">
                <FiPhone className="text-primary-500 flex-shrink-0" size={16} />
                <a href={`tel:${contactInfo.phone}`} className="hover:text-primary-600 transition">
                  {contactInfo.phone}
                </a>
              </div>
              <div className="flex items-center gap-2 md:gap-3 text-gray-500 dark:text-gray-500">
                <FiMail className="text-primary-500 flex-shrink-0" size={16} />
                <a href={`mailto:${contactInfo.email}`} className="hover:text-primary-600 transition break-all">
                  {contactInfo.email}
                </a>
              </div>
            </div>
          </div>

          {/* Footer Columns */}
          <FooterSection title="Shop" links={footerLinks.shop} />
          <FooterSection title="Categories" links={footerLinks.categories} />
          <FooterSection title="Support" links={footerLinks.customerService} />

          {/* Newsletter Section */}
          <div>
            <h3 className="text-gray-800 dark:text-gray-800 font-semibold mb-3 md:mb-4 text-base">Newsletter</h3>
            <p className="text-gray-500 dark:text-gray-500 text-xs md:text-sm mb-3">
              Get the latest updates on new products and sales.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-100 border border-gray-200 dark:border-gray-200 text-gray-700 dark:text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1 disabled:opacity-50 text-sm"
                >
                  <FiSend size={14} /> {loading ? '...' : 'Subscribe'}
                </button>
              </div>
            </form>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <SocialLink key={social.label} icon={social.icon} href={social.href} label={social.label} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 dark:border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
            <p>&copy; {currentYear} AziziHub. All rights reserved.</p>
            <div className="flex gap-4 md:gap-5">
              <Link href="/privacy" className="hover:text-primary-600 transition">Privacy</Link>
              <Link href="/terms" className="hover:text-primary-600 transition">Terms</Link>
              <Link href="/sitemap.xml" className="hover:text-primary-600 transition">Sitemap</Link>
            </div>
            <div className="flex gap-1 text-xs">
              <span>We accept:</span>
              <span className="bg-gray-50 dark:bg-gray-100 px-2 py-0.5 rounded">COD</span>
              <span className="bg-gray-50 dark:bg-gray-100 px-2 py-0.5 rounded">Visa</span>
              <span className="bg-gray-50 dark:bg-gray-100 px-2 py-0.5 rounded">Mastercard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button - Optimized for mobile */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-primary-600 hover:bg-primary-700 text-white p-2.5 md:p-3 rounded-full shadow-md transition-all duration-200 z-40 active:scale-95"
          aria-label="Scroll to top"
        >
          <FiArrowUp size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
      )}
    </footer>
  );
}