'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiMail, FiSend } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)
    // Here you would typically save to a newsletter_subscribers table
    // For now, we'll just simulate success
    setTimeout(() => {
      toast.success('Subscribed successfully!')
      setEmail('')
      setLoading(false)
    }, 1000)
  }

  return (
    <section className="py-16 bg-primary-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center text-white"
        >
          <FiMail className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Subscribe to Our Newsletter</h2>
          <p className="text-primary-100 mb-8 max-w-md mx-auto">
            Get the latest updates on new products and upcoming sales
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Subscribing...' : (
                <>
                  Subscribe <FiSend />
                </>
              )}
            </button>
          </form>

          <p className="text-primary-100 text-sm mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </motion.div>
      </div>
    </section>
  )
}