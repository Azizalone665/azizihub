'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProductCard from '@/components/ui/ProductCard';
import { FiPackage, FiFolder } from 'react-icons/fi';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  image_url: string | null;
}

// Match ProductCard's expected type
interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  stock_quantity: number;
  attributes: any;
  product_images: { image_url: string }[]; // required, not optional
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndProducts();
    }
  }, [slug]);

  const fetchCategoryAndProducts = async () => {
    setLoading(true);
    try {
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (catError || !catData) {
        console.error('Category error:', catError);
        setLoading(false);
        return;
      }

      setCategory(catData);

      const { data: productData, error: prodError } = await supabase
        .from('products')
        .select('*, attributes')
        .eq('category_id', catData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (prodError) {
        console.error('Products error:', prodError);
        setProducts([]);
      } else {
        const formattedProducts: Product[] = (productData || []).map((p: any) => ({
          ...p,
          product_images: p.attributes?.main_image
            ? [{ image_url: p.attributes.main_image }]
            : [] // always array
        }));
        setProducts(formattedProducts);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiFolder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Category Not Found</h1>
        <p className="text-gray-500">The category you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="relative bg-gradient-to-r from-primary-600 to-secondary-600 py-12 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">{category.icon || '📁'}</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{category.name}</h1>
          {category.description && (
            <p className="text-white/90 text-lg max-w-2xl mx-auto">{category.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            All {category.name}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{products.length} products</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <FiPackage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No products in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}