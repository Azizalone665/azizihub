'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { FiMail, FiUser, FiMessageSquare, FiSend, FiCheckCircle, FiMapPin, FiPhone, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

// Static contact info - prevents re-renders
const CONTACT_INFO = [
  { icon: FiMail, title: 'Email Us', details: ['support@azizihub.com', 'info@azizihub.com'], link: 'mailto:support@azizihub.com' },
  { icon: FiMessageSquare, title: 'Live Chat', details: ['Mon-Fri, 9am – 6pm'], action: 'Start a chat →', actionLink: 'https://wa.me/923288582634?text=Hello%20AziziHub%2C%20I%20need%20assistance.' },
  { icon: FiMapPin, title: 'Visit Us', details: ['Karachi, Pakistan'], phone: '+92 328 8582634' },
];

// Memoized contact card component
const ContactCard = ({ info, index }: { info: typeof CONTACT_INFO[0]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.4 }}
    whileHover={{ y: -5 }}
    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center border border-gray-100 dark:border-gray-700"
  >
    <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
      <info.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{info.title}</h3>
    {info.details.map((detail, i) => (
      <p key={i} className="text-gray-500 dark:text-gray-400 text-sm">{detail}</p>
    ))}
    {info.action && (
      <a
        href={info.actionLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center justify-center gap-1 text-sm"
      >
        {info.action} →
      </a>
    )}
    {info.phone && (
      <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-2">
        <FiPhone className="w-3 h-3" /> {info.phone}
      </div>
    )}
  </motion.div>
);

export default function ContactPage() {
  const supabase = createClient();
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from('messages').insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });
      
      if (error) throw error;
      
      toast.success('Message sent! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }, [formData, supabase, validateForm]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const inputFields = useMemo(() => [
    { name: 'name', label: 'Your Name', type: 'text', placeholder: 'John Doe', icon: FiUser, required: true },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com', icon: FiMail, required: true },
    { name: 'subject', label: 'Subject', type: 'text', placeholder: 'How can we help?', icon: FiMessageSquare, required: true },
  ], []);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <FiCheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Thank You!</h2>
            <p className="text-gray-600 dark:text-gray-300">We've received your message and will respond within 24 hours.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Send Another Message
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-3 md:mb-4">
            Get in Touch
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
            We'd love to hear from you! Fill out the form or reach us directly.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Contact Info Cards - Left Column */}
          <div className="lg:col-span-1 space-y-5 md:space-y-6">
            {CONTACT_INFO.map((info, idx) => (
              <ContactCard key={info.title} info={info} index={idx} />
            ))}
          </div>

          {/* Contact Form - Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-5 md:mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                {/* Name & Email Row */}
                <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                  {inputFields.slice(0, 2).map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name as keyof ContactForm]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition dark:bg-gray-900 dark:text-white ${
                            errors[field.name as keyof FormErrors]
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          required={field.required}
                        />
                      </div>
                      {errors[field.name as keyof FormErrors] && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <FiAlertCircle size={12} /> {errors[field.name as keyof FormErrors]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiMessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition dark:bg-gray-900 dark:text-white ${
                        errors.subject
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      required
                    />
                  </div>
                  {errors.subject && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle size={12} /> {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition dark:bg-gray-900 dark:text-white ${
                      errors.message
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle size={12} /> {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white font-semibold py-3 rounded-xl transition transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend size={18} /> Send Message
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                  We'll respond to your inquiry within 24 hours.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}