'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiMinus, FiPlus, FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import ProductCard from '@/components/ui/ProductCard'

// Define types
interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  description: string
  stock_quantity: number
  category_id: string
  product_images: { id: string; image_url: string; is_primary: boolean }[]
  categories: { name: string; slug: string }
  reviews: any[]
}

interface RelatedProduct {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  stock_quantity: number
  product_images: { image_url: string }[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          product_images (*),
          categories (*),
          reviews (*)
        `)
        .eq('slug', params.id)
        .single()

      setProduct(data as Product)

      // Fetch related products from same category
      if (data?.category_id) {
        const { data: related } = await supabase
          .from('products')
          .select(`
            *,
            product_images (image_url)
          `)
          .eq('category_id', data.category_id)
          .neq('id', data.id)
          .limit(4)
        setRelatedProducts((related as RelatedProduct[]) || [])
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }

    if (!product) return

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

      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: product.id,
          quantity: quantity,
          price: product.price,
        })

      if (error) throw error
      toast.success(`Added ${quantity} item(s) to cart!`)
    } catch (error) {
      console.error('Add to cart error:', error)
      toast.error('Failed to add to cart')
    }
  }

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist')
      return
    }

    if (!product) return

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          product_id: product.id,
        })

      if (error) throw error
      toast.success('Added to wishlist!')
    } catch (error) {
      toast.error('Failed to add to wishlist')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
            <Image
              src={product.product_images[selectedImage]?.image_url || '/placeholder.jpg'}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.product_images.map((image, index) => (
              <button
                key={image.id || index}
                onClick={() => setSelectedImage(index)}
                className={`relative h-24 rounded-lg overflow-hidden border-2 ${
                  selectedImage === index ? 'border-primary-600' : 'border-transparent'
                }`}
              >
                <Image src={image.image_url} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className="fill-current" />
              ))}
            </div>
            <span className="ml-2 text-gray-600">({product.reviews?.length || 0} reviews)</span>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-bold text-primary-600">₨{product.price.toLocaleString()}</span>
            {product.compare_price && (
              <span className="ml-2 text-xl text-gray-400 line-through">₨{product.compare_price.toLocaleString()}</span>
            )}
          </div>

          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Availability:</span>
              {product.stock_quantity > 0 ? (
                <span className="text-green-600 font-semibold">In Stock ({product.stock_quantity} units)</span>
              ) : (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <span className="text-gray-700 block mb-2">Quantity:</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 border rounded-lg hover:bg-gray-100"
              >
                <FiMinus />
              </button>
              <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                className="p-2 border rounded-lg hover:bg-gray-100"
              >
                <FiPlus />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FiShoppingCart />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={handleAddToWishlist}
              className="p-3 border border-gray-300 rounded-lg hover:border-primary-600 hover:text-primary-600 transition-colors"
            >
              <FiHeart size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}