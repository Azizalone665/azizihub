'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FiPlus, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_amount: number | null;
  maximum_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

// Memoized Coupon Row Component
const CouponRow = ({ coupon, onEdit, onToggle, onDelete, isDeleting }: { 
  coupon: Coupon; 
  onEdit: (coupon: Coupon) => void; 
  onToggle: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const isValid = () => {
    if (coupon.start_date && new Date(coupon.start_date) > new Date()) return 'Not started';
    if (coupon.end_date && new Date(coupon.end_date) < new Date()) return 'Expired';
    return 'Active';
  };

  const getValidClass = () => {
    const valid = isValid();
    if (valid === 'Not started') return 'text-yellow-600';
    if (valid === 'Expired') return 'text-red-600';
    return 'text-green-600';
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
      <td className="px-6 py-4 font-mono font-semibold text-gray-900 dark:text-white">{coupon.code}</td>
      <td className="px-6 py-4">
        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₨${coupon.discount_value}`}
      </td>
      <td className="px-6 py-4">{coupon.minimum_order_amount ? `₨${coupon.minimum_order_amount.toLocaleString()}` : '—'}</td>
      <td className="px-6 py-4">{coupon.maximum_discount_amount ? `₨${coupon.maximum_discount_amount.toLocaleString()}` : '—'}</td>
      <td className="px-6 py-4">{coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}</td>
      <td className="px-6 py-4 text-sm">
        <span className={getValidClass()}>{isValid()}</span>
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => onToggle(coupon)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
            coupon.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          {coupon.is_active ? <FiToggleRight /> : <FiToggleLeft />}
          {coupon.is_active ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-6 py-4 space-x-2">
        <button onClick={() => onEdit(coupon)} className="text-blue-600 hover:text-blue-800 transition" title="Edit">
          <FiEdit />
        </button>
        <button onClick={() => onDelete(coupon.id)} disabled={isDeleting} className="text-red-600 hover:text-red-800 transition disabled:opacity-50" title="Delete">
          <FiTrash2 />
        </button>
      </td>
    </tr>
  );
};

export default function CouponsPage() {
  const supabase = createClient();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    minimum_order_amount: '',
    maximum_discount_amount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    filterCoupons();
    setCurrentPage(1);
  }, [searchTerm, statusFilter, coupons]);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCoupons(data || []);
      setFilteredCoupons(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const filterCoupons = useCallback(() => {
    let filtered = [...coupons];
    
    if (statusFilter === 'active') filtered = filtered.filter(c => c.is_active);
    else if (statusFilter === 'inactive') filtered = filtered.filter(c => !c.is_active);
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.code.toLowerCase().includes(term)
      );
    }
    
    setFilteredCoupons(filtered);
  }, [coupons, searchTerm, statusFilter]);

  const resetForm = useCallback(() => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      minimum_order_amount: '',
      maximum_discount_amount: '',
      usage_limit: '',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setEditingCoupon(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      minimum_order_amount: coupon.minimum_order_amount?.toString() || '',
      maximum_discount_amount: coupon.maximum_discount_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      start_date: coupon.start_date ? coupon.start_date.split('T')[0] : '',
      end_date: coupon.end_date ? coupon.end_date.split('T')[0] : '',
      is_active: coupon.is_active,
    });
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      toast.error('Valid discount value is required');
      return;
    }

    const data = {
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      minimum_order_amount: formData.minimum_order_amount ? parseFloat(formData.minimum_order_amount) : null,
      maximum_discount_amount: formData.maximum_discount_amount ? parseFloat(formData.maximum_discount_amount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      is_active: formData.is_active,
    };

    try {
      let error;
      if (editingCoupon) {
        const { error: updateError } = await supabase
          .from('coupons')
          .update(data)
          .eq('id', editingCoupon.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('coupons').insert(data);
        error = insertError;
      }
      if (error) throw error;
      toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
      setModalOpen(false);
      await fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [formData, editingCoupon, supabase, fetchCoupons]);

  const toggleActive = useCallback(async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);
      if (error) throw error;
      toast.success(coupon.is_active ? 'Coupon deactivated' : 'Coupon activated');
      await fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [supabase, fetchCoupons]);

  const deleteCoupon = useCallback(async (id: string) => {
    if (!confirm('Delete this coupon permanently?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Coupon deleted');
      await fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  }, [supabase, fetchCoupons]);

  const totalPages = Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE);
  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCoupons.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCoupons, currentPage]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">Coupons & Discounts</h1>
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
          Coupons & Discounts
          <span className="text-sm font-normal text-gray-500 ml-2">({filteredCoupons.length} total)</span>
        </h1>
        <button
          onClick={openCreateModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition"
        >
          <FiPlus /> New Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by coupon code..."
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
            <option value="all">All coupons</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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

      {/* Coupons Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No coupons found.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-primary-600 hover:underline text-sm">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used / Limit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence mode="wait">
                    {paginatedCoupons.map((coupon) => (
                      <CouponRow
                        key={coupon.id}
                        coupon={coupon}
                        onEdit={openEditModal}
                        onToggle={toggleActive}
                        onDelete={deleteCoupon}
                        isDeleting={deletingId === coupon.id}
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
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredCoupons.length)} of {filteredCoupons.length} coupons
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold">{editingCoupon ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full border rounded-lg p-2 uppercase dark:bg-gray-900 dark:border-gray-700"
                  placeholder="e.g., SUMMER25"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₨)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Value *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                  placeholder={formData.discount_type === 'percentage' ? 'e.g., 25' : 'e.g., 500'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Amount (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minimum_order_amount}
                  onChange={(e) => setFormData({ ...formData, minimum_order_amount: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Maximum Discount Amount (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maximum_discount_amount}
                  onChange={(e) => setFormData({ ...formData, maximum_discount_amount: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="e.g., 2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usage Limit (optional)</label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="e.g., 100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date (optional)</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Active (coupon can be used)
              </label>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
                  {editingCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}