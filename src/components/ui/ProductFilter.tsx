'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Memoized category item to prevent re-renders
const CategoryItem = memo(({ 
  category, 
  isSelected, 
  onChange 
}: { 
  category: Category; 
  isSelected: boolean; 
  onChange: (slug: string) => void;
}) => (
  <label className="flex items-center cursor-pointer py-1">
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onChange(category.slug)}
      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
    />
    <span className="ml-2 text-gray-600 dark:text-gray-300 text-sm">{category.name}</span>
  </label>
));

CategoryItem.displayName = 'CategoryItem';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProductFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Debounce price inputs to reduce URL updates
  const debouncedMinPrice = useDebounce(priceRange.min, 600);
  const debouncedMaxPrice = useDebounce(priceRange.max, 600);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Apply price filters when debounced values change
  useEffect(() => {
    if (!isUpdating) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedMinPrice) {
        params.set('minPrice', debouncedMinPrice);
      } else {
        params.delete('minPrice');
      }
      if (debouncedMaxPrice) {
        params.set('maxPrice', debouncedMaxPrice);
      } else {
        params.delete('maxPrice');
      }
      params.set('page', '1');
      router.push(`/products?${params.toString()}`, { scroll: false });
    }
  }, [debouncedMinPrice, debouncedMaxPrice]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [supabase]);

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const applyFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const clearFilters = useCallback(() => {
    setPriceRange({ min: '', max: '' });
    setSelectedCategory('');
    router.push('/products');
  }, [router]);

  const handleCategoryChange = useCallback((slug: string) => {
    const newCategory = selectedCategory === slug ? '' : slug;
    setSelectedCategory(newCategory);
    applyFilter('category', newCategory);
  }, [selectedCategory, applyFilter]);

  const handlePriceChange = useCallback((type: 'min' | 'max', value: string) => {
    setIsUpdating(true);
    setPriceRange((prev) => ({ ...prev, [type]: value }));
    setTimeout(() => setIsUpdating(false), 100);
  }, []);

  const hasActiveFilters = useMemo(() => 
    !!(selectedCategory || priceRange.min || priceRange.max), 
    [selectedCategory, priceRange.min, priceRange.max]
  );

  // Memoize categories list to prevent re-renders
  const categoriesList = useMemo(() => 
    categories.map((category) => (
      <CategoryItem
        key={category.id}
        category={category}
        isSelected={selectedCategory === category.slug}
        onChange={handleCategoryChange}
      />
    )), 
    [categories, selectedCategory, handleCategoryChange]
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-4 sticky top-20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs md:text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Categories Section */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <button
          onClick={() => toggleSection('categories')}
          className="flex justify-between items-center w-full text-left group"
          aria-expanded={expandedSections.categories}
        >
          <span className="font-medium text-gray-700 dark:text-gray-300 text-sm md:text-base">Categories</span>
          {expandedSections.categories ? 
            <FiChevronUp className="text-gray-500 group-hover:text-primary-600 transition" size={18} /> : 
            <FiChevronDown className="text-gray-500 group-hover:text-primary-600 transition" size={18} />
          }
        </button>
        {expandedSections.categories && (
          <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
            {categoriesList}
            {categories.length === 0 && (
              <p className="text-gray-500 text-sm py-2">Loading categories...</p>
            )}
          </div>
        )}
      </div>

      {/* Price Range Section */}
      <div className="pb-4 mb-4">
        <button
          onClick={() => toggleSection('price')}
          className="flex justify-between items-center w-full text-left group"
          aria-expanded={expandedSections.price}
        >
          <span className="font-medium text-gray-700 dark:text-gray-300 text-sm md:text-base">Price Range</span>
          {expandedSections.price ? 
            <FiChevronUp className="text-gray-500 group-hover:text-primary-600 transition" size={18} /> : 
            <FiChevronDown className="text-gray-500 group-hover:text-primary-600 transition" size={18} />
          }
        </button>
        {expandedSections.price && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Min (₨)</label>
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Max (₨)</label>
              <input
                type="number"
                value={priceRange.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                placeholder="Any"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                min="0"
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
}