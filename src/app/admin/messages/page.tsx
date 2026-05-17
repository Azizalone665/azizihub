'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { 
  FiEye, FiCheck, FiMail, FiMessageCircle, FiCornerUpLeft, FiTrash2, 
  FiSearch, FiFilter, FiX, FiInbox, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  admin_reply: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

// Memoized Message Row Component
const MessageRow = ({ message, onViewReply, onMarkRead, onToggleResolved, onDelete }: { 
  message: Message; 
  onViewReply: (msg: Message) => void; 
  onMarkRead: (id: string) => void;
  onToggleResolved: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  const getStatusBadge = (msg: Message) => {
    if (msg.is_resolved) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><FiCheck size={12} /> Resolved</span>;
    }
    if (msg.admin_reply) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"><FiMessageCircle size={12} /> Replied</span>;
    }
    if (!msg.is_read) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><FiMail size={12} /> New</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Read</span>;
  };

  return (
    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${!message.is_read ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(message)}</td>
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{message.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message.email}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-gray-900 dark:text-white line-clamp-1">{message.subject}</p>
        {message.message && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{message.message.slice(0, 80)}...</p>}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {new Date(message.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewReply(message)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
            title="View / Reply"
          >
            <FiEye size={18} />
          </button>
          {!message.is_read && (
            <button onClick={() => onMarkRead(message.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600" title="Mark read">
              <FiMail size={18} />
            </button>
          )}
          <button
            onClick={() => onToggleResolved(message.id, message.is_resolved)}
            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${message.is_resolved ? 'text-gray-400' : 'text-yellow-600'}`}
            title={message.is_resolved ? 'Reopen' : 'Resolve'}
          >
            <FiCheck size={18} />
          </button>
          <button onClick={() => onDelete(message.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600" title="Delete">
            <FiTrash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function AdminMessages() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'resolved' | 'unresolved'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    filterMessages();
    setCurrentPage(1);
  }, [searchTerm, statusFilter, messages]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMessages(data || []);
      setFilteredMessages(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const filterMessages = useCallback(() => {
    let filtered = [...messages];
    
    // Status filter
    if (statusFilter === 'unread') filtered = filtered.filter(m => !m.is_read);
    else if (statusFilter === 'resolved') filtered = filtered.filter(m => m.is_resolved);
    else if (statusFilter === 'unresolved') filtered = filtered.filter(m => !m.is_resolved);
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.subject.toLowerCase().includes(term) ||
        m.message.toLowerCase().includes(term)
      );
    }
    
    setFilteredMessages(filtered);
  }, [messages, searchTerm, statusFilter]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
      toast.success('Marked as read');
      await fetchMessages();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [supabase, fetchMessages]);

  const markAsResolved = useCallback(async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_resolved: !current })
        .eq('id', id);
      if (error) throw error;
      toast.success(current ? 'Reopened' : 'Resolved');
      await fetchMessages();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [supabase, fetchMessages]);

  const deleteMessage = useCallback(async (id: string) => {
    if (!confirm('Delete this message permanently?')) return;
    try {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) throw error;
      toast.success('Deleted');
      await fetchMessages();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [supabase, fetchMessages]);

  const sendReply = useCallback(async () => {
    if (!selectedMessage || !replyText.trim()) return;
    try {
      const { error } = await supabase
        .from('messages')
        .update({ admin_reply: replyText })
        .eq('id', selectedMessage.id);
      if (error) throw error;
      toast.success('Reply saved');
      setShowReplyModal(false);
      setReplyText('');
      await fetchMessages();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [selectedMessage, replyText, supabase, fetchMessages]);

  const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE);
  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMessages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMessages, currentPage]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">Messages</h1>
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
          Contact Messages
          <span className="text-sm font-normal text-gray-500 ml-2">({filteredMessages.length} total)</span>
        </h1>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border rounded-lg w-64 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="all">All messages</option>
            <option value="unread">Unread</option>
            <option value="resolved">Resolved</option>
            <option value="unresolved">Unresolved</option>
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

      {/* Messages Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <FiInbox className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No messages match your filters.</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence mode="wait">
                    {paginatedMessages.map((message) => (
                      <MessageRow
                        key={message.id}
                        message={message}
                        onViewReply={(msg) => {
                          setSelectedMessage(msg);
                          setReplyText(msg.admin_reply || '');
                          setShowReplyModal(true);
                        }}
                        onMarkRead={markAsRead}
                        onToggleResolved={markAsResolved}
                        onDelete={deleteMessage}
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
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredMessages.length)} of {filteredMessages.length} messages
            </div>
          </>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Message from {selectedMessage.name}
              </h2>
              <button onClick={() => setShowReplyModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Email:</strong> {selectedMessage.email}</div>
                <div><strong>Date:</strong> {new Date(selectedMessage.created_at).toLocaleString()}</div>
                <div className="col-span-2"><strong>Subject:</strong> {selectedMessage.subject}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <strong>Message:</strong>
                <p className="mt-2 whitespace-pre-wrap text-gray-700 dark:text-gray-300">{selectedMessage.message}</p>
              </div>
              {selectedMessage.admin_reply && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                  <strong className="text-primary-700 dark:text-primary-300">Previous reply:</strong>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{selectedMessage.admin_reply}</p>
                </div>
              )}
              <div>
                <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Admin Reply</label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
                  placeholder="Type your reply here... The user will see this in their message thread."
                />
              </div>
            </div>
            <div className="border-t dark:border-gray-700 p-4 flex justify-end gap-2">
              <button onClick={() => setShowReplyModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={sendReply} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <FiCornerUpLeft /> Save Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}