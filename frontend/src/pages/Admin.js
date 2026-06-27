import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BadgePercent,
  BarChart3,
  DollarSign,
  Edit3,
  Image,
  Layers3,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, getAuthHeaders } from '../context/AuthContext';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { AdminOfferMediaManager } from '../components/AdminOfferMediaManager';
import { AdminBannerManager } from '../components/AdminBannerManager';
import API_URL from '../lib/api';

const emptyProductForm = {
  name: '',
  category: '',
  price: '',
  description: '',
  image: '',
  stock: '',
  variants: [],
};

const orderStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const categoryVariantPresets = {
  Cakes: [
    { label: '0.5kg', multiplier: 0.5 },
    { label: '1kg', multiplier: 1 },
    { label: '2kg', multiplier: 2 },
    { label: '3kg', multiplier: 3 },
    { label: '4kg', multiplier: 4 },
  ],
  'Custom Cakes': [
    { label: '1kg', multiplier: 1 },
    { label: '2kg', multiplier: 2 },
    { label: '3kg', multiplier: 3 },
    { label: '4kg', multiplier: 4 },
    { label: '5kg', multiplier: 5 },
  ],
  Cupcakes: [
    { label: 'One box', multiplier: 1 },
    { label: '2 boxes', multiplier: 2 },
    { label: 'Party box', multiplier: 3 },
  ],
  Cookies: [
    { label: 'One box', multiplier: 1 },
    { label: '2 boxes', multiplier: 2 },
    { label: 'Family box', multiplier: 3 },
  ],
  Macarons: [
    { label: 'Box of 6', multiplier: 1 },
    { label: 'Box of 12', multiplier: 2 },
    { label: 'Box of 24', multiplier: 4 },
  ],
  Donuts: [
    { label: '1 piece', multiplier: 1 },
    { label: 'Box of 6', multiplier: 6 },
    { label: 'Box of 12', multiplier: 12 },
  ],
  Pastries: [
    { label: '1 piece', multiplier: 1 },
    { label: 'Box of 2', multiplier: 2 },
    { label: 'Box of 4', multiplier: 4 },
  ],
  Muffins: [
    { label: '1 piece', multiplier: 1 },
    { label: 'Box of 4', multiplier: 4 },
    { label: 'Box of 8', multiplier: 8 },
  ],
  Breads: [
    { label: '1 loaf', multiplier: 1 },
    { label: '2 loaves', multiplier: 2 },
    { label: 'Family pack', multiplier: 3 },
  ],
  'Pies & Tarts': [
    { label: 'Single', multiplier: 1 },
    { label: 'Box of 2', multiplier: 2 },
    { label: 'Box of 4', multiplier: 4 },
  ],
  'Brownies & Bars': [
    { label: 'Box of 4', multiplier: 1 },
    { label: 'Box of 8', multiplier: 2 },
    { label: 'Box of 12', multiplier: 3 },
  ],
  Beverages: [
    { label: '250ml', multiplier: 1 },
    { label: '500ml', multiplier: 2 },
    { label: '1 litre', multiplier: 4 },
  ],
  'Ice Cream & Frozen': [
    { label: 'Single cup', multiplier: 1 },
    { label: '500ml tub', multiplier: 2 },
    { label: '1 litre tub', multiplier: 4 },
  ],
  Savory: [
    { label: '1 plate', multiplier: 1 },
    { label: '2 plates', multiplier: 2 },
    { label: 'Party tray', multiplier: 4 },
  ],
  'Gift Hampers': [
    { label: 'Small box', multiplier: 1 },
    { label: 'Medium box', multiplier: 1.5 },
    { label: 'Large box', multiplier: 2.5 },
  ],
};

const fallbackVariantPreset = [
  { label: 'Single', multiplier: 1 },
  { label: 'Pack of 2', multiplier: 2 },
  { label: 'Pack of 4', multiplier: 4 },
];

const getVariantPresetForCategory = (category) => (
  categoryVariantPresets[category] || fallbackVariantPreset
);

const normalizeVariantForForm = (variant) => ({
  label: variant?.label || '',
  multiplier: String(variant?.multiplier ?? 1),
});

const clonePresetForForm = (category) => getVariantPresetForCategory(category).map(normalizeVariantForForm);

const tabItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Layers3 },
  { id: 'banners', label: 'Banners', icon: Image },
  { id: 'offer-media', label: 'Offers & Reels', icon: BadgePercent },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(0)}`;

export const Admin = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categoryDraft, setCategoryDraft] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/products`),
        axios.get(`${API_URL}/admin/orders`, { headers: getAuthHeaders() }),
      ]);
      setStats(statsRes.data);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Admin login required');
        navigate('/admin-login', { replace: true });
        return;
      }
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/admin-login', { replace: true });
      return;
    }
    if (user.role !== 'admin') {
      setLoading(false);
      return;
    }
    fetchData();
  }, [authLoading, fetchData, navigate, user]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [categoryFilter, productSearch, products]);

  const updateProductForm = (field, value) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const updateProductCategory = (category) => {
    setProductForm((current) => ({
      ...current,
      category,
      variants: current.variants.length > 0 || !categoryVariantPresets[category]
        ? current.variants
        : clonePresetForForm(category),
    }));
  };

  const updateProductVariant = (index, field, value) => {
    setProductForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => (
        variantIndex === index ? { ...variant, [field]: value } : variant
      )),
    }));
  };

  const addProductVariant = () => {
    setProductForm((current) => ({
      ...current,
      variants: [...current.variants, { label: '', multiplier: '1' }],
    }));
  };

  const removeProductVariant = (index) => {
    setProductForm((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  };

  const applyProductVariantPreset = () => {
    setProductForm((current) => ({
      ...current,
      variants: clonePresetForForm(current.category),
    }));
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
  };

  const startProductEdit = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      category: product.category || '',
      price: product.price ?? '',
      description: product.description || '',
      image: product.image || '',
      stock: product.stock ?? '',
      variants: Array.isArray(product.variants) && product.variants.length > 0
        ? product.variants.map(normalizeVariantForForm)
        : clonePresetForForm(product.category || ''),
    });
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startProductWithCategory = (category) => {
    setEditingProduct(null);
    setProductForm({ ...emptyProductForm, category, variants: clonePresetForForm(category) });
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: productForm.name.trim(),
      category: productForm.category.trim(),
      price: Number(productForm.price),
      description: productForm.description.trim(),
      image: productForm.image.trim(),
      stock: Number.parseInt(productForm.stock, 10),
      variants: productForm.variants
        .map((variant) => ({
          label: variant.label.trim(),
          multiplier: Number(variant.multiplier),
        }))
        .filter((variant) => variant.label && Number.isFinite(variant.multiplier) && variant.multiplier > 0),
    };

    if (!payload.name || !payload.category || !payload.description || !payload.image) {
      toast.error('Complete the product details before saving');
      return;
    }

    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      toast.error('Enter a valid product price');
      return;
    }

    if (!Number.isFinite(payload.stock) || payload.stock < 0) {
      toast.error('Enter a valid stock count');
      return;
    }

    if (payload.variants.length === 0) {
      toast.error('Add at least one selling option');
      return;
    }

    setSavingProduct(true);
    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/admin/products/${editingProduct.id}`, payload, {
          headers: getAuthHeaders(),
        });
        toast.success('Product updated');
      } else {
        await axios.post(`${API_URL}/admin/products`, payload, {
          headers: getAuthHeaders(),
        });
        toast.success('Product added');
      }
      resetProductForm();
      fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to save product';
      toast.error(message);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      await axios.delete(`${API_URL}/admin/products/${productId}`, {
        headers: getAuthHeaders(),
      });
      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/admin/orders/${orderId}/status?status=${encodeURIComponent(newStatus)}`,
        {},
        { headers: getAuthHeaders() }
      );
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin-login');
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#C25934] border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] px-4 py-20">
        <div className="mx-auto max-w-lg rounded-lg border border-[#E3DCCF] bg-white p-8 text-center">
          <h1 className="mb-3 font-['Playfair_Display'] text-3xl font-bold text-[#2D241E]">Admin Login Required</h1>
          <p className="mb-6 text-[#5C4B40]">Use the admin account to open this panel.</p>
          <Link to="/admin-login" className="inline-flex rounded-lg bg-[#C25934] px-6 py-3 font-semibold text-white hover:bg-[#A84C2A]">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8" data-testid="admin-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#C25934]">Secure Admin</p>
            <h1 className="font-['Playfair_Display'] text-4xl font-bold tracking-tight text-[#2D241E]">
              Bakery Admin Panel
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E3DCCF] bg-white px-4 py-2.5 font-semibold text-[#2D241E] hover:border-[#C25934]"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E3DCCF] bg-white px-4 py-2.5 font-semibold text-[#D94848] hover:bg-[#D94848]/10"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto border-b border-[#E3DCCF]">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#C25934] text-[#C25934]'
                    : 'border-transparent text-[#5C4B40] hover:text-[#C25934]'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && stats && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Products', stats.total_products, Package],
              ['Orders', stats.total_orders, ShoppingCart],
              ['Customers', stats.total_users, Users],
              ['Revenue', formatCurrency(stats.total_revenue), DollarSign],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-lg border border-[#E3DCCF] bg-white p-6">
                <Icon className="mb-4 text-[#C25934]" size={30} />
                <p className="text-3xl font-bold text-[#2D241E]">{value}</p>
                <p className="mt-1 text-sm text-[#5C4B40]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <form onSubmit={handleProductSubmit} className="rounded-lg border border-[#E3DCCF] bg-white p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D241E]">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#E3DCCF] px-4 py-2 text-sm font-semibold text-[#2D241E] hover:border-[#C25934]"
                  >
                    <X size={16} />
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Product Name</span>
                  <input
                    value={productForm.name}
                    onChange={(event) => updateProductForm('name', event.target.value)}
                    className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    placeholder="Chocolate Truffle Cake"
                    data-testid="product-name-input"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Category</span>
                  <input
                    list="admin-product-categories"
                    value={productForm.category}
                    onChange={(event) => updateProductCategory(event.target.value)}
                    className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    placeholder="Cakes"
                    data-testid="product-category-input"
                  />
                  <datalist id="admin-product-categories">
                    {categoryOptions.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={(event) => updateProductForm('price', event.target.value)}
                    className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    placeholder="699"
                    data-testid="product-price-input"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Stock</span>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(event) => updateProductForm('stock', event.target.value)}
                    className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    placeholder="25"
                    data-testid="product-stock-input"
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Image Link</span>
                  <input
                    value={productForm.image}
                    onChange={(event) => updateProductForm('image', event.target.value)}
                    className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    placeholder="https://..."
                    data-testid="product-image-input"
                  />
                </label>

                <label className="block lg:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Description</span>
                  <textarea
                    value={productForm.description}
                    onChange={(event) => updateProductForm('description', event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    placeholder="Describe the product"
                    data-testid="product-description-input"
                  />
                </label>

                <div className="lg:col-span-2 rounded-lg border border-[#E3DCCF] bg-[#FDFBF7] p-5">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#2D241E]">
                        Selling Options
                      </h3>
                      <p className="mt-1 text-sm text-[#5C4B40]">
                        Add sizes, weights, boxes, packs, or trays for this product.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={applyProductVariantPreset}
                        className="rounded-lg border border-[#E3DCCF] bg-white px-4 py-2 text-sm font-semibold text-[#2D241E] hover:border-[#C25934]"
                      >
                        Use Category Preset
                      </button>
                      <button
                        type="button"
                        onClick={addProductVariant}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#2D241E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3b3028]"
                      >
                        <Plus size={16} />
                        Add Option
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {getVariantPresetForCategory(productForm.category).map((variant) => (
                      <button
                        key={`${productForm.category || 'default'}-${variant.label}`}
                        type="button"
                        onClick={() => {
                          const exists = productForm.variants.some((item) => item.label === variant.label);
                          if (exists) return;
                          setProductForm((current) => ({
                            ...current,
                            variants: [...current.variants, normalizeVariantForForm(variant)],
                          }));
                        }}
                        className="rounded-full border border-[#E3DCCF] bg-white px-3 py-1.5 text-xs font-semibold text-[#5C4B40] hover:border-[#C25934] hover:text-[#C25934]"
                      >
                        {variant.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {productForm.variants.map((variant, index) => {
                      const basePrice = Number(productForm.price) || 0;
                      const optionPrice = Math.round(basePrice * (Number(variant.multiplier) || 0));
                      return (
                        <div key={`${index}-${variant.label}`} className="grid gap-3 rounded-lg border border-[#E3DCCF] bg-white p-3 md:grid-cols-[1fr_150px_130px_auto] md:items-end">
                          <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#5C4B40]">
                              Option label
                            </span>
                            <input
                              value={variant.label}
                              onChange={(event) => updateProductVariant(index, 'label', event.target.value)}
                              className="w-full rounded-lg border border-[#E3DCCF] px-3 py-2 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                              placeholder="1kg, 2kg, One box"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#5C4B40]">
                              Price multiple
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={variant.multiplier}
                              onChange={(event) => updateProductVariant(index, 'multiplier', event.target.value)}
                              className="w-full rounded-lg border border-[#E3DCCF] px-3 py-2 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                              placeholder="1"
                            />
                          </label>
                          <div className="rounded-lg bg-[#F3EFE6] px-3 py-2">
                            <span className="block text-xs font-semibold uppercase tracking-wide text-[#5C4B40]">
                              Price
                            </span>
                            <span className="font-bold text-[#2D241E]">{formatCurrency(optionPrice)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProductVariant(index)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E3DCCF] text-[#D94848] hover:bg-[#D94848]/10"
                            title="Remove option"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      );
                    })}
                    {productForm.variants.length === 0 && (
                      <div className="rounded-lg border border-dashed border-[#E3DCCF] bg-white p-5 text-center text-sm text-[#5C4B40]">
                        No selling options yet. Use the category preset or add an option.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#C25934] px-6 py-3 font-semibold text-white hover:bg-[#A84C2A] disabled:cursor-not-allowed disabled:bg-[#C25934]/60"
                  data-testid="save-product"
                >
                  <Save size={18} />
                  {savingProduct ? 'Saving...' : editingProduct ? 'Save Product' : 'Add Product'}
                </button>
              </div>
            </form>

            <div className="rounded-lg border border-[#E3DCCF] bg-white">
              <div className="grid gap-4 border-b border-[#E3DCCF] p-5 md:grid-cols-[1fr_220px]">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7E74]" size={18} />
                  <input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    className="w-full rounded-lg border border-[#E3DCCF] py-3 pl-10 pr-4 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    placeholder="Search products"
                  />
                </label>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-lg border border-[#E3DCCF] bg-white px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                >
                  <option value="all">All categories</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-[#F3EFE6]">
                    <tr>
                      <th className="px-5 py-4 text-left text-sm font-semibold text-[#2D241E]">Product</th>
                      <th className="px-5 py-4 text-left text-sm font-semibold text-[#2D241E]">Category</th>
                      <th className="px-5 py-4 text-left text-sm font-semibold text-[#2D241E]">Options</th>
                      <th className="px-5 py-4 text-left text-sm font-semibold text-[#2D241E]">Price</th>
                      <th className="px-5 py-4 text-left text-sm font-semibold text-[#2D241E]">Stock</th>
                      <th className="px-5 py-4 text-right text-sm font-semibold text-[#2D241E]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3DCCF]">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-[#FDFBF7]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                            <div>
                              <p className="font-semibold text-[#2D241E]">{product.name}</p>
                              <p className="max-w-md truncate text-xs text-[#8A7E74]">{product.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[#5C4B40]">{product.category}</td>
                        <td className="px-5 py-4">
                          <div className="flex max-w-xs flex-wrap gap-1.5">
                            {(Array.isArray(product.variants) ? product.variants : []).slice(0, 4).map((variant) => (
                              <span key={`${product.id}-${variant.label}`} className="rounded-full bg-[#F3EFE6] px-2.5 py-1 text-xs font-semibold text-[#5C4B40]">
                                {variant.label}
                              </span>
                            ))}
                            {Array.isArray(product.variants) && product.variants.length > 4 && (
                              <span className="rounded-full bg-[#E3DCCF] px-2.5 py-1 text-xs font-semibold text-[#5C4B40]">
                                +{product.variants.length - 4}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#C25934]">{formatCurrency(product.price)}</td>
                        <td className="px-5 py-4 text-[#2D241E]">{product.stock}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startProductEdit(product)}
                              className="rounded-lg border border-[#E3DCCF] p-2 text-[#2D241E] hover:border-[#C25934] hover:text-[#C25934]"
                              title="Edit product"
                              data-testid={`edit-product-${product.id}`}
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="rounded-lg border border-[#E3DCCF] p-2 text-[#D94848] hover:bg-[#D94848]/10"
                              title="Delete product"
                              data-testid={`delete-product-${product.id}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="rounded-lg border border-[#E3DCCF] bg-white p-8 text-center text-[#5C4B40]">
                No orders have been placed yet.
              </div>
            ) : (
              orders.map((order) => {
                const items = Array.isArray(order.items) ? order.items : [];
                return (
                  <div key={order.id} className="rounded-lg border border-[#E3DCCF] bg-white p-6" data-testid={`admin-order-${order.order_number}`}>
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D241E]">
                          Order #{order.order_number}
                        </h2>
                        <p className="mt-1 text-sm text-[#5C4B40]">
                          {order.user_name} - {order.user_email}
                        </p>
                        <p className="mt-1 text-sm text-[#8A7E74]">
                          {order.created_at ? new Date(order.created_at).toLocaleString() : 'Date unavailable'}
                        </p>
                      </div>
                      <div className="lg:text-right">
                        <p className="text-2xl font-bold text-[#C25934]">{formatCurrency(order.total)}</p>
                        <p className="text-sm text-[#8A7E74]">{order.payment_method}</p>
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-lg bg-[#FDFBF7] p-4">
                        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5C4B40]">Items</p>
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <div key={`${item.product_id}-${index}`} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {item.image && <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />}
                                <div>
                                  <p className="font-semibold text-[#2D241E]">{item.name}</p>
                                  <p className="text-sm text-[#8A7E74]">Qty {item.quantity} x {formatCurrency(item.price)}</p>
                                </div>
                              </div>
                              <p className="font-semibold text-[#2D241E]">{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Status</span>
                          <select
                            value={order.status}
                            onChange={(event) => handleUpdateOrderStatus(order.id, event.target.value)}
                            className="w-full rounded-lg border border-[#E3DCCF] bg-white px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                            data-testid={`status-select-${order.order_number}`}
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="rounded-lg bg-[#FDFBF7] p-4 text-sm text-[#5C4B40]">
                          <p className="font-semibold text-[#2D241E]">Delivery</p>
                          <p>{order.delivery_date}</p>
                          <p className="mt-3 font-semibold text-[#2D241E]">Address</p>
                          <p>{order.shipping_address}</p>
                          <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-[#E3DCCF] bg-white p-6">
              <h2 className="mb-4 font-['Playfair_Display'] text-2xl font-bold text-[#2D241E]">Add Category</h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={categoryDraft}
                  onChange={(event) => setCategoryDraft(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                  placeholder="Cupcakes"
                  data-testid="category-draft-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextCategory = categoryDraft.trim();
                    if (!nextCategory) {
                      toast.error('Enter a category name');
                      return;
                    }
                    setCategoryDraft('');
                    startProductWithCategory(nextCategory);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C25934] px-5 py-3 font-semibold text-white hover:bg-[#A84C2A]"
                >
                  <Plus size={18} />
                  Add Product
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#E3DCCF] bg-white p-6">
              <h2 className="mb-4 font-['Playfair_Display'] text-2xl font-bold text-[#2D241E]">Current Categories</h2>
              <div className="flex flex-wrap gap-3">
                {categoryOptions.map((category) => {
                  const count = products.filter((product) => product.category === category).length;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => startProductWithCategory(category)}
                      className="rounded-lg border border-[#E3DCCF] bg-[#FDFBF7] px-4 py-3 text-left hover:border-[#C25934]"
                    >
                      <span className="font-semibold text-[#2D241E]">{category}</span>
                      <span className="ml-2 text-sm text-[#8A7E74]">{count} products</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'banners' && <AdminBannerManager />}

        {activeTab === 'offer-media' && <AdminOfferMediaManager />}

        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  );
};
