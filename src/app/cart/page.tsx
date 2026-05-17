'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiTruck, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    attributes: any;
  };
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (user) fetchCart();
    else setLoading(false);
  }, [user]);

  const fetchCart = useCallback(async () => {
    try {
      const { data: cart, error } = await supabase
        .from('cart')
        .select(`
          id,
          cart_items (
            id,
            quantity,
            price,
            products (
              id,
              name,
              slug,
              price,
              attributes
            )
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (cart?.cart_items && Array.isArray(cart.cart_items)) {
        const formatted = cart.cart_items.map((item: any) => {
          const productData = Array.isArray(item.products) ? item.products[0] : item.products;
          return {
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            products: productData || {
              id: '',
              name: 'Product not found',
              slug: '',
              price: 0,
              attributes: {},
            },
          };
        });
        setCartItems(formatted);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error('Fetch cart error:', err);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const updateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItemId(itemId);
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);
      if (error) throw error;
      await fetchCart();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingItemId(null);
    }
  }, [supabase, fetchCart]);

  const removeItem = useCallback(async (itemId: string) => {
    setUpdatingItemId(itemId);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
      toast.success('Item removed');
      await fetchCart();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingItemId(null);
    }
  }, [supabase, fetchCart]);

  // Memoize cart calculations
  const { subtotal, shipping, total, freeShippingRemaining } = useMemo(() => {
    const sub = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const ship = sub > 5000 ? 0 : 200;
    const remaining = sub > 5000 ? 0 : 5000 - sub;
    return {
      subtotal: sub,
      shipping: ship,
      total: sub + ship,
      freeShippingRemaining: remaining,
    };
  }, [cartItems]);

  // Memoize cart items list to prevent re-renders when only totals change
  const cartItemsList = useMemo(() => 
    cartItems.map((item, idx) => (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: idx * 0.05, duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-3 md:p-4 flex gap-3 md:gap-4 hover:shadow-lg transition-all"
      >
        <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src={item.products?.attributes?.main_image || '/placeholder.jpg'}
            alt={item.products?.name || 'Product'}
            fill
            sizes="96px"
            className="object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex-1">
          <Link 
            href={`/product/${item.products?.slug}`} 
            className="font-semibold text-gray-800 dark:text-white hover:text-primary-600 transition-colors text-sm md:text-base line-clamp-2"
          >
            {item.products?.name || 'Unknown Product'}
          </Link>
          <p className="text-primary-600 font-bold mt-1 text-sm md:text-base">₨{item.price.toLocaleString()}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={updatingItemId === item.id}
                className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
                aria-label="Decrease quantity"
              >
                <FiMinus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={updatingItemId === item.id}
                className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
                aria-label="Increase quantity"
              >
                <FiPlus size={14} />
              </button>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              disabled={updatingItemId === item.id}
              className="text-red-500 hover:text-red-600 transition disabled:opacity-50"
              aria-label="Remove item"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-800 dark:text-white text-sm md:text-base">
            ₨{(item.price * item.quantity).toLocaleString()}
          </p>
        </div>
      </motion.div>
    )), 
    [cartItems, updatingItemId, updateQuantity, removeItem]
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold mb-4">Please login to view cart</h1>
          <Link href="/login" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition inline-block">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading cart...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="text-center">
          <FiShoppingBag className="w-16 h-16 md:w-20 md:h-20 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl md:text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-500 mb-6 text-sm md:text-base">Looks like you haven't added anything yet.</p>
          <Link href="/products" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg inline-block transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white mb-6 md:mb-8"
        >
          Shopping Cart <span className="text-sm md:text-base font-normal text-gray-500">({cartItems.length} items)</span>
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            <AnimatePresence mode="wait">
              {cartItemsList}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 md:p-6 sticky top-24"
            >
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm md:text-base">
                  <span>Subtotal</span>
                  <span className="font-medium">₨{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm md:text-base">
                  <div className="flex items-center gap-1">
                    <FiTruck className="w-4 h-4" />
                    <span>Shipping</span>
                  </div>
                  <span>{shipping === 0 ? 'Free' : `₨${shipping.toLocaleString()}`}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg md:text-xl text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₨{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {shipping > 0 && freeShippingRemaining > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-4">
                  <p className="text-xs md:text-sm text-amber-600 dark:text-amber-400 text-center">
                    Add ₨{freeShippingRemaining.toLocaleString()} more to get free shipping
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((subtotal / 5000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                Proceed to Checkout
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <FiShield className="w-3 h-3" />
                <span>Secure checkout</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}