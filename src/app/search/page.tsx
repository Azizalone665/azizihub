'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ProductCard from '@/components/ui/ProductCard';
import { FiSearch } from 'react-icons/fi';

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

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, attributes')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .limit(20);
      if (!error && data) {
        const formatted: Product[] = data.map((p: any) => ({
          ...p,
          product_images: p.attributes?.main_image ? [{ image_url: p.attributes.main_image }] : []
        }));
        setProducts(formatted);
      } else {
        setProducts([]);
      }
      setLoading(false);
    };
    fetchResults();
  }, [query]);

  if (loading) {
    return <div className="text-center py-20">Searching...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Search results for "{query}"</h1>
      <p className="text-gray-500 mb-8">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products match your search. Try different keywords.</p>
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}