'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { FiEye, FiX, FiSearch, FiUser, FiMail, FiPhone, FiCalendar, FiShield, FiUserCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  avatar_url?: string;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

// Memoized User Row Component
const UserRow = ({ user, onViewOrders, onRoleChange, updatingRole }: { 
  user: Profile; 
  onViewOrders: (user: Profile) => void; 
  onRoleChange: (userId: string, newRole: string) => void;
  updatingRole: string | null;
}) => {
  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"><FiShield className="w-3 h-3" /> Admin</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"><FiUser className="w-3 h-3" /> User</span>;
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-medium">
            {user.full_name?.charAt(0) || <FiUser className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.full_name || '—'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id.slice(0, 8)}...</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <FiMail className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">{user.email || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FiPhone className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">{user.phone || '—'}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {getRoleBadge(user.role || 'user')}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <FiCalendar className="w-3.5 h-3.5" />
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewOrders(user)}
            className="text-primary-600 hover:text-primary-800 transition flex items-center gap-1 text-sm"
            title="View orders"
          >
            <FiEye /> Orders
          </button>
          <div className="relative">
            <select
              value={user.role || 'user'}
              onChange={(e) => onRoleChange(user.id, e.target.value)}
              disabled={updatingRole === user.id}
              className="appearance-none bg-transparent border rounded-md py-1 pl-2 pr-7 text-sm focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option value="user">👤 User</option>
              <option value="admin">👑 Admin</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <FiUserCheck className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default function AdminUsers() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1);
  }, [searchTerm, users]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Try to fetch emails from auth.users (requires service role key)
      let usersWithEmail = profiles || [];
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (!authError && authUsers) {
        const emailMap = new Map(authUsers.users.map((u: any) => [u.id, u.email]));
        usersWithEmail = (profiles || []).map((p: any) => ({
          ...p,
          email: emailMap.get(p.id) || 'Email unavailable',
        }));
      } else {
        console.warn('Admin cannot fetch user emails – using fallback');
      }
      setUsers(usersWithEmail);
      setFilteredUsers(usersWithEmail);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const filterUsers = useCallback(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(u => 
        u.full_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone?.includes(term)
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const viewUserOrders = useCallback(async (user: Profile) => {
    setSelectedUser(user);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUserOrders(data || []);
      setShowModal(true);
    } catch (error: any) {
      toast.error('Could not fetch orders');
      setUserOrders([]);
    }
  }, [supabase]);

  const updateUserRole = useCallback(async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      toast.success(`User role updated to ${newRole}`);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdatingRole(null);
    }
  }, [supabase, fetchUsers]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const hasActiveFilters = searchTerm !== '';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">User Management</h1>
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
          User Management
          <span className="text-sm font-normal text-gray-500 ml-2">({filteredUsers.length} total)</span>
        </h1>
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={clearSearch}
            className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 bg-primary-50 rounded-lg transition"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
            {hasActiveFilters && (
              <button onClick={clearSearch} className="mt-3 text-primary-600 hover:underline text-sm">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence mode="wait">
                    {paginatedUsers.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        onViewOrders={viewUserOrders}
                        onRoleChange={updateUserRole}
                        updatingRole={updatingRole}
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
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Orders – {selectedUser.full_name || selectedUser.email}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <FiX size={24} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {userOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders found for this user.</p>
              ) : (
                <div className="space-y-3">
                  {userOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <p className="font-mono font-semibold text-gray-900 dark:text-white">{order.order_number}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">₨{order.total_amount.toLocaleString()}</p>
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t dark:border-gray-700 p-4 flex justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}