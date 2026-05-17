'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { FiEdit, FiTrash2, FiPlus, FiZap, FiSearch, FiFilter, FiPackage, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  price: number;
  compare_price: number | null;
  stock_quantity: number;
  is_flash_deal: boolean;
  categories?: { name: string }[];
  created_at: string;
  attributes: any;
}

const ITEMS_PER_PAGE = 10;

// Memoized Product Row Component
const ProductRow = ({ product, onToggleFlash, onDelete }: { 
  product: Product; 
  onToggleFlash: (id: string, current: boolean) => void; 
  onDelete: (id: string) => void;
}) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
    <td className="px-4 py-3">
      {product.attributes?.main_image ? (
        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
          <Image src={product.attributes.main_image} alt={product.name} fill className="object-cover" />
        </div>
      ) : (
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">No img</div>
      )}
    </td>
    <td className="px-4 py-3">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
        <p className="text-xs text-gray-500">Brand: {product.brand || '—'} | SKU: {product.sku || '—'}</p>
      </div>
    </td>
    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{product.categories?.[0]?.name || '-'}</td>
    <td className="px-4 py-3">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">₨{product.price.toLocaleString()}</p>
        {product.compare_price && product.compare_price > product.price && (
          <p className="text-xs text-gray-400 line-through">₨{product.compare_price.toLocaleString()}</p>
        )}
      </div>
    </td>
    <td className="px-4 py-3">
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
        product.stock_quantity > 0 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}>
        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
      </span>
    </td>
    <td className="px-4 py-3 text-center">
      <button
        onClick={() => onToggleFlash(product.id, product.is_flash_deal || false)}
        className={`px-2 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 mx-auto ${
          product.is_flash_deal
            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
        }`}
      >
        <FiZap size={12} />
        {product.is_flash_deal ? 'Active' : 'Mark'}
      </button>
    </td>
    <td className="px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-2">
        <Link href={`/admin/products/edit/${product.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <FiEdit className="w-4 h-4 text-blue-600" />
        </Link>
        <button onClick={() => onDelete(product.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <FiTrash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </td>
  </tr>
);

export default function ProductsList() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterProducts();
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, products]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, sku, price, compare_price, stock_quantity, is_flash_deal, created_at, categories(name), attributes')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true);
      if (!error) setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [supabase]);

  const filterProducts = useCallback(() => {
    let filtered = [...products];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
    }
    if (categoryFilter) {
      filtered = filtered.filter(p => p.categories?.some(cat => cat.name === categoryFilter));
    }
    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  const toggleFlashDeal = useCallback(async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_flash_deal: !currentValue })
        .eq('id', id);
      if (error) throw error;
      toast.success(currentValue ? 'Removed from Flash Deals' : 'Added to Flash Deals');
      await fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [supabase, fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!confirm('⚠️ DANGER: This product may have been ordered. Deleting it will also remove ALL order records for this product. This action is irreversible. Are you absolutely sure?')) return;
    
    setDeletingId(id);
    try {
      // Delete in parallel for better performance
      await Promise.all([
        supabase.from('order_items').delete().eq('product_id', id),
        supabase.from('cart_items').delete().eq('product_id', id),
        supabase.from('wishlist').delete().eq('product_id', id),
        supabase.from('reviews').delete().eq('product_id', id),
      ]);
      
      const { error: productError } = await supabase.from('products').delete().eq('id', id);
      if (productError) throw productError;
      
      toast.success('Product deleted successfully');
      await fetchProducts();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  }, [supabase, fetchProducts]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setCategoryFilter('');
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">Products</h1>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />)}</div>
        </div>
      </div>
    );
  }

  const hasActiveFilters = searchTerm || categoryFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
          Products
          <span className="text-sm font-normal text-gray-500 ml-2">({filteredProducts.length} total)</span>
        </h1>
        <Link href="/admin/products/create" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition">
          <FiPlus /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 bg-primary-50 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No products found.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-primary-600 hover:underline text-sm">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name / Brand / SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Flash</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence mode="wait">
                    {paginatedProducts.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        onToggleFlash={toggleFlashDeal}
                        onDelete={deleteProduct}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            )}
            
            {/* Results count */}
            <div className="text-center text-xs text-gray-500 py-3 border-t dark:border-gray-700">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
            </div>
          </>
        )}
      </div>
    </div>
  );
}