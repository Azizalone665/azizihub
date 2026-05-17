'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiEyeOff, FiSearch, FiFilter, FiCalendar, FiBarChart2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  is_published: boolean;
  created_at: string;
  views: number;
}

const ITEMS_PER_PAGE = 10;

// Memoized Blog Row Component
const BlogRow = ({ blog, onTogglePublish, onDelete, isDeleting }: { 
  blog: Blog; 
  onTogglePublish: (id: string, current: boolean) => void; 
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const getStatusBadge = (isPublished: boolean) => {
    if (isPublished) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><FiEye className="w-3 h-3" /> Published</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><FiEyeOff className="w-3 h-3" /> Draft</span>;
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{blog.title}</p>
          {blog.excerpt && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{blog.excerpt}</p>}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{blog.slug}</td>
      <td className="px-6 py-4">{getStatusBadge(blog.is_published)}</td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1"><FiBarChart2 className="w-3.5 h-3.5" /> {blog.views}</div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" /> {new Date(blog.created_at).toLocaleDateString()}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTogglePublish(blog.id, blog.is_published)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title={blog.is_published ? 'Unpublish' : 'Publish'}
          >
            {blog.is_published ? <FiEyeOff className="w-4 h-4 text-yellow-600" /> : <FiEye className="w-4 h-4 text-green-600" />}
          </button>
          <Link
            href={`/admin/blogs/edit/${blog.id}`}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Edit"
          >
            <FiEdit className="w-4 h-4 text-blue-600" />
          </Link>
          <button
            onClick={() => onDelete(blog.id)}
            disabled={isDeleting}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function AdminBlogs() {
  const supabase = createClient();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    filterBlogs();
    setCurrentPage(1);
  }, [searchTerm, statusFilter, blogs]);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, excerpt, is_published, created_at, views')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBlogs(data || []);
      setFilteredBlogs(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const filterBlogs = useCallback(() => {
    let filtered = [...blogs];
    
    if (statusFilter === 'published') filtered = filtered.filter(b => b.is_published);
    else if (statusFilter === 'draft') filtered = filtered.filter(b => !b.is_published);
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(term) ||
        b.slug.toLowerCase().includes(term) ||
        (b.excerpt && b.excerpt.toLowerCase().includes(term))
      );
    }
    
    setFilteredBlogs(filtered);
  }, [blogs, searchTerm, statusFilter]);

  const togglePublish = useCallback(async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('blogs')
        .update({ 
          is_published: !current, 
          published_at: !current ? new Date().toISOString() : null 
        })
        .eq('id', id);
      if (error) throw error;
      toast.success(current ? 'Unpublished' : 'Published');
      await fetchBlogs();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [supabase, fetchBlogs]);

  const deleteBlog = useCallback(async (id: string) => {
    if (!confirm('Delete this blog permanently?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (error) throw error;
      toast.success('Blog deleted');
      await fetchBlogs();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  }, [supabase, fetchBlogs]);

  const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);
  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBlogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBlogs, currentPage]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">Blog Management</h1>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
          Blog Management
          <span className="text-sm font-normal text-gray-500 ml-2">({filteredBlogs.length} total)</span>
        </h1>
        <Link href="/admin/blogs/create" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition">
          <FiPlus /> New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, slug or excerpt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="all">All posts</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
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

      {/* Blogs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No blog posts found.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-primary-600 hover:underline text-sm">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence mode="wait">
                    {paginatedBlogs.map((blog) => (
                      <BlogRow
                        key={blog.id}
                        blog={blog}
                        onTogglePublish={togglePublish}
                        onDelete={deleteBlog}
                        isDeleting={deletingId === blog.id}
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
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
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
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredBlogs.length)} of {filteredBlogs.length} posts
            </div>
          </>
        )}
      </div>
    </div>
  );
}