'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';   // <-- add this import
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function EditBlog() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    featured_image: '',
    seo_title: '',
    seo_description: '',
    is_published: false,
  });

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    const { data, error } = await supabase.from('blogs').select('*').eq('id', id).single();
    if (error) toast.error(error.message);
    else {
      setForm({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        category: data.category || '',
        tags: (data.tags || []).join(', '),
        featured_image: data.featured_image || '',
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        is_published: data.is_published || false,
      });
    }
    setFetching(false);
  };

  const generateSlug = () => {
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setForm(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error('Title and content are required');
      return;
    }
    setLoading(true);
    const slug = form.slug || form.title.toLowerCase().replace(/ /g, '-');
    const { error } = await supabase
      .from('blogs')
      .update({
        title: form.title,
        slug,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        featured_image: form.featured_image || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Blog updated');
      router.push('/admin/blogs');
    }
    setLoading(false);
  };

  if (fetching) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Blog Post</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <input type="text" placeholder="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border rounded p-2" required />
        <div className="flex gap-2">
          <input type="text" placeholder="Slug (auto)" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="flex-1 border rounded p-2" />
          <button type="button" onClick={generateSlug} className="bg-gray-200 px-4 rounded">Auto</button>
        </div>
        <input type="text" placeholder="Excerpt" value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} className="w-full border rounded p-2" />
        <textarea placeholder="Content *" rows={12} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full border rounded p-2 font-mono" required />
        <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border rounded p-2" />
        <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full border rounded p-2" />
        <input type="url" placeholder="Featured Image URL" value={form.featured_image} onChange={e => setForm({...form, featured_image: e.target.value})} className="w-full border rounded p-2" />
        <input type="text" placeholder="SEO Title" value={form.seo_title} onChange={e => setForm({...form, seo_title: e.target.value})} className="w-full border rounded p-2" />
        <textarea placeholder="SEO Description" rows={2} value={form.seo_description} onChange={e => setForm({...form, seo_description: e.target.value})} className="w-full border rounded p-2" />
        <div className="flex justify-end gap-2">
          <Link href="/admin/blogs" className="px-4 py-2 border rounded">Cancel</Link>
          <button type="submit" disabled={loading} className="bg-primary-600 text-white px-6 py-2 rounded-lg">{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}