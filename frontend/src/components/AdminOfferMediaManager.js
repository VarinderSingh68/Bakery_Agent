import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BadgePercent, Eye, EyeOff, ImagePlus, Instagram, Link2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthHeaders } from '../context/AuthContext';

const emptyForm = {
  kind: 'offer',
  title: '',
  description: '',
  badge: '',
  image_url: '',
  reel_url: '',
  cta_label: 'Shop Now',
  cta_url: '/shop',
  active: true,
  sort_order: 0,
};

export const AdminOfferMediaManager = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  const offersCount = useMemo(() => items.filter((item) => item.kind === 'offer').length, [items]);
  const reelsCount = useMemo(() => items.filter((item) => item.kind === 'reel').length, [items]);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/admin/offer-media', {
        headers: getAuthHeaders(),
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load offers and reels:', error);
      toast.error('Failed to load offers and reels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image_url.trim();

    const uploadData = new FormData();
    uploadData.append('file', imageFile);

    const response = await axios.post('/api/admin/offer-media/upload', uploadData, {
      headers: getAuthHeaders(),
    });

    return response.data.image_url;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const imageUrl = await uploadImage();
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        badge: form.badge.trim(),
        image_url: imageUrl,
        reel_url: form.reel_url.trim(),
        cta_label: form.cta_label.trim(),
        cta_url: form.cta_url.trim(),
        sort_order: Number(form.sort_order) || 0,
      };

      if (payload.kind === 'offer' && !payload.image_url) {
        toast.error('Add an offer image from storage or an image link');
        return;
      }

      if (payload.kind === 'reel' && !payload.reel_url) {
        toast.error('Add an Instagram reel link');
        return;
      }

      await axios.post('/api/admin/offer-media', payload, {
        headers: getAuthHeaders(),
      });

      toast.success(payload.kind === 'offer' ? 'Offer added' : 'Reel added');
      setForm(emptyForm);
      setImageFile(null);
      setUploadKey((key) => key + 1);
      fetchItems();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to save content';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await axios.put(
        `/api/admin/offer-media/${item.id}`,
        { active: !item.active },
        { headers: getAuthHeaders() }
      );
      fetchItems();
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;

    try {
      await axios.delete(`/api/admin/offer-media/${item.id}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Deleted');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-8" data-testid="admin-offer-media">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#E3DCCF] bg-white p-5">
          <BadgePercent className="mb-3 text-[#C25934]" size={28} />
          <p className="text-3xl font-bold text-[#2D241E]">{offersCount}</p>
          <p className="text-sm text-[#5C4B40]">Offer images</p>
        </div>
        <div className="rounded-2xl border border-[#E3DCCF] bg-white p-5">
          <Instagram className="mb-3 text-[#C25934]" size={28} />
          <p className="text-3xl font-bold text-[#2D241E]">{reelsCount}</p>
          <p className="text-sm text-[#5C4B40]">Instagram reels</p>
        </div>
        <div className="rounded-2xl border border-[#E3DCCF] bg-white p-5">
          <Eye className="mb-3 text-[#4A6B53]" size={28} />
          <p className="text-3xl font-bold text-[#2D241E]">{items.filter((item) => item.active).length}</p>
          <p className="text-sm text-[#5C4B40]">Visible on offers page</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#E3DCCF] bg-white p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D241E]">
              Add Offer or Reel
            </h2>
            <p className="mt-1 text-sm text-[#5C4B40]">
              Upload an offer image to internal storage, or paste an Instagram reel link.
            </p>
          </div>
          <select
            value={form.kind}
            onChange={(event) => updateForm('kind', event.target.value)}
            className="rounded-xl border border-[#E3DCCF] bg-white px-4 py-3 text-[#2D241E] outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
            data-testid="offer-media-kind"
          >
            <option value="offer">Offer Image</option>
            <option value="reel">Instagram Reel</option>
          </select>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Title</span>
            <input
              value={form.title}
              onChange={(event) => updateForm('title', event.target.value)}
              required
              className="w-full rounded-xl border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="Weekend cupcake box"
              data-testid="offer-media-title"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Badge</span>
            <input
              value={form.badge}
              onChange={(event) => updateForm('badge', event.target.value)}
              className="w-full rounded-xl border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="20% OFF"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="Short text that appears below the offer or reel."
            />
          </label>

          {form.kind === 'offer' ? (
            <>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#2D241E]">
                  <Upload size={16} />
                  Internal image storage
                </span>
                <input
                  key={uploadKey}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-dashed border-[#C25934]/40 bg-[#FDFBF7] px-4 py-3 text-sm text-[#5C4B40]"
                  data-testid="offer-media-file"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#2D241E]">
                  <ImagePlus size={16} />
                  Image link
                </span>
                <input
                  value={form.image_url}
                  onChange={(event) => updateForm('image_url', event.target.value)}
                  className="w-full rounded-xl border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                  placeholder="https://..."
                />
              </label>
            </>
          ) : (
            <label className="block lg:col-span-2">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#2D241E]">
                <Instagram size={16} />
                Instagram reel link
              </span>
              <input
                value={form.reel_url}
                onChange={(event) => updateForm('reel_url', event.target.value)}
                className="w-full rounded-xl border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                placeholder="https://www.instagram.com/reel/..."
                data-testid="offer-media-reel-url"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#2D241E]">
              <Link2 size={16} />
              Button text
            </span>
            <input
              value={form.cta_label}
              onChange={(event) => updateForm('cta_label', event.target.value)}
              className="w-full rounded-xl border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="Shop Now"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Button link</span>
            <input
              value={form.cta_url}
              onChange={(event) => updateForm('cta_url', event.target.value)}
              className="w-full rounded-xl border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
              placeholder="/shop"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Display order</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(event) => updateForm('sort_order', event.target.value)}
              className="w-full rounded-xl border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
            />
          </label>

          <label className="flex items-center gap-3 pt-7">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => updateForm('active', event.target.checked)}
              className="h-5 w-5 rounded border-[#E3DCCF] text-[#C25934]"
            />
            <span className="text-sm font-semibold text-[#2D241E]">Visible on offers page</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#C25934] px-8 py-3 font-semibold text-white transition-colors duration-300 hover:bg-[#A84C2A] disabled:cursor-not-allowed disabled:bg-[#C25934]/60"
            data-testid="save-offer-media"
          >
            {saving ? 'Saving...' : 'Add Content'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-[#E3DCCF] bg-white">
        <div className="border-b border-[#E3DCCF] p-6">
          <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D241E]">
            Current Content
          </h2>
        </div>

        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C25934] border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[#5C4B40]">No offers or reels have been added yet.</div>
        ) : (
          <div className="divide-y divide-[#E3DCCF]">
            {items.map((item) => (
              <div key={item.id} className="grid gap-4 p-5 md:grid-cols-[88px_1fr_auto] md:items-center">
                <div className="h-20 w-20 overflow-hidden rounded-xl bg-[#F3EFE6]">
                  {item.kind === 'offer' && item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#C25934]">
                      <Instagram size={28} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#F3EFE6] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#5C4B40]">
                      {item.kind === 'offer' ? 'Offer' : 'Reel'}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      item.active ? 'bg-[#4A6B53] text-white' : 'bg-[#E3DCCF] text-[#5C4B40]'
                    }`}>
                      {item.active ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#2D241E]">{item.title}</h3>
                  {item.description && <p className="mt-1 text-sm text-[#5C4B40]">{item.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    className="rounded-lg border border-[#E3DCCF] p-2 text-[#2D241E] transition-colors duration-300 hover:border-[#C25934] hover:text-[#C25934]"
                    title={item.active ? 'Hide' : 'Show'}
                  >
                    {item.active ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    className="rounded-lg border border-[#E3DCCF] p-2 text-[#D94848] transition-colors duration-300 hover:bg-[#D94848]/10"
                    title="Delete"
                    data-testid={`delete-offer-media-${item.id}`}
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
