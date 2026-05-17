'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

export default function CreateBlog() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    seo_title: '',
    seo_description: '',
  });
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState('');

  const generateSlug = () => {
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setForm(prev => ({ ...prev, slug }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImage(file);
      setFeaturedImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!featuredImage) return null;
    const fileExt = featuredImage.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = fileName;

    try {
      const { error } = await supabase.storage
        .from('blog-images')
        .upload(filePath, featuredImage, {
          cacheControl: '3600',
          upsert: false,
        });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('[Upload Error]', err);
      toast.error(`Upload failed: ${err.message}`);
      return null;
    }
  };

  const createBlog = async (imageUrl: string | null) => {
    const slug = form.slug || form.title.toLowerCase().replace(/ /g, '-');
    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from('blogs').insert({
      title: form.title,
      slug,
      content: form.content,
      excerpt: form.excerpt || null,
      category: form.category || null,
      tags: tagsArray.length ? tagsArray : null,
      featured_image: imageUrl,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      is_published: false,
    });
    if (error) throw error;
    toast.success('Blog created! (Draft)');
    router.push('/admin/blogs');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error('Title and content are required');
      return;
    }
    setLoading(true);
    setUploading(true);

    try {
      let imageUrl = null;
      if (featuredImage) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          toast.error('Image upload failed. Blog will be created without image.');
        }
      }
      await createBlog(imageUrl);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create blog');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Blog Post</h1>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <input
          type="text"
          placeholder="Title *"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full border rounded p-2 dark:bg-gray-700"
          required
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Slug (auto)"
            value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
            className="flex-1 border rounded p-2 dark:bg-gray-700"
          />
          <button type="button" onClick={generateSlug} className="bg-gray-200 dark:bg-gray-600 px-4 rounded">
            Auto
          </button>
        </div>

        <textarea
          placeholder="Excerpt"
          rows={2}
          value={form.excerpt}
          onChange={e => setForm({ ...form, excerpt: e.target.value })}
          className="w-full border rounded p-2 dark:bg-gray-700"
        />

        <textarea
          placeholder="Content (HTML supported) *"
          rows={12}
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
          className="w-full border rounded p-2 font-mono dark:bg-gray-700"
          required
        />

        <input
          type="text"
          placeholder="Category"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          className="w-full border rounded p-2 dark:bg-gray-700"
        />

        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={e => setForm({ ...form, tags: e.target.value })}
          className="w-full border rounded p-2 dark:bg-gray-700"
        />

        <div>
          <label className="block font-medium mb-1">Featured Image (upload from your computer)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            className="w-full border rounded p-2 dark:bg-gray-700"
          />
          {featuredImagePreview && (
            <div className="relative w-48 h-32 mt-2 rounded overflow-hidden border">
              <Image src={featuredImagePreview} alt="Preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => {
                  setFeaturedImage(null);
                  setFeaturedImagePreview('');
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-sm"
              >
                ×
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Make sure the bucket "blog-images" exists and is public. If upload fails, check Supabase Storage → blog-images → CORS → add http://localhost:3000.
          </p>
        </div>

        <input
          type="text"
          placeholder="SEO Title"
          value={form.seo_title}
          onChange={e => setForm({ ...form, seo_title: e.target.value })}
          className="w-full border rounded p-2 dark:bg-gray-700"
        />

        <textarea
          placeholder="SEO Description"
          rows={2}
          value={form.seo_description}
          onChange={e => setForm({ ...form, seo_description: e.target.value })}
          className="w-full border rounded p-2 dark:bg-gray-700"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : loading ? 'Creating...' : 'Create Blog'}
          </button>
        </div>
      </form>
    </div>
  );
}