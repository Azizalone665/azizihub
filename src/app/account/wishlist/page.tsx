'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FiHeart, FiTrash2, FiShoppingCart, FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_price: number | null;
    attributes: any;
    stock_quantity: number;
  };
}

const ITEMS_PER_PAGE = 8;

// Memoized wishlist item component
const WishlistItemCard = ({ item, onAddToCart, onRemove }: { 
  item: WishlistItem; 
  onAddToCart: (product: any) => void; 
  onRemove: (productId: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2 }}
    className="py-4 flex flex-col sm:flex-row gap-4 items-center border-b border-gray-100 dark:border-gray-700 last:border-0"
  >
    <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
      <Image
        src={item.products.attributes?.main_image || '/placeholder.jpg'}
        alt={item.products.name}
        fill
        sizes="96px"
        className="object-cover"
        loading="lazy"
      />
    </div>
    <div className="flex-1 text-center sm:text-left">
      <Link 
        href={`/product/${item.products.slug}`} 
        className="font-semibold text-gray-800 dark:text-white hover:text-primary-600 transition-colors text-sm md:text-base"
      >
        {item.products.name}
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
        <p className="text-primary-600 font-bold text-base md:text-lg">₨{item.products.price.toLocaleString()}</p>
        {item.products.compare_price && (
          <p className="text-xs md:text-sm text-gray-400 line-through">₨{item.products.compare_price.toLocaleString()}</p>
        )}
      </div>
      {item.products.stock_quantity <= 5 && item.products.stock_quantity > 0 && (
        <p className="text-xs text-amber-600 mt-1">Only {item.products.stock_quantity} left in stock</p>
      )}
      {item.products.stock_quantity === 0 && (
        <p className="text-xs text-red-500 mt-1">Out of stock</p>
      )}
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => onAddToCart(item.products)}
        disabled={item.products.stock_quantity === 0}
        className="p-2.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 hover:bg-primary-200 dark:hover:bg-primary-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Add to cart"
      >
        <FiShoppingCart size={18} />
      </button>
      <button
        onClick={() => onRemove(item.product_id)}
        className="p-2.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-800 transition"
        aria-label="Remove from wishlist"
      >
        <FiTrash2 size={18} />
      </button>
    </div>
  </motion.div>
);

export default function WishlistPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm]);

  const fetchWishlist = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          products (*)
        `)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      if (data) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          products: Array.isArray(item.products) ? item.products[0] : item.products,
        }));
        setItems(formatted);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const filterItems = useCallback(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = items.filter(item => 
        item.products.name.toLowerCase().includes(term)
      );
      setFilteredItems(filtered);
    }
    setCurrentPage(1);
  }, [items, searchTerm]);

  const removeItem = useCallback(async (productId: string) => {
    setUpdatingItemId(productId);
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .match({ user_id: user?.id, product_id: productId });
      
      if (error) throw error;
      
      toast.success('Item removed from wishlist');
      await fetchWishlist();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove item');
    } finally {
      setUpdatingItemId(null);
    }
  }, [user, supabase, fetchWishlist]);

  const addToCart = useCallback(async (product: any) => {
    if (product.stock_quantity === 0) {
      toast.error('This product is out of stock');
      return;
    }
    
    try {
      // Get or create cart
      let { data: cart, error: cartError } = await supabase
        .from('cart')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (cartError && cartError.code !== 'PGRST116') throw cartError;

      let cartId: string;
      if (!cart) {
        const { data: newCart, error: createError } = await supabase
          .from('cart')
          .insert({ user_id: user?.id })
          .select()
          .single();
        if (createError) throw createError;
        cartId = newCart.id;
      } else {
        cartId = cart.id;
      }

      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: product.id,
          quantity: 1,
          price: product.price,
        });
      
      if (insertError) throw insertError;
      
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to cart');
    }
  }, [user, supabase]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiHeart className="text-primary-500" /> My Wishlist
          <span className="text-sm font-normal text-gray-500">({items.length} items)</span>
        </h1>
        
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search wishlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 md:py-16">
          <FiHeart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">Your wishlist is empty.</p>
          <Link href="/products" className="inline-block mt-4 text-primary-600 hover:text-primary-700 text-sm md:text-base">
            Explore Products →
          </Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No items match your search.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-3 text-primary-600 hover:underline text-sm"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <AnimatePresence mode="wait">
              {paginatedItems.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={addToCart}
                  onRemove={removeItem}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
              >
                <FiChevronLeft size={18} />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                      currentPage === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next page"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}