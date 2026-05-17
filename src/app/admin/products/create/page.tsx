'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { FiImage, FiPlus, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Form validation helper
interface FormErrors {
  name?: string;
  price?: string;
  slug?: string;
  sku?: string;
}

export default function CreateProduct() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState<FormErrors>({});

  // Basic
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');

  // Images
  const [mainImage, setMainImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});

  // Pricing
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');

  // Stock
  const [stock, setStock] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name')
        .eq('is_active', true);
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Could not load categories');
    }
  }, [supabase]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Product name must be at least 2 characters';
    }
    
    if (!price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (sku && sku.trim().length < 2) {
      newErrors.sku = 'SKU must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, price, sku]);

  const generateSlug = useCallback(() => {
    const newSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(newSlug);
  }, [name]);

  const uploadFile = useCallback(async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    setUploadProgress(prev => ({ ...prev, [fileName]: true }));
    
    try {
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
      return null;
    } finally {
      setUploadProgress(prev => ({ ...prev, [fileName]: false }));
    }
  }, [supabase]);

  const handleMainImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, 'main');
    if (url) setMainImage(url);
    setUploading(false);
  }, [uploadFile]);

  const handleAdditionalImages = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadFile(file, 'additional');
      if (url) urls.push(url);
    }
    setAdditionalImages(prev => [...prev, ...urls]);
    setUploading(false);
  }, [uploadFile]);

  const removeAdditionalImage = useCallback((index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    try {
      const finalSlug = slug.trim() || name.toLowerCase().replace(/\s+/g, '-');
      const productData = {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        brand: brand.trim() || null,
        sku: sku.trim() || null,
        category_id: categoryId?.trim() || null,
        price: parseFloat(price),
        compare_price: comparePrice ? parseFloat(comparePrice) : null,
        stock_quantity: stock ? parseInt(stock, 10) : 0,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean).length ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        is_active: true,
        is_featured: false,
        attributes: { main_image: mainImage, additional_images: additionalImages },
      };

      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      toast.success('Product created successfully!');
      router.push('/admin/products');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create product');
      setLoading(false);
    }
  }, [name, slug, description, brand, sku, categoryId, price, comparePrice, stock, tags, mainImage, additionalImages, router, validateForm]);

  const tabs = useMemo(() => [
    { id: 'basic', label: 'Basic Info' },
    { id: 'images', label: 'Images' },
    { id: 'pricing', label: 'Pricing' },
  ], []);

  const inputClass = (hasError: boolean) => `
    w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700 
    focus:ring-2 focus:ring-primary-500 focus:border-transparent transition
    ${hasError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'}
  `;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent mb-6">
        Create New Product
      </h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 pt-4 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 px-2 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4 md:p-6 space-y-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputClass(!!errors.name)}
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle size={12} /> {errors.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                      className="flex-1 border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
                      placeholder="auto-generated from name"
                    />
                    <button
                      type="button"
                      onClick={generateSlug}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition whitespace-nowrap"
                    >
                      Auto
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">SKU (unique, optional)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className={inputClass(!!errors.sku)}
                  />
                  {errors.sku && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle size={12} /> {errors.sku}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                    placeholder="e.g., summer, sale, new"
                  />
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <div>
                  <label className="block font-medium mb-2">Main Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImage}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                  {mainImage && (
                    <div className="relative w-32 h-32 mt-3 rounded-lg overflow-hidden border">
                      <Image src={mainImage} alt="Main" fill className="object-cover" />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block font-medium mb-2">Additional Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleAdditionalImages}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                  <div className="flex flex-wrap gap-3 mt-3">
                    <AnimatePresence>
                      {additionalImages.map((img, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative w-24 h-24 rounded-lg overflow-hidden border group"
                        >
                          <Image src={img} alt={`additional-${idx}`} fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                          >
                            <FiX size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">
                  Supported formats: JPG, PNG, GIF, WEBP. Max file size: 5MB per image.
                </p>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price (₨) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className={inputClass(!!errors.price)}
                    required
                  />
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle size={12} /> {errors.price}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Compare Price (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={comparePrice}
                    onChange={e => setComparePrice(e.target.value)}
                    className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                    placeholder="Original price (to show discount)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-700"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || uploading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}