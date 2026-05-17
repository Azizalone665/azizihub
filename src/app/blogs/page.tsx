'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { FiCalendar, FiEye, FiArrowRight } from 'react-icons/fi';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  views: number;
  created_at: string;
  category: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    const { data, error } = await supabase
      .from('blogs')
      .select('id, title, slug, excerpt, featured_image, views, created_at, category')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setBlogs(data || []);
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2 animate-pulse"></div>
          <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-3">
            Our Blog
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Insights, trends, and tips from our experts</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {blogs.map((blog) => (
            <motion.div key={blog.id} variants={cardVariants} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Link href={`/blog/${blog.slug}`} className="group block bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-52 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {blog.featured_image ? (
                    <Image
                      src={blog.featured_image}
                      alt={blog.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No image</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1"><FiCalendar size={14} /> {new Date(blog.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><FiEye size={14} /> {blog.views}</span>
                    {blog.category && (
                      <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full text-xs font-medium">
                        {blog.category}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {blog.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3 text-sm leading-relaxed">
                    {blog.excerpt || blog.title}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-4 text-primary-600 dark:text-primary-400 font-medium text-sm group-hover:gap-2 transition-all">
                    Read more <FiArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {blogs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">No blog posts available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}