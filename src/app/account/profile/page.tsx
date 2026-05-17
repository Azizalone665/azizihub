'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FiUser, FiPhone, FiMapPin, FiHome, FiGlobe, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface ProfileForm {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

interface FormErrors {
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

export default function ProfilePage() {
  const { user, profile: userProfile } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Pakistan',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (userProfile) {
      setForm({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        zip_code: userProfile.zip_code || '',
        country: userProfile.country || 'Pakistan',
      });
    }
  }, [userProfile]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (!form.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (form.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    }
    
    if (form.phone && !/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) {
      newErrors.phone = 'Enter a valid phone number';
    }
    
    if (form.zip_code && !/^[0-9A-Za-z\-\s]{3,10}$/.test(form.zip_code.trim())) {
      newErrors.zip_code = 'Enter a valid ZIP code';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    setSaved(false);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          zip_code: form.zip_code.trim() || null,
          country: form.country.trim() || 'Pakistan',
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully!');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [form, user, supabase, validateForm]);

  const handleChange = useCallback((field: keyof ProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const inputFields = useMemo(() => [
    { id: 'full_name' as const, label: 'Full Name', icon: FiUser, type: 'text', placeholder: 'John Doe', required: true },
    { id: 'phone' as const, label: 'Phone Number', icon: FiPhone, type: 'tel', placeholder: '+92 300 1234567', required: false },
    { id: 'address' as const, label: 'Street Address', icon: FiMapPin, type: 'text', placeholder: 'House #, Street, Area', required: false },
    { id: 'city' as const, label: 'City', icon: FiHome, type: 'text', placeholder: 'Karachi', required: false },
    { id: 'state' as const, label: 'State / Province', icon: FiMapPin, type: 'text', placeholder: 'Sindh', required: false },
    { id: 'zip_code' as const, label: 'ZIP / Postal Code', icon: FiMapPin, type: 'text', placeholder: '12345', required: false },
    { id: 'country' as const, label: 'Country', icon: FiGlobe, type: 'text', placeholder: 'Pakistan', required: false },
  ], []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        {saved && (
          <div className="flex items-center gap-1 text-green-600 text-sm animate-pulse">
            <FiCheckCircle size={16} /> Saved!
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {inputFields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={field.type}
                value={form[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition dark:bg-gray-700 dark:text-white ${
                  errors[field.id] 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                required={field.required}
              />
            </div>
            {errors[field.id] && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <FiAlertCircle size={12} /> {errors[field.id]}
              </p>
            )}
          </div>
        ))}
        
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Account Info Note */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Your email address cannot be changed. For security reasons, please contact support if you need to update your email.
        </p>
      </div>
    </div>
  );
}