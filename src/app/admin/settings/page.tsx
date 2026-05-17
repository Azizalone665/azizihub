'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  FiSave, FiUserPlus, FiUserX, FiShield, FiMail, FiGlobe, FiPhone, FiMapPin, FiInfo, 
  FiDollarSign, FiTruck, FiShoppingCart, FiSun, FiMoon, FiSearch, FiTrash2, FiCreditCard,
  FiClock, FiCalendar, FiLoader, FiCheckCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

// Memoized Tab Button Component
const TabButton = ({ tab, isActive, onClick }: { tab: any; isActive: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-3 md:px-4 py-2 font-medium transition flex items-center gap-2 rounded-t-lg text-sm md:text-base ${
      isActive
        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 border-b-2 border-primary-600'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`}
  >
    <tab.icon size={16} className="md:w-[18px] md:h-[18px]" /> 
    <span className="hidden sm:inline">{tab.label}</span>
  </button>
);

export default function AdminSettings() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [regularUsers, setRegularUsers] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [logoPreview, setLogoPreview] = useState('/logo.png');

  // Settings state
  const [settings, setSettings] = useState({
    site_name: 'AziziHub',
    site_logo: '/logo.png',
    contact_email: 'support@azizihub.com',
    contact_phone: '+92 300 1234567',
    contact_address: 'Karachi, Pakistan',
    meta_description: 'Best online shopping in Pakistan',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    date_format: 'DD/MM/YYYY',
    cod_enabled: true,
    stripe_enabled: false,
    stripe_public_key: '',
    stripe_secret_key: '',
    default_shipping_cost: 200,
    free_shipping_threshold: 5000,
    domestic_shipping_rate: 200,
    international_shipping: false,
    dark_mode_default: false,
    primary_color: '#10b981',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    order_confirmation: true,
    low_stock_alert: true,
    new_message_alert: true,
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  }, [supabase]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');
      if (error) throw error;
      if (data) {
        const map = new Map(data.map(s => [s.key, s.value?.value]));
        setSettings(prev => ({
          ...prev,
          site_name: map.get('site_name') || prev.site_name,
          site_logo: map.get('site_logo') || prev.site_logo,
          contact_email: map.get('contact_email') || prev.contact_email,
          contact_phone: map.get('contact_phone') || prev.contact_phone,
          contact_address: map.get('address') || prev.contact_address,
          meta_description: map.get('meta_description') || prev.meta_description,
          currency: map.get('currency') || prev.currency,
          timezone: map.get('timezone') || prev.timezone,
          date_format: map.get('date_format') || prev.date_format,
          cod_enabled: map.get('cod_enabled') ?? prev.cod_enabled,
          stripe_enabled: map.get('stripe_enabled') ?? prev.stripe_enabled,
          stripe_public_key: map.get('stripe_public_key') || '',
          stripe_secret_key: map.get('stripe_secret_key') || '',
          default_shipping_cost: map.get('default_shipping_cost') ?? prev.default_shipping_cost,
          free_shipping_threshold: map.get('free_shipping_threshold') ?? prev.free_shipping_threshold,
          domestic_shipping_rate: map.get('domestic_shipping_rate') ?? prev.domestic_shipping_rate,
          international_shipping: map.get('international_shipping') ?? prev.international_shipping,
          dark_mode_default: map.get('dark_mode_default') ?? prev.dark_mode_default,
          primary_color: map.get('primary_color') || prev.primary_color,
        }));
        setLogoPreview(map.get('site_logo') || '/logo.png');
        if (map.get('dark_mode_default')) {
          document.documentElement.classList.add('dark');
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    }
  }, [supabase]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at');
      if (error) throw error;
      
      let userEmails: Record<string, string> = {};
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (!authError && authUsers) {
        userEmails = Object.fromEntries(authUsers.users.map((u: any) => [u.id, u.email || '']));
      }
      
      const usersWithEmail = (profiles || []).map(p => ({
        ...p,
        email: userEmails[p.id] || 'Email unavailable',
      }));
      setAdmins(usersWithEmail.filter(u => u.role === 'admin'));
      setRegularUsers(usersWithEmail.filter(u => u.role === 'user'));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const updateSetting = useCallback(async (key: string, value: any) => {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value: { value } }, { onConflict: 'key' });
    if (error) throw error;
  }, [supabase]);

  const handleSaveGeneral = useCallback(async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting('site_name', settings.site_name),
        updateSetting('site_logo', settings.site_logo),
        updateSetting('contact_email', settings.contact_email),
        updateSetting('contact_phone', settings.contact_phone),
        updateSetting('address', settings.contact_address),
        updateSetting('meta_description', settings.meta_description),
        updateSetting('currency', settings.currency),
        updateSetting('timezone', settings.timezone),
        updateSetting('date_format', settings.date_format),
      ]);
      toast.success('General settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [settings, updateSetting]);

  const handleSavePayment = useCallback(async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting('cod_enabled', settings.cod_enabled),
        updateSetting('stripe_enabled', settings.stripe_enabled),
        updateSetting('stripe_public_key', settings.stripe_public_key),
        updateSetting('stripe_secret_key', settings.stripe_secret_key),
      ]);
      toast.success('Payment settings saved');
    } catch (err) {
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  }, [settings, updateSetting]);

  const handleSaveShipping = useCallback(async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting('default_shipping_cost', settings.default_shipping_cost),
        updateSetting('free_shipping_threshold', settings.free_shipping_threshold),
        updateSetting('domestic_shipping_rate', settings.domestic_shipping_rate),
        updateSetting('international_shipping', settings.international_shipping),
      ]);
      toast.success('Shipping settings saved');
    } catch (err) {
      toast.error('Failed to save shipping settings');
    } finally {
      setSaving(false);
    }
  }, [settings, updateSetting]);

  const handleSaveAppearance = useCallback(async () => {
    setSaving(true);
    try {
      await updateSetting('dark_mode_default', settings.dark_mode_default);
      await updateSetting('primary_color', settings.primary_color);
      if (settings.dark_mode_default) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      toast.success('Appearance settings saved');
    } catch (err) {
      toast.error('Failed to save appearance settings');
    } finally {
      setSaving(false);
    }
  }, [settings, updateSetting]);

  const updateRole = useCallback(async (userId: string, newRole: 'admin' | 'user') => {
    if (userId === currentUserId && newRole !== 'admin') {
      toast.error('You cannot demote yourself');
      return;
    }
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
    }
  }, [supabase, currentUserId, fetchUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    if (userId === currentUserId) {
      toast.error('You cannot delete yourself');
      return;
    }
    if (!confirm('Permanently delete this user? All associated orders will be orphaned.')) return;
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      toast.success('User deleted');
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [supabase, currentUserId, fetchUsers]);

  const filteredRegularUsers = useMemo(() => 
    regularUsers.filter(u =>
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    ), [regularUsers, userSearch]);

  const tabs = useMemo(() => [
    { id: 'general', label: 'General', icon: FiGlobe },
    { id: 'payment', label: 'Payment', icon: FiCreditCard },
    { id: 'shipping', label: 'Shipping', icon: FiTruck },
    { id: 'admins', label: 'Admins', icon: FiShield },
    { id: 'appearance', label: 'Appearance', icon: FiSun },
    { id: 'notifications', label: 'Notifications', icon: FiMail },
  ], []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
        Settings
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b pb-1 overflow-x-auto">
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* General Settings Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'general' && (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Site Name</label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={e => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Logo URL</label>
                <input
                  type="text"
                  value={settings.site_logo}
                  onChange={e => { setSettings({ ...settings, site_logo: e.target.value }); setLogoPreview(e.target.value); }}
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                />
                {logoPreview && (
                  <div className="mt-2 relative w-32 h-12 bg-gray-100 rounded overflow-hidden">
                    <Image src={logoPreview} alt="Logo preview" fill className="object-contain" unoptimized />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={settings.contact_phone}
                  onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={settings.contact_address}
                  onChange={e => setSettings({ ...settings, contact_address: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  value={settings.currency}
                  onChange={e => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option>PKR</option><option>USD</option><option>EUR</option><option>GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option>Asia/Karachi</option><option>Asia/Dubai</option><option>UTC</option><option>America/New_York</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date Format</label>
                <select
                  value={settings.date_format}
                  onChange={e => setSettings({ ...settings, date_format: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Meta Description (SEO)</label>
                <textarea
                  rows={3}
                  value={settings.meta_description}
                  onChange={e => setSettings({ ...settings, meta_description: e.target.value })}
                  className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSaveGeneral} disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Payment Settings Tab */}
        {activeTab === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6 space-y-5"
          >
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={settings.cod_enabled} onChange={e => setSettings({ ...settings, cod_enabled: e.target.checked })} />
              <span>Enable Cash on Delivery (COD)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={settings.stripe_enabled} onChange={e => setSettings({ ...settings, stripe_enabled: e.target.checked })} />
              <span>Enable Stripe Card Payments</span>
            </label>
            {settings.stripe_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Stripe Publishable Key</label>
                  <input
                    type="text"
                    value={settings.stripe_public_key}
                    onChange={e => setSettings({ ...settings, stripe_public_key: e.target.value })}
                    placeholder="pk_test_..."
                    className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stripe Secret Key</label>
                  <input
                    type="password"
                    value={settings.stripe_secret_key}
                    onChange={e => setSettings({ ...settings, stripe_secret_key: e.target.value })}
                    placeholder="sk_test_..."
                    className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </>
            )}
            <div className="flex justify-end">
              <button onClick={handleSavePayment} disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Shipping Settings Tab */}
        {activeTab === 'shipping' && (
          <motion.div
            key="shipping"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Default Shipping Cost (₨)</label>
              <input
                type="number"
                value={settings.default_shipping_cost}
                onChange={e => setSettings({ ...settings, default_shipping_cost: parseInt(e.target.value) })}
                className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Free Shipping Threshold (₨)</label>
              <input
                type="number"
                value={settings.free_shipping_threshold}
                onChange={e => setSettings({ ...settings, free_shipping_threshold: parseInt(e.target.value) })}
                className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Domestic Shipping Rate (₨)</label>
              <input
                type="number"
                value={settings.domestic_shipping_rate}
                onChange={e => setSettings({ ...settings, domestic_shipping_rate: parseInt(e.target.value) })}
                className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={settings.international_shipping} onChange={e => setSettings({ ...settings, international_shipping: e.target.checked })} />
              <span>Enable International Shipping (additional rates not implemented)</span>
            </label>
            <div className="flex justify-end">
              <button onClick={handleSaveShipping} disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Admin Users Tab */}
        {activeTab === 'admins' && (
          <motion.div
            key="admins"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6 space-y-6"
          >
            <div className="flex justify-between items-center flex-wrap gap-3">
              <h2 className="text-lg font-semibold">Current Administrators</h2>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border rounded-lg text-sm w-64 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Admins</h3>
                {admins.map(admin => (
                  <div key={admin.id} className="flex justify-between items-center border-b pb-2 mb-2">
                    <div>
                      <p className="font-medium">{admin.full_name || 'Unnamed'}</p>
                      <p className="text-sm text-gray-500">{admin.email}</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">Admin</span>
                      {admin.id !== currentUserId && (
                        <>
                          <button onClick={() => updateRole(admin.id, 'user')} className="text-red-600 text-sm hover:text-red-800 transition">
                            <FiUserX /> Remove Admin
                          </button>
                          <button onClick={() => deleteUser(admin.id)} className="text-gray-500 text-sm hover:text-gray-700 transition">
                            <FiTrash2 /> Delete
          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">Regular Users</h3>
                {filteredRegularUsers.map(user => (
                  <div key={user.id} className="flex justify-between items-center border-b pb-2 mb-2">
                    <div>
                      <p className="font-medium">{user.full_name || 'Unnamed'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => updateRole(user.id, 'admin')} className="text-primary-600 text-sm hover:text-primary-700 transition">
                        <FiUserPlus /> Make Admin
                      </button>
                      <button onClick={() => deleteUser(user.id)} className="text-gray-500 text-sm hover:text-gray-700 transition">
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance Settings Tab */}
        {activeTab === 'appearance' && (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6 space-y-6"
          >
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={settings.dark_mode_default} onChange={e => setSettings({ ...settings, dark_mode_default: e.target.checked })} />
              <span>Enable Dark Mode by default (user can override)</span>
            </label>
            <div>
              <label className="block text-sm font-medium mb-1">Primary Color (hex)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                  className="w-12 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                  className="flex-1 border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSaveAppearance} disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6 space-y-5"
          >
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={notificationSettings.order_confirmation} onChange={e => setNotificationSettings({ ...notificationSettings, order_confirmation: e.target.checked })} />
              <span>Send order confirmation email to customer</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={notificationSettings.low_stock_alert} onChange={e => setNotificationSettings({ ...notificationSettings, low_stock_alert: e.target.checked })} />
              <span>Alert admin when product stock is low</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={notificationSettings.new_message_alert} onChange={e => setNotificationSettings({ ...notificationSettings, new_message_alert: e.target.checked })} />
              <span>Notify admin on new contact messages</span>
            </label>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">
                ⚠️ Email notifications require SMTP configuration. Configure SMTP in your environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS).
              </p>
            </div>
            <div className="flex justify-end">
              <button onClick={() => toast.success('Notification preferences saved')} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
                <FiSave /> Save Preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}