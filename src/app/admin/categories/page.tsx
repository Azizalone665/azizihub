'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiFolder, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

const ITEMS_PER_PAGE = 8;

// Memoized Category Row Component
const CategoryRow = ({ category, onEdit, onDelete }: { 
  category: Category; 
  onEdit: (cat: Category) => void; 
  onDelete: (id: string) => void;
}) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
    <td className="px-6 py-4 text-2xl">{category.icon || '📁'}</td>
    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{category.name}</td>
    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{category.slug}</td>
    <td className="px-6 py-4 text-right space-x-2">
      <button
        onClick={() => onEdit(category)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        title="Edit"
      >
        <FiEdit className="w-4 h-4 text-blue-600" />
      </button>
      <button
        onClick={() => onDelete(category.id)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        title="Delete"
      >
        <FiTrash2 className="w-4 h-4 text-red-600" />
      </button>
    </td>
  </tr>
);

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '📁',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
    setCurrentPage(1);
  }, [searchTerm, categories]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const filterCategories = useCallback(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(term) || 
        cat.slug.toLowerCase().includes(term)
      );
      setFilteredCategories(filtered);
    }
  }, [categories, searchTerm]);

  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  const resetForm = useCallback(() => {
    setEditing(null);
    setFormData({ name: '', slug: '', icon: '📁' });
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: generateSlug(newName)
    }));
  }, [generateSlug]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    const slug = formData.slug || generateSlug(formData.name);
    const icon = formData.icon || '📁';
    setSubmitting(true);

    try {
      if (editing) {
        const { error } = await supabase
          .from('categories')
          .update({ name: formData.name.trim(), slug, icon })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ name: formData.name.trim(), slug, icon, is_active: true }]);
        if (error) throw error;
        toast.success('Category created');
      }
      
      resetForm();
      await fetchCategories();
      const dialog = document.getElementById('category-form') as HTMLDialogElement;
      if (dialog) dialog.close();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }, [formData, editing, supabase, fetchCategories, resetForm, generateSlug]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!confirm('⚠️ Warning: Deleting this category will affect products in this category. Are you sure?')) return;
    
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Category deleted');
      await fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [supabase, fetchCategories]);

  const startEdit = useCallback((cat: Category) => {
    setEditing(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '📁',
    });
    const dialog = document.getElementById('category-form') as HTMLDialogElement;
    if (dialog) dialog.showModal();
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    const dialog = document.getElementById('category-form') as HTMLDialogElement;
    if (dialog) dialog.showModal();
  }, [resetForm]);

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  const hasActiveFilters = searchTerm !== '';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">Categories</h1>
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
          Categories
          <span className="text-sm font-normal text-gray-500 ml-2">({filteredCategories.length} total)</span>
        </h1>
        <button
          onClick={openCreateModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition"
        >
          <FiPlus /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => setSearchTerm('')}
            className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 bg-primary-50 rounded-lg transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <FiFolder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No categories found.</p>
            {hasActiveFilters && (
              <button onClick={() => setSearchTerm('')} className="mt-3 text-primary-600 hover:underline text-sm">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Icon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence mode="wait">
                    {paginatedCategories.map((category) => (
                      <CategoryRow
                        key={category.id}
                        category={category}
                        onEdit={startEdit}
                        onDelete={deleteCategory}
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
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredCategories.length)} of {filteredCategories.length} categories
            </div>
          </>
        )}
      </div>

      {/* Modal Form */}
      <dialog id="category-form" className="rounded-xl shadow-xl backdrop:bg-black/50 w-full max-w-md p-0 dark:bg-gray-800">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">{editing ? 'Edit' : 'Add'} Category</h2>
          <button onClick={() => (document.getElementById('category-form') as HTMLDialogElement)?.close()} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug (URL)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
              placeholder="auto-generated"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty to auto‑generate from name.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
              placeholder="e.g., 📁, 👕, 📱"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => (document.getElementById('category-form') as HTMLDialogElement)?.close()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                editing ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}