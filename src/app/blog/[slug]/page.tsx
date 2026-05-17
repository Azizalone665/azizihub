'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { FiCalendar, FiEye, FiTag, FiArrowLeft, FiShare2, FiTwitter, FiFacebook, FiMessageCircle, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  category: string;
  tags: string[];
  views: number;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

// Share buttons component
const ShareButtons = ({ title, url }: { title: string; url: string }) => {
  const shareLinks = [
    { name: 'Twitter', icon: FiTwitter, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, color: 'hover:bg-[#1DA1F2]' },
    { name: 'Facebook', icon: FiFacebook, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, color: 'hover:bg-[#4267B2]' },
    { name: 'WhatsApp', icon: FiMessageCircle, url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, color: 'hover:bg-[#25D366]' },
  ];

  return (
    <div className="flex gap-2">
      {shareLinks.map((social) => (
        <button
          key={social.name}
          onClick={() => window.open(social.url, '_blank', 'noopener,noreferrer')}
          className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-white transition-colors ${social.color}`}
          aria-label={`Share on ${social.name}`}
        >
          <social.icon size={18} />
        </button>
      ))}
    </div>
  );
};

// Reading time calculator
const getReadingTime = (content: string) => {
  const wordsPerMinute = 200;
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
};

export default function BlogDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewIncremented, setViewIncremented] = useState(false);

  useEffect(() => {
    if (slug) fetchBlog();
  }, [slug]);

  const fetchBlog = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Blog not found');
      
      setBlog(data);
      
      // Increment view count only once
      if (!viewIncremented && data) {
        await supabase
          .from('blogs')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', data.id);
        setViewIncremented(true);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      setBlog(null);
    } finally {
      setLoading(false);
    }
  }, [slug, supabase, viewIncremented]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-64 md:h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10/12" />
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Blog Post Not Found</h1>
        <p className="text-gray-500 mb-6">The article you're looking for doesn't exist or has been moved.</p>
        <Link href="/blogs" className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
          Back to Blogs
        </Link>
      </div>
    );
  }

  const readingTime = getReadingTime(blog.content);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/blogs" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors mb-6 text-sm md:text-base">
            <FiArrowLeft size={18} /> Back to Blogs
          </Link>
        </motion.div>

        {/* Featured Image */}
        {blog.featured_image && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative h-56 sm:h-64 md:h-96 w-full rounded-2xl overflow-hidden mb-6 md:mb-8 shadow-lg"
          >
            <Image
              src={blog.featured_image}
              alt={blog.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight"
        >
          {blog.title}
        </motion.h1>

        {/* Meta Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-gray-200 dark:border-gray-700"
        >
          <span className="flex items-center gap-1">
            <FiCalendar size={14} /> {new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <FiClock size={14} /> {readingTime} min read
          </span>
          <span className="flex items-center gap-1">
            <FiEye size={14} /> {blog.views} views
          </span>
          {blog.category && (
            <Link href={`/blogs?category=${blog.category}`} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
              <FiTag size={12} /> {blog.category}
            </Link>
          )}
        </motion.div>

        {/* Tags */}
        {blog.tags?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {blog.tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/blogs?tag=${encodeURIComponent(tag)}`}
                className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                #{tag}
              </Link>
            ))}
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="prose prose-sm sm:prose-base md:prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base flex items-center gap-2">
              <FiShare2 /> Share this article
            </p>
            <ShareButtons title={blog.title} url={shareUrl} />
            <button
              onClick={handleCopyLink}
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Copy link
            </button>
          </div>
        </motion.div>

        {/* Navigation to other blogs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center"
        >
          <Link href="/blogs" className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition">
            Read More Articles
          </Link>
        </motion.div>
      </div>
    </div>
  );
}