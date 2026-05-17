'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { FiShoppingCart, FiHeart, FiMinus, FiPlus, FiTruck, FiShield, FiRefreshCw, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Static content that doesn't change
const FEATURES = [
  { icon: FiTruck, text: 'Free shipping on orders over ₨5000' },
  { icon: FiRefreshCw, text: 'Easy 7-day returns' },
  { icon: FiShield, text: '1 year warranty' },
];

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supabase = createClient();
  const { user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  const fetchProduct = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Fetch product error:', error);
    } finally {
      setLoading(false);
    }
  }, [slug, supabase]);

  const addToCart = useCallback(async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      router.push('/login');
      return;
    }
    if (!product) return;

    setAddingToCart(true);
    try {
      // Get or create cart
      let { data: cart, error: cartError } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cartError) throw cartError;

      let cartId: string;
      if (!cart) {
        const { data: newCart, error: createError } = await supabase
          .from('cart')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (createError) throw createError;
        cartId = newCart.id;
      } else {
        cartId = cart.id;
      }

      // Check if product already in cart
      const { data: existing, error: existingError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', product.id)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing) {
        const newQuantity = existing.quantity + quantity;
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: product.id,
            quantity: quantity,
            price: product.price,
          });
        if (insertError) throw insertError;
      }

      toast.success(`Added ${quantity} item(s) to cart`);
      setQuantity(1);
    } catch (err: any) {
      console.error('Add to cart error:', err);
      toast.error(err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  }, [user, product, quantity, supabase, router]);

  const handleQuantity = useCallback((type: 'inc' | 'dec') => {
    if (!product) return;
    if (type === 'inc') {
      if (quantity < (product.stock_quantity || 10)) {
        setQuantity(q => q + 1);
      } else {
        toast.error('Cannot exceed available stock');
      }
    } else {
      if (quantity > 1) setQuantity(q => q - 1);
    }
  }, [product, quantity]);

  // Memoized computed values
  const productData = useMemo(() => {
    if (!product) return null;
    const mainImage = product.attributes?.main_image || '/placeholder.jpg';
    const additionalImages = product.attributes?.additional_images || [];
    const allImages = [mainImage, ...additionalImages];
    const isOutOfStock = (product.stock_quantity || 0) <= 0;
    const discount = product.compare_price && product.compare_price > product.price
      ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
      : 0;
    return { mainImage, additionalImages, allImages, isOutOfStock, discount };
  }, [product]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-96 md:h-[500px]" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || !productData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h1>
        <p className="text-gray-500">The product you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push('/products')}
          className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const { allImages, isOutOfStock, discount } = productData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column - Images */}
        <div>
          <div className="relative h-80 sm:h-96 md:h-[500px] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden mb-4">
            <Image
              src={allImages[selectedImage] || productData.mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-4"
              priority
            />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === idx ? 'border-primary-600 shadow-md' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div>
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {product.brand && (
              <span className="text-xs md:text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 md:px-3 md:py-1 rounded-full text-gray-700 dark:text-gray-300">
                {product.brand}
              </span>
            )}
            {discount > 0 && (
              <span className="text-xs md:text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 md:px-3 md:py-1 rounded-full font-medium">
                -{discount}% OFF
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {product.name}
          </h1>
          
          {/* Rating placeholder */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => <FiStar key={i} className="fill-current w-4 h-4 md:w-5 md:h-5" />)}
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">(4.8/5 • 120 reviews)</span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-2xl md:text-3xl font-bold text-primary-600">₨{product.price.toLocaleString()}</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="ml-2 text-gray-400 line-through text-sm md:text-base">₨{product.compare_price.toLocaleString()}</span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed text-sm md:text-base">
            {product.description}
          </p>

          {/* Stock Status */}
          <div className="mb-6">
            {isOutOfStock ? (
              <span className="text-red-600 font-semibold">Out of Stock</span>
            ) : (
              <span className="text-green-600 font-semibold">
                In Stock • {product.stock_quantity} units available
              </span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          {!isOutOfStock && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center border rounded-lg w-fit">
                  <button
                    onClick={() => handleQuantity('dec')}
                    className="px-3 py-2 md:px-4 md:py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition rounded-l-lg"
                    aria-label="Decrease quantity"
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-sm md:text-base">{quantity}</span>
                  <button
                    onClick={() => handleQuantity('inc')}
                    className="px-3 py-2 md:px-4 md:py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition rounded-r-lg"
                    aria-label="Increase quantity"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={addToCart}
                  disabled={addingToCart}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 md:py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                <button 
                  className="p-2.5 md:p-3 border rounded-lg hover:border-primary-600 hover:text-primary-600 transition active:scale-95"
                  aria-label="Add to wishlist"
                >
                  <FiHeart className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="border-t pt-6 mt-6 space-y-3">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm md:text-base">
                <feature.icon className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}