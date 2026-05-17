'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image_url: string | null;
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (!error && data) setCategories(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
      {categories.map((category, idx) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.4 }}
          whileHover={{ y: -6 }}
          className="group"
        >
          <Link
            href={`/categories/${category.slug}`}
            className="block bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary-100/20 dark:hover:shadow-primary-900/20 border border-gray-100 dark:border-gray-700"
          >
            <div className="relative h-32 w-full bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 overflow-hidden">
              {category.image_url ? (
                <>
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-5xl transition-transform duration-300 group-hover:scale-110">
                  {category.icon || '📦'}
                </div>
              )}
            </div>
            <div className="p-3 text-center">
              <h3 className="font-semibold text-gray-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                {category.name}
              </h3>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}