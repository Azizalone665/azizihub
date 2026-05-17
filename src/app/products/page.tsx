'use client';

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import { createClient } from '@/lib/supabase/client';
import { FiGrid, FiList, FiFilter, FiX, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load ProductFilter (not needed on initial render)
const ProductFilter = lazy(() => import('@/components/ui/ProductFilter'));

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  stock_quantity: number;
  attributes: any;
  product_images: { image_url: string }[];
}

// Memoized ProductCard wrapper to prevent unnecessary re-renders
const MemoizedProductCard = ({ product }: { product: Product }) => (
  <ProductCard key={product.id} product={product} />
);

// Skeleton loader component
const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200 dark:bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  </div>
);

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [totalCount, setTotalCount] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Get filter params with useMemo to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    categorySlug: searchParams.get('category'),
    search: searchParams.get('search'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
    sort: searchParams.get('sort') || 'newest',
  }), [searchParams]);

  const { categorySlug, search, minPrice, maxPrice, sort } = filters;
  const hasActiveFilters = !!(categorySlug || search || minPrice || maxPrice);

  const formatProduct = useCallback((p: any): Product => ({
    ...p,
    product_images: p.attributes?.main_image ? [{ image_url: p.attributes.main_image }] : []
  }), []);

  // AbortController for canceling stale requests
  useEffect(() => {
    const abortController = new AbortController();
    fetchProducts(abortController.signal);
    return () => abortController.abort();
  }, [categorySlug, search, minPrice, maxPrice, sort]);

  const fetchProducts = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      let categoryId: string | null = null;
      if (categorySlug && !signal?.aborted) {
        const { data: catData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        if (catData) categoryId = catData.id;
      }

      if (signal?.aborted) return;

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      if (categoryId) query = query.eq('category_id', categoryId);
      if (search) query = query.ilike('name', `%${search}%`);
      if (minPrice) query = query.gte('price', parseFloat(minPrice));
      if (maxPrice) query = query.lte('price', parseFloat(maxPrice));

      switch (sort) {
        case 'price-asc': query = query.order('price', { ascending: true }); break;
        case 'price-desc': query = query.order('price', { ascending: false }); break;
        case 'popularity': query = query.order('created_at', { ascending: false }); break;
        default: query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;
      if (signal?.aborted) return;
      if (error) throw error;

      setProducts((data || []).map(formatProduct));
      setTotalCount(count || 0);
    } catch (error) {
      if (!signal?.aborted) {
        console.error('Error fetching products:', error);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const clearFilters = useCallback(() => {
    router.push('/products');
  }, [router]);

  const updateSort = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    router.push(`/products?${params.toString()}`);
  }, [searchParams, router]);

  // Memoize product grid to prevent re-renders when view changes
  const productGrid = useMemo(() => {
    if (loading) {
      return (
        <div className={`grid ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6' : 'grid-cols-1 gap-4'}`}>
          {[...Array(9)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="text-center py-12 md:py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <FiSearch className="w-12 h-12 md:w-16 md:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">No products found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search term.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-4 text-primary-600 hover:underline text-sm">
              Clear all filters
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={`grid ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6' : 'grid-cols-1 gap-4'}`}>
        {products.map((product) => (
          <MemoizedProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  }, [products, loading, view, hasActiveFilters, clearFilters]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header Section */}
        <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:justify-between md:items-center mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              {categorySlug ? `${categorySlug.replace(/-/g, ' ')} Products` : 'All Products'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base mt-1">{totalCount} products found</p>
          </div>

          {/* Desktop Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* View Toggle */}
            <div className="flex border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 md:p-2 transition-colors ${view === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                aria-label="Grid view"
              >
                <FiGrid size={18} className="md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 md:p-2 transition-colors ${view === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                aria-label="List view"
              >
                <FiList size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sort}
              onChange={updateSort}
              className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-sm bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popularity">Most Popular</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm text-primary-600 hover:text-primary-700 bg-primary-50 rounded-lg transition"
              >
                <FiX size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 shadow-sm w-full mb-4"
        >
          <FiFilter /> Filters & Sorting
        </button>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Sidebar Filter - Desktop only */}
          <div className="hidden lg:block lg:w-1/4">
            <Suspense fallback={<div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />}>
              <ProductFilter />
            </Suspense>
          </div>

          {/* Mobile Filter Drawer */}
          <AnimatePresence>
            {mobileFilterOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 lg:hidden"
              >
                <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'tween', duration: 0.3 }}
                  className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl p-4 overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button onClick={() => setMobileFilterOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                      <FiX size={20} />
                    </button>
                  </div>
                  <Suspense fallback={<div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />}>
                    <ProductFilter />
                  </Suspense>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products Grid / List */}
          <div className="flex-1">
            {productGrid}
          </div>
        </div>
      </div>
    </div>
  );
}