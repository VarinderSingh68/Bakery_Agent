import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Edit3, Eye, EyeOff, Image, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import API_URL from '../lib/api';
import { getAuthHeaders } from '../context/AuthContext';

const emptyBanner = {
  title: '',
  subtitle: '',
  description: '',
  cta: 'Shop Now',
  cta_link: '/shop',
  image: '',
  bg_from: '#2D241E',
  bg_to: '#5C4B40',
  accent: '#F2D780',
  active: true,
  sort_order: 0,
};

export const AdminBannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyBanner);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeCount = useMemo(() => banners.filter((banner) => banner.active).length, [banners]);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/banners`, {
        headers: getAuthHeaders(),
      });
      setBanners(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyBanner);
    setEditingId(null);
    setImageFile(null);
    setUploadKey((key) => key + 1);
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image.trim();

    const uploadData = new FormData();
    uploadData.append('file', imageFile);

    const response = await axios.post(`${API_URL}/admin/banners/upload`, uploadData, {
      headers: getAuthHeaders(),
    });

    return response.data.image;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const image = await uploadImage();
      const payload = {
        ...form,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        cta: form.cta.trim(),
        cta_link: form.cta_link.trim(),
        image,
        sort_order: Number(form.sort_order) || 0,
      };

      if (editingId) {
        await axios.put(`${API_URL}/admin/banners/${editingId}`, payload, {
          headers: getAuthHeaders(),
        });
        toast.success('Banner updated');
      } else {
        await axios.post(`${API_URL}/admin/banners`, payload, {
          headers: getAuthHeaders(),
        });
        toast.success('Banner added');
      }

      resetForm();
      fetchBanners();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to save banner';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const editBanner = (banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      cta: banner.cta || 'Shop Now',
      cta_link: banner.cta_link || '/shop',
      image: banner.image || '',
      bg_from: banner.bg_from || '#2D241E',
      bg_to: banner.bg_to || '#5C4B40',
      accent: banner.accent || '#F2D780',
      active: banner.active !== false,
      sort_order: banner.sort_order || 0,
    });
    setImageFile(null);
    setUploadKey((key) => key + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleActive = async (banner) => {
    try {
      await axios.put(
        `${API_URL}/admin/banners/${banner.id}`,
        { active: !banner.active },
        { headers: getAuthHeaders() }
      );
      fetchBanners();
    } catch (error) {
      toast.error('Failed to update banner visibility');
    }
  };

  const deleteBanner = async (banner) => {
    if (!window.confirm(`Delete "${banner.title}"?`)) return;

    try {
      await axios.delete(`${API_URL}/admin/banners/${banner.id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Banner deleted');
      if (editingId === banner.id) resetForm();
      fetchBanners();
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-banners">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#E3DCCF] bg-white p-5">
          <Image className="mb-3 text-[#C25934]" size={26} />
          <p className="text-3xl font-bold text-[#2D241E]">{banners.length}</p>
          <p className="text-sm text-[#5C4B40]">Total banners</p>
        </div>
        <div className="rounded-lg border border-[#E3DCCF] bg-white p-5">
          <Eye className="mb-3 text-[#4A6B53]" size={26} />
          <p className="text-3xl font-bold text-[#2D241E]">{activeCount}</p>
          <p className="text-sm text-[#5C4B40]">Visible banners</p>
        </div>
        <div className="rounded-lg border border-[#E3DCCF] bg-white p-5">
          <Plus className="mb-3 text-[#2D241E]" size={26} />
          <p className="text-3xl font-bold text-[#2D241E]">{Math.max(banners.length - activeCount, 0)}</p>
          <p className="text-sm text-[#5C4B40]">Hidden banners</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-[#E3DCCF] bg-white p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D241E]">
            {editingId ? 'Edit Banner' : 'Add Banner'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E3DCCF] px-4 py-2 text-sm font-semibold text-[#2D241E] hover:border-[#C25934]"
            >
              <X size={16} />
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Title</span>
            <input
              value={form.title}
              onChange={(event) => updateForm('title', event.target.value)}
              required
              className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="Fresh Baked Daily"
              data-testid="banner-title-input"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Subtitle</span>
            <input
              value={form.subtitle}
              onChange={(event) => updateForm('subtitle', event.target.value)}
              className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="Weekend special"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="Short homepage banner text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Button Text</span>
            <input
              value={form.cta}
              onChange={(event) => updateForm('cta', event.target.value)}
              className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="Shop Now"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Button Link</span>
            <input
              value={form.cta_link}
              onChange={(event) => updateForm('cta_link', event.target.value)}
              className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="/shop"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#2D241E]">
              <Upload size={16} />
              Upload Image
            </span>
            <input
              key={uploadKey}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              className="w-full rounded-lg border border-dashed border-[#C25934]/40 bg-[#FDFBF7] px-4 py-3 text-sm text-[#5C4B40]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Image Link</span>
            <input
              value={form.image}
              onChange={(event) => updateForm('image', event.target.value)}
              className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="https://..."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
            {[
              ['bg_from', 'Start Color'],
              ['bg_to', 'End Color'],
              ['accent', 'Accent Color'],
            ].map(([field, label]) => (
              <label key={field} className="block">
                <span className="mb-2 block text-sm font-semibold text-[#2D241E]">{label}</span>
                <div className="flex rounded-lg border border-[#E3DCCF] bg-white p-2">
                  <input
                    type="color"
                    value={form[field]}
                    onChange={(event) => updateForm(field, event.target.value)}
                    className="h-10 w-12 border-0 bg-transparent"
                  />
                  <input
                    value={form[field]}
                    onChange={(event) => updateForm(field, event.target.value)}
                    className="min-w-0 flex-1 px-2 text-sm outline-none"
                  />
                </div>
              </label>
            ))}
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Display Order</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(event) => updateForm('sort_order', event.target.value)}
              className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
            />
          </label>

          <label className="flex items-center gap-3 pt-7">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => updateForm('active', event.target.checked)}
              className="h-5 w-5 rounded border-[#E3DCCF] text-[#C25934]"
            />
            <span className="text-sm font-semibold text-[#2D241E]">Visible on homepage</span>
          </label>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-white/10" style={{ background: `linear-gradient(135deg, ${form.bg_from} 0%, ${form.bg_to} 100%)` }}>
          <div className="grid min-h-44 gap-4 p-6 sm:grid-cols-[1fr_220px] sm:items-center">
            <div>
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase" style={{ background: `${form.accent}30`, color: form.accent }}>
                {form.subtitle || 'Banner Subtitle'}
              </span>
              <h3 className="mt-3 font-['Playfair_Display'] text-3xl font-bold text-white">{form.title || 'Banner Title'}</h3>
              <p className="mt-2 text-sm text-white/80">{form.description || 'Banner description appears here.'}</p>
            </div>
            {form.image && (
              <img src={form.image} alt="" className="h-36 w-full rounded-lg object-cover opacity-80" />
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#C25934] px-6 py-3 font-semibold text-white hover:bg-[#A84C2A] disabled:cursor-not-allowed disabled:bg-[#C25934]/60"
            data-testid="save-banner"
          >
            <Save size={18} />
            {saving ? 'Saving...' : editingId ? 'Save Banner' : 'Add Banner'}
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-[#E3DCCF] bg-white">
        <div className="border-b border-[#E3DCCF] p-5">
          <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D241E]">Current Banners</h2>
        </div>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C25934] border-t-transparent" />
          </div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-[#5C4B40]">No banners yet.</div>
        ) : (
          <div className="divide-y divide-[#E3DCCF]">
            {banners.map((banner) => (
              <div key={banner.id} className="grid gap-4 p-5 md:grid-cols-[96px_1fr_auto] md:items-center">
                <div className="h-20 w-24 overflow-hidden rounded-lg bg-[#F3EFE6]">
                  {banner.image ? (
                    <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#C25934]">
                      <Image size={28} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      banner.active ? 'bg-[#4A6B53] text-white' : 'bg-[#E3DCCF] text-[#5C4B40]'
                    }`}>
                      {banner.active ? 'Visible' : 'Hidden'}
                    </span>
                    <span className="rounded-full bg-[#F3EFE6] px-3 py-1 text-xs font-semibold text-[#5C4B40]">
                      Order {banner.sort_order || 0}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#2D241E]">{banner.title}</h3>
                  <p className="mt-1 text-sm text-[#5C4B40]">{banner.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editBanner(banner)}
                    className="rounded-lg border border-[#E3DCCF] p-2 text-[#2D241E] hover:border-[#C25934] hover:text-[#C25934]"
                    title="Edit"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(banner)}
                    className="rounded-lg border border-[#E3DCCF] p-2 text-[#2D241E] hover:border-[#C25934] hover:text-[#C25934]"
                    title={banner.active ? 'Hide' : 'Show'}
                  >
                    {banner.active ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBanner(banner)}
                    className="rounded-lg border border-[#E3DCCF] p-2 text-[#D94848] hover:bg-[#D94848]/10"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
