'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiHeart, FiShoppingCart } from 'react-icons/fi'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compare_price: number | null
    product_images: { image_url: string }[]
    stock_quantity: number
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }

    setIsAddingToCart(true)
    try {
      // Get or create cart
      let cartId: string | null = null
      
      // First try to get existing cart
      const { data: existingCart } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingCart) {
        cartId = existingCart.id
      } else {
        // Create new cart
        const { data: newCart, error: createError } = await supabase
          .from('cart')
          .insert({ user_id: user.id })
          .select()
          .single()

        if (createError) throw createError
        cartId = newCart.id
      }

      if (!cartId) {
        throw new Error('Failed to get or create cart')
      }

      // Add item to cart
      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: product.id,
          quantity: 1,
          price: product.price,
        })

      if (error) throw error
      toast.success('Added to cart!')
    } catch (error) {
      console.error('Add to cart error:', error)
      toast.error('Failed to add to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white rounded-lg shadow-md overflow-hidden group"
    >
      <Link href={`/product/${product.slug}`}>
        <div className="relative">
          <div className="relative h-64 w-full overflow-hidden bg-gray-200">
            <Image
              src={product.product_images?.[0]?.image_url || '/placeholder.jpg'}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
              -{discount}%
            </div>
          )}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold">Out of Stock</span>
            </div>
          )}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || product.stock_quantity === 0}
            className={`absolute bottom-2 right-2 bg-primary-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              (isAddingToCart || product.stock_quantity === 0) && 'opacity-50 cursor-not-allowed'
            }`}
          >
            <FiShoppingCart size={20} />
          </button>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary-600">₨{product.price.toLocaleString()}</span>
            {product.compare_price && (
              <span className="text-sm text-gray-400 line-through">₨{product.compare_price.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}