'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProductCard from '@/components/ui/ProductCard';
import { FiPackage, FiArrowLeft } from 'react-icons/fi';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
}

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

export default function CategoryProductsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supabase = createClient();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndProducts();
    }
  }, [slug]);

  const fetchCategoryAndProducts = async () => {
    setLoading(true);
    try {
      // Get category info
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id, name, slug, description, icon')
        .eq('slug', slug)
        .single();

      if (catError || !catData) {
        // Category not found → redirect to products page
        router.push('/products');
        return;
      }

      setCategory(catData);

      // Get products in this category
      const { data: productData, error: prodError } = await supabase
        .from('products')
        .select('*, attributes')
        .eq('category_id', catData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (prodError) throw prodError;

      const formattedProducts = (productData || []).map((p: any) => ({
        ...p,
        product_images: p.attributes?.main_image ? [{ image_url: p.attributes.main_image }] : []
      }));
      setProducts(formattedProducts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) return null; // Will redirect anyway

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/products')}
          className="flex items-center gap-1 text-gray-500 hover:text-primary-600 mb-4 transition"
        >
          <FiArrowLeft size={18} /> All Products
        </button>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-gray-600 dark:text-gray-400">{category.description}</p>
        )}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <FiPackage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No products in this category yet.</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 text-primary-600 hover:underline"
          >
            Browse all products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}