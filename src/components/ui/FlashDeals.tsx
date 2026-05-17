'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import CountdownTimer from './CountdownTimer'
import { createClient } from '@/lib/supabase/client'

export default function FlashDeals() {
  const [flashProducts, setFlashProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchFlashDeals()
  }, [])

  const fetchFlashDeals = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_flash_deal', true)
      .eq('is_active', true)
      .limit(6)

    if (error) {
      console.error('Flash deals error:', error)
      setFlashProducts([])
      setLoading(false)
      return
    }

    // Format products to work with ProductCard (image from attributes)
    const formatted = (data || []).map((product) => ({
      ...product,
      product_images: product.attributes?.main_image
        ? [{ image_url: product.attributes.main_image }]
        : [],
    }))

    setFlashProducts(formatted)
    setLoading(false)
  }

  const targetDate = new Date()
  targetDate.setHours(targetDate.getHours() + 24)

  return (
    <section className="py-12 bg-gradient-to-r from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Flash Deals</h2>
            <p className="text-gray-600 mt-1">Limited time offers - hurry up!</p>
          </div>
          <CountdownTimer targetDate={targetDate} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : flashProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No flash deals available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {flashProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}