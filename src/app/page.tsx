'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import HeroSlider from '@/components/ui/HeroSlider';
import CategoryGrid from '@/components/ui/CategoryGrid';
import ProductCard from '@/components/ui/ProductCard';
import WelcomeBanner from '@/components/ui/WelcomeBanner';
import { createClient } from '@/lib/supabase/client';
import { FiTrendingUp, FiStar, FiTruck } from 'react-icons/fi';

// Lazy load non-critical components
const FlashDeals = lazy(() => import('@/components/ui/FlashDeals'));
const Newsletter = lazy(() => import('@/components/ui/Newsletter'));

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

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch both in parallel for better performance
      const [featuredResult, trendingResult] = await Promise.all([
        supabase
          .from('products')
          .select('*, attributes')
          .eq('is_featured', true)
          .eq('is_active', true)
          .limit(8),
        supabase
          .from('products')
          .select('*, attributes')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      const mapProduct = (p: any): Product => ({
        ...p,
        product_images: p.attributes?.main_image 
          ? [{ image_url: p.attributes.main_image }] 
          : []
      });

      setFeaturedProducts((featuredResult.data || []).map(mapProduct));
      setTrendingProducts((trendingResult.data || []).map(mapProduct));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = { 
    initial: { opacity: 0, y: 20 }, 
    whileInView: { opacity: 1, y: 0 }, 
    transition: { duration: 0.5 }, 
    viewport: { once: true, margin: '-100px' } 
  };

  // Loading skeleton for products
  const ProductSkeleton = () => (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-64 animate-pulse" />
  );

  return (
    <div className="min-h-screen">
      <WelcomeBanner />
      <HeroSlider />

      {/* Feature badges - optimized for mobile */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center md:grid md:grid-cols-3 gap-4 md:gap-6 text-center">
            <div className="flex flex-col items-center gap-1 md:gap-2 w-1/2 md:w-auto">
              <FiTruck className="w-6 h-6 md:w-8 md:h-8" />
              <p className="font-semibold text-sm md:text-base">Free Shipping</p>
              <p className="text-xs md:text-sm opacity-90">On orders over ₨5,000</p>
            </div>
            <div className="flex flex-col items-center gap-1 md:gap-2 w-1/2 md:w-auto">
              <FiStar className="w-6 h-6 md:w-8 md:h-8" />
              <p className="font-semibold text-sm md:text-base">100% Authentic</p>
              <p className="text-xs md:text-sm opacity-90">Guaranteed quality</p>
            </div>
            <div className="flex flex-col items-center gap-1 md:gap-2 w-1/2 md:w-auto mx-auto md:mx-0">
              <FiTrendingUp className="w-6 h-6 md:w-8 md:h-8" />
              <p className="font-semibold text-sm md:text-base">30-Day Returns</p>
              <p className="text-xs md:text-sm opacity-90">Hassle-free refunds</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Shop by Category
            </h2>
            <p className="text-sm md:text-base text-gray-500">Find exactly what you're looking for</p>
          </motion.div>
          <CategoryGrid />
        </div>
      </section>

      {/* Flash Deals - Lazy loaded */}
      <Suspense fallback={<div className="py-12 text-center">Loading deals...</div>}>
        <FlashDeals />
      </Suspense>

      {/* Trending Products */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Trending Now
            </h2>
            <p className="text-sm md:text-base text-gray-500">Most popular this week</p>
          </motion.div>
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : trendingProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter - Lazy loaded */}
      <Suspense fallback={null}>
        <Newsletter />
      </Suspense>
    </div>
  );
}