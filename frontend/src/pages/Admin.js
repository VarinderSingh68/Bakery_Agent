import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BadgePercent,
  BarChart3,
  DollarSign,
  Edit3,
  Image,
  LineChart,
  Layers3,
  LogOut,
  Mail,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  ShieldOff,
  ShoppingCart,
  Star,
  Ticket,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { useAuth, getAuthHeaders } from '../context/AuthContext';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { AdminOfferMediaManager } from '../components/AdminOfferMediaManager';
import { AdminBannerManager } from '../components/AdminBannerManager';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { ADMIN_SESSION_KEY } from '../components/AdminRoute';

const emptyProductForm = {
  name: '',
  category: '',
  price: '',
  description: '',
  image: '',
  stock: '',
  variants: [],
};

const emptyCouponForm = {
  code: '',
  discount_percentage: '',
  expiry_date: '',
  active: true,
};

const orderStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const LOW_STOCK_THRESHOLD = 5;

const STATUS_STYLES = {
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

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

const navSections = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3 },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Layers3 },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'messages', label: 'Messages', icon: Mail },
  { id: 'banners', label: 'Banners', icon: Image },
  { id: 'offer-media', label: 'Offers & Reels', icon: BadgePercent },
  { id: 'reports', label: 'Reports', icon: LineChart },
  { id: 'analytics', label: 'Site Analytics', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const CHART_COLORS = ['#C25934', '#4A6B53', '#B98A2F', '#5B7C99', '#8E6C9E', '#D18A5C'];

const emptySettingsForm = {
  store_name: '',
  tagline: '',
  support_email: '',
  support_phone: '',
  address: '',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
};

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(0)}`;

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] || 'bg-[#F3EFE6] text-[#5C4B40] border-[#E3DCCF]'}`}>
    {status}
  </span>
);

const SectionCard = ({ title, action, children, className = '' }) => (
  <div className={`rounded-2xl border border-[#E3DCCF] bg-white p-6 ${className}`}>
    {(title || action) && (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {title && <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#2D241E]">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="rounded-2xl border border-dashed border-[#E3DCCF] bg-[#FDFBF7] p-10 text-center">
    {Icon && <Icon className="mx-auto mb-3 text-[#C7A98F]" size={32} />}
    <p className="font-semibold text-[#2D241E]">{title}</p>
    {description && <p className="mt-1 text-sm text-[#8A7E74]">{description}</p>}
  </div>
);

export const Admin = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [contacts, setContacts] = useState([]);

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [savingProduct, setSavingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [categoryDraft, setCategoryDraft] = useState('');
  const [renamingCategory, setRenamingCategory] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [renamingBusy, setRenamingBusy] = useState(false);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [savingCoupon, setSavingCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);

  const [reviews, setReviews] = useState([]);

  const [settingsForm, setSettingsForm] = useState(emptySettingsForm);
  const [savingSettings, setSavingSettings] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null); // { type, id, label }
  const [pendingRoleChange, setPendingRoleChange] = useState(null); // { id, name, nextRole }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, ordersRes, usersRes, couponsRes, contactsRes, reviewsRes, settingsRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers: getAuthHeaders() }),
        axios.get('/api/products'),
        axios.get('/api/admin/orders', { headers: getAuthHeaders() }),
        axios.get('/api/admin/users', { headers: getAuthHeaders() }),
        axios.get('/api/admin/coupons', { headers: getAuthHeaders() }),
        axios.get('/api/admin/contacts', { headers: getAuthHeaders() }),
        axios.get('/api/admin/reviews', { headers: getAuthHeaders() }),
        axios.get('/api/settings'),
      ]);
      setStats(statsRes.data);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setCoupons(Array.isArray(couponsRes.data) ? couponsRes.data : []);
      setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
      if (settingsRes.data) {
        setSettingsForm({ ...emptySettingsForm, ...settingsRes.data });
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Admin login required');
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        await logout();
        navigate('/admin-login', { replace: true });
        return;
      }
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [navigate, logout]);

  useEffect(() => {
    if (authLoading) return;
    // AdminRoute already guards this page, but keep as safety net
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

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

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

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.stock) <= LOW_STOCK_THRESHOLD).sort((a, b) => Number(a.stock) - Number(b.stock)),
    [products]
  );

  const orderStatusCounts = useMemo(() => {
    const counts = Object.fromEntries(orderStatuses.map((status) => [status, 0]));
    orders.forEach((order) => {
      if (counts[order.status] !== undefined) counts[order.status] += 1;
    });
    return counts;
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !query ||
        order.order_number?.toLowerCase().includes(query) ||
        order.user_name?.toLowerCase().includes(query) ||
        order.user_email?.toLowerCase().includes(query);
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orderSearch, orderStatusFilter, orders]);

  const orderCountByUser = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      map[order.user_id] = (map[order.user_id] || 0) + 1;
    });
    return map;
  }, [orders]);

  const revenueByUser = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      map[order.user_id] = (map[order.user_id] || 0) + Number(order.total || 0);
    });
    return map;
  }, [orders]);

  const revenueTrend = useMemo(() => {
    const days = 14;
    const buckets = [];
    const dayKey = (date) => date.toISOString().slice(0, 10);
    const totalsByDay = {};
    orders.forEach((order) => {
      if (!order.created_at) return;
      const key = dayKey(new Date(order.created_at));
      totalsByDay[key] = (totalsByDay[key] || 0) + Number(order.total || 0);
    });
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const key = dayKey(date);
      buckets.push({
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        revenue: Math.round(totalsByDay[key] || 0),
      });
    }
    return buckets;
  }, [orders]);

  const topProducts = useMemo(() => {
    const totals = {};
    orders.forEach((order) => {
      (Array.isArray(order.items) ? order.items : []).forEach((item) => {
        const key = item.name || item.product_id;
        const revenue = Number(item.price || 0) * Number(item.quantity || 0);
        totals[key] = (totals[key] || 0) + revenue;
      });
    });
    return Object.entries(totals)
      .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders]);

  const categoryRevenue = useMemo(() => {
    const productCategoryById = {};
    products.forEach((product) => {
      productCategoryById[product.id] = product.category || 'Other';
    });
    const totals = {};
    orders.forEach((order) => {
      (Array.isArray(order.items) ? order.items : []).forEach((item) => {
        const category = productCategoryById[item.product_id] || 'Other';
        const revenue = Number(item.price || 0) * Number(item.quantity || 0);
        totals[category] = (totals[category] || 0) + revenue;
      });
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [orders, products]);

  const productNameById = useMemo(() => {
    const map = {};
    products.forEach((product) => { map[product.id] = product.name; });
    return map;
  }, [products]);

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
        await axios.put(`/api/admin/products/${editingProduct.id}`, payload, {
          headers: getAuthHeaders(),
        });
        toast.success('Product updated');
      } else {
        await axios.post('/api/admin/products', payload, {
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

  const performDeleteProduct = async (productId) => {
    try {
      await axios.delete(`/api/admin/products/${productId}`, {
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
        `/api/admin/orders/${orderId}/status?status=${encodeURIComponent(newStatus)}`,
        {},
        { headers: getAuthHeaders() }
      );
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const startRenameCategory = (category) => {
    setRenamingCategory(category);
    setRenameDraft(category);
  };

  const commitRenameCategory = async () => {
    const nextName = renameDraft.trim();
    if (!nextName || nextName === renamingCategory) {
      setRenamingCategory(null);
      return;
    }
    const affected = products.filter((product) => product.category === renamingCategory);
    setRenamingBusy(true);
    try {
      await Promise.all(
        affected.map((product) => axios.put(`/api/admin/products/${product.id}`, { category: nextName }, { headers: getAuthHeaders() }))
      );
      toast.success(`Renamed "${renamingCategory}" to "${nextName}" across ${affected.length} product${affected.length === 1 ? '' : 's'}`);
      setRenamingCategory(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to rename category');
    } finally {
      setRenamingBusy(false);
    }
  };

  const resetCouponForm = () => {
    setEditingCoupon(null);
    setCouponForm(emptyCouponForm);
  };

  const startCouponEdit = (coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discount_percentage: coupon.discount_percentage,
      expiry_date: coupon.expiry_date,
      active: Boolean(coupon.active),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCouponSubmit = async (event) => {
    event.preventDefault();
    const code = couponForm.code.trim().toUpperCase();
    const discount = Number(couponForm.discount_percentage);

    if (!code) {
      toast.error('Enter a coupon code');
      return;
    }
    if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
      toast.error('Enter a valid discount percentage (1-100)');
      return;
    }
    if (!couponForm.expiry_date) {
      toast.error('Choose an expiry date');
      return;
    }

    setSavingCoupon(true);
    try {
      if (editingCoupon) {
        await axios.put(`/api/admin/coupons/${editingCoupon.code}`, {
          discount_percentage: discount,
          expiry_date: couponForm.expiry_date,
          active: couponForm.active,
        }, { headers: getAuthHeaders() });
        toast.success('Coupon updated');
      } else {
        await axios.post('/api/admin/coupons', {
          code,
          discount_percentage: discount,
          expiry_date: couponForm.expiry_date,
          active: couponForm.active,
        }, { headers: getAuthHeaders() });
        toast.success('Coupon created');
      }
      resetCouponForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save coupon');
    } finally {
      setSavingCoupon(false);
    }
  };

  const performDeleteCoupon = async (code) => {
    try {
      await axios.delete(`/api/admin/coupons/${code}`, { headers: getAuthHeaders() });
      toast.success('Coupon deleted');
      if (editingCoupon?.code === code) resetCouponForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const performDeleteContact = async (contactId) => {
    try {
      await axios.delete(`/api/admin/contacts/${contactId}`, { headers: getAuthHeaders() });
      toast.success('Message deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const performDeleteReview = async (reviewId) => {
    try {
      await axios.delete(`/api/admin/reviews/${reviewId}`, { headers: getAuthHeaders() });
      toast.success('Review deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const handleConfirmedDelete = () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    setPendingDelete(null);
    if (type === 'product') performDeleteProduct(id);
    else if (type === 'coupon') performDeleteCoupon(id);
    else if (type === 'contact') performDeleteContact(id);
    else if (type === 'review') performDeleteReview(id);
  };

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    try {
      const response = await axios.put('/api/admin/settings', settingsForm, { headers: getAuthHeaders() });
      setSettingsForm({ ...emptySettingsForm, ...response.data });
      toast.success('Store settings updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const updateSettingsField = (field, value) => {
    setSettingsForm((current) => ({ ...current, [field]: value }));
  };

  const performRoleChange = async (userId, nextRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: nextRole }, { headers: getAuthHeaders() });
      toast.success(nextRole === 'admin' ? 'Promoted to admin' : 'Admin access revoked');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleConfirmedRoleChange = () => {
    if (!pendingRoleChange) return;
    const { id, nextRole } = pendingRoleChange;
    setPendingRoleChange(null);
    performRoleChange(id, nextRole);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
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

  const activeSection = navSections.find((section) => section.id === activeTab);

  return (
    <div className="flex min-h-screen bg-[#FDFBF7]" data-testid="admin-page">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-shrink-0 transform flex-col border-r border-[#E3DCCF] bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E3DCCF] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C25934]">Secure Admin</p>
            <p className="font-['Playfair_Display'] text-xl font-bold text-[#2D241E]">Bakery Panel</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-[#8A7E74] hover:bg-[#F3EFE6] lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeTab === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveTab(section.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-[#C25934] text-white' : 'text-[#5C4B40] hover:bg-[#F3EFE6]'
                }`}
                data-testid={`tab-${section.id}`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {section.label}
                </span>
                {section.id === 'messages' && contacts.length > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-[#C25934] text-white'}`}>
                    {contacts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#E3DCCF] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#FDFBF7] px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C25934] font-bold text-white">
              {(user.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#2D241E]">{user.name || 'Admin'}</p>
              <p className="truncate text-xs text-[#8A7E74]">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E3DCCF] px-4 py-2.5 text-sm font-semibold text-[#D94848] hover:bg-[#D94848]/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#E3DCCF] bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-[#E3DCCF] p-2 text-[#2D241E] hover:border-[#C25934] lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-['Playfair_Display'] text-xl font-bold text-[#2D241E] sm:text-2xl">
              {activeSection?.label || 'Dashboard'}
            </h1>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E3DCCF] bg-white px-3 py-2 text-sm font-semibold text-[#2D241E] hover:border-[#C25934] sm:px-4 sm:py-2.5"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Products', stats.total_products, Package, '#C25934'],
                  ['Orders', stats.total_orders, ShoppingCart, '#4A6B53'],
                  ['Customers', stats.total_users, Users, '#5B7C99'],
                  ['Revenue', formatCurrency(stats.total_revenue), DollarSign, '#B98A2F'],
                ].map(([label, value, Icon, color]) => (
                  <div key={label} className="rounded-2xl border border-[#E3DCCF] bg-white p-6">
                    <div className="mb-4 inline-flex rounded-xl p-3" style={{ backgroundColor: `${color}1A` }}>
                      <Icon size={26} style={{ color }} />
                    </div>
                    <p className="text-3xl font-bold text-[#2D241E]">{value}</p>
                    <p className="mt-1 text-sm text-[#5C4B40]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#E3DCCF] bg-white p-6">
                <h2 className="mb-4 font-['Playfair_Display'] text-xl font-bold text-[#2D241E]">Order Pipeline</h2>
                <div className="flex flex-wrap gap-3">
                  {orderStatuses.map((status) => (
                    <div key={status} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 ${STATUS_STYLES[status]}`}>
                      <span className="text-lg font-bold">{orderStatusCounts[status]}</span>
                      <span className="text-sm font-semibold capitalize">{status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <SectionCard
                  title="Recent Orders"
                  action={(
                    <button type="button" onClick={() => setActiveTab('orders')} className="text-sm font-semibold text-[#C25934] hover:underline">
                      View all
                    </button>
                  )}
                >
                  {recentOrders.length === 0 ? (
                    <EmptyState icon={ShoppingCart} title="No orders yet" description="New orders will show up here." />
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#FDFBF7] px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#2D241E]">#{order.order_number}</p>
                            <p className="truncate text-xs text-[#8A7E74]">{order.user_name}</p>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-3">
                            <span className="font-semibold text-[#C25934]">{formatCurrency(order.total)}</span>
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  title="Low Stock Alerts"
                  action={(
                    <button type="button" onClick={() => setActiveTab('products')} className="text-sm font-semibold text-[#C25934] hover:underline">
                      Manage
                    </button>
                  )}
                >
                  {lowStockProducts.length === 0 ? (
                    <EmptyState icon={Package} title="Stock levels look healthy" description={`Everything is above ${LOW_STOCK_THRESHOLD} units.`} />
                  ) : (
                    <div className="space-y-3">
                      {lowStockProducts.slice(0, 6).map((product) => (
                        <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#FDFBF7] px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <img src={product.image} alt={product.name} className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
                            <p className="truncate font-semibold text-[#2D241E]">{product.name}</p>
                          </div>
                          <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                            Number(product.stock) === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {Number(product.stock) === 0 ? 'Out of stock' : `${product.stock} left`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <form onSubmit={handleProductSubmit} className="rounded-2xl border border-[#E3DCCF] bg-white p-6">
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

              <div className="rounded-2xl border border-[#E3DCCF] bg-white">
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

                {filteredProducts.length === 0 ? (
                  <div className="p-6">
                    <EmptyState icon={Package} title="No products found" description="Try a different search or add a new product above." />
                  </div>
                ) : (
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
                        {filteredProducts.map((product) => {
                          const stockValue = Number(product.stock);
                          const stockBadge = stockValue === 0
                            ? { label: 'Out of stock', className: 'bg-red-50 text-red-700' }
                            : stockValue <= LOW_STOCK_THRESHOLD
                              ? { label: `${stockValue} (low)`, className: 'bg-amber-50 text-amber-700' }
                              : { label: stockValue, className: 'bg-emerald-50 text-emerald-700' };
                          return (
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
                              <td className="px-5 py-4">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${stockBadge.className}`}>
                                  {stockBadge.label}
                                </span>
                              </td>
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
                                    onClick={() => setPendingDelete({ type: 'product', id: product.id, label: product.name })}
                                    className="rounded-lg border border-[#E3DCCF] p-2 text-[#D94848] hover:bg-[#D94848]/10"
                                    title="Delete product"
                                    data-testid={`delete-product-${product.id}`}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div className="grid gap-4 rounded-2xl border border-[#E3DCCF] bg-white p-5 md:grid-cols-[1fr_220px]">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7E74]" size={18} />
                  <input
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                    className="w-full rounded-lg border border-[#E3DCCF] py-3 pl-10 pr-4 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    placeholder="Search by order #, name, or email"
                  />
                </label>
                <select
                  value={orderStatusFilter}
                  onChange={(event) => setOrderStatusFilter(event.target.value)}
                  className="rounded-lg border border-[#E3DCCF] bg-white px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                >
                  <option value="all">All statuses</option>
                  {orderStatuses.map((status) => (
                    <option key={status} value={status} className="capitalize">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {filteredOrders.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="No orders found" description="Try a different search or filter." />
              ) : (
                filteredOrders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  return (
                    <div key={order.id} className="rounded-2xl border border-[#E3DCCF] bg-white p-6" data-testid={`admin-order-${order.order_number}`}>
                      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D241E]">
                              Order #{order.order_number}
                            </h2>
                            <StatusBadge status={order.status} />
                          </div>
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
              <SectionCard title="Add Category">
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
              </SectionCard>

              <SectionCard title="Current Categories">
                {categoryOptions.length === 0 ? (
                  <EmptyState icon={Layers3} title="No categories yet" description="Add your first product to create one." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryOptions.map((category) => {
                      const count = products.filter((product) => product.category === category).length;
                      const isRenaming = renamingCategory === category;
                      return (
                        <div key={category} className="rounded-xl border border-[#E3DCCF] bg-[#FDFBF7] p-4">
                          {isRenaming ? (
                            <div className="space-y-2">
                              <input
                                autoFocus
                                value={renameDraft}
                                onChange={(event) => setRenameDraft(event.target.value)}
                                className="w-full rounded-lg border border-[#C25934] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C25934]/20"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={renamingBusy}
                                  onClick={commitRenameCategory}
                                  className="flex-1 rounded-lg bg-[#C25934] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#A84C2A] disabled:opacity-60"
                                >
                                  {renamingBusy ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRenamingCategory(null)}
                                  className="flex-1 rounded-lg border border-[#E3DCCF] bg-white px-3 py-1.5 text-xs font-semibold text-[#2D241E]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => startProductWithCategory(category)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <span className="block truncate font-semibold text-[#2D241E]">{category}</span>
                                <span className="text-sm text-[#8A7E74]">{count} product{count === 1 ? '' : 's'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => startRenameCategory(category)}
                                className="flex-shrink-0 rounded-lg border border-[#E3DCCF] bg-white p-2 text-[#5C4B40] hover:border-[#C25934] hover:text-[#C25934]"
                                title="Rename category"
                              >
                                <Edit3 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <form onSubmit={handleCouponSubmit} className="rounded-2xl border border-[#E3DCCF] bg-white p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#2D241E]">
                    {editingCoupon ? `Edit Coupon - ${editingCoupon.code}` : 'Create Coupon'}
                  </h2>
                  {editingCoupon && (
                    <button
                      type="button"
                      onClick={resetCouponForm}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#E3DCCF] px-4 py-2 text-sm font-semibold text-[#2D241E] hover:border-[#C25934]"
                    >
                      <X size={16} />
                      Cancel Edit
                    </button>
                  )}
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Code</span>
                    <input
                      value={couponForm.code}
                      disabled={Boolean(editingCoupon)}
                      onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                      className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 uppercase outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20 disabled:bg-[#F3EFE6] disabled:text-[#8A7E74]"
                      placeholder="WELCOME10"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Discount %</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={couponForm.discount_percentage}
                      onChange={(event) => setCouponForm((current) => ({ ...current, discount_percentage: event.target.value }))}
                      className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                      placeholder="10"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Expiry Date</span>
                    <input
                      type="date"
                      value={couponForm.expiry_date}
                      onChange={(event) => setCouponForm((current) => ({ ...current, expiry_date: event.target.value }))}
                      className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    />
                  </label>
                  <label className="flex items-center gap-3 self-end rounded-lg border border-[#E3DCCF] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={couponForm.active}
                      onChange={(event) => setCouponForm((current) => ({ ...current, active: event.target.checked }))}
                      className="h-4 w-4 rounded border-[#E3DCCF] text-[#C25934] focus:ring-[#C25934]"
                    />
                    <span className="text-sm font-semibold text-[#2D241E]">Active</span>
                  </label>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingCoupon}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#C25934] px-6 py-3 font-semibold text-white hover:bg-[#A84C2A] disabled:cursor-not-allowed disabled:bg-[#C25934]/60"
                  >
                    <Save size={18} />
                    {savingCoupon ? 'Saving...' : editingCoupon ? 'Save Coupon' : 'Create Coupon'}
                  </button>
                </div>
              </form>

              <SectionCard title="All Coupons">
                {coupons.length === 0 ? (
                  <EmptyState icon={Ticket} title="No coupons yet" description="Create your first discount code above." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead className="bg-[#F3EFE6]">
                        <tr>
                          <th className="rounded-l-lg px-4 py-3 text-left text-sm font-semibold text-[#2D241E]">Code</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2D241E]">Discount</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2D241E]">Expiry</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2D241E]">Status</th>
                          <th className="rounded-r-lg px-4 py-3 text-right text-sm font-semibold text-[#2D241E]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3DCCF]">
                        {coupons.map((coupon) => (
                          <tr key={coupon.code} className="hover:bg-[#FDFBF7]">
                            <td className="px-4 py-3 font-mono font-semibold text-[#2D241E]">{coupon.code}</td>
                            <td className="px-4 py-3 text-[#C25934] font-semibold">{coupon.discount_percentage}%</td>
                            <td className="px-4 py-3 text-[#5C4B40]">{formatDate(coupon.expiry_date)}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${coupon.active ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F3EFE6] text-[#8A7E74]'}`}>
                                {coupon.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => startCouponEdit(coupon)}
                                  className="rounded-lg border border-[#E3DCCF] p-2 text-[#2D241E] hover:border-[#C25934] hover:text-[#C25934]"
                                  title="Edit coupon"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDelete({ type: 'coupon', id: coupon.code, label: coupon.code })}
                                  className="rounded-lg border border-[#E3DCCF] p-2 text-[#D94848] hover:bg-[#D94848]/10"
                                  title="Delete coupon"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {activeTab === 'customers' && (
            <SectionCard title={`Customers (${users.length})`}>
              {users.length === 0 ? (
                <EmptyState icon={Users} title="No customers yet" description="Registered customers will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead className="bg-[#F3EFE6]">
                      <tr>
                        <th className="rounded-l-lg px-4 py-3 text-left text-sm font-semibold text-[#2D241E]">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#2D241E]">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#2D241E]">Orders</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#2D241E]">Spent</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#2D241E]">Joined</th>
                        <th className="rounded-r-lg px-4 py-3 text-right text-sm font-semibold text-[#2D241E]">Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3DCCF]">
                      {users.map((customer) => {
                        const isSelf = customer.id === user.id;
                        const isPrimaryAdmin = customer.id === 'fallback-admin';
                        return (
                          <tr key={customer.id} className="hover:bg-[#FDFBF7]">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {customer.picture ? (
                                  <img src={customer.picture} alt={customer.name} className="h-9 w-9 rounded-full object-cover" />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3EFE6] font-bold text-[#C25934]">
                                    {(customer.name || '?').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-[#2D241E]">{customer.name}</p>
                                  <p className="truncate text-xs text-[#8A7E74]">{customer.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                                customer.role === 'admin' ? 'bg-[#C25934]/10 text-[#C25934]' : 'bg-[#F3EFE6] text-[#5C4B40]'
                              }`}>
                                {customer.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#2D241E]">{orderCountByUser[customer.id] || 0}</td>
                            <td className="px-4 py-3 font-semibold text-[#C25934]">{formatCurrency(revenueByUser[customer.id] || 0)}</td>
                            <td className="px-4 py-3 text-[#5C4B40]">{formatDate(customer.created_at)}</td>
                            <td className="px-4 py-3 text-right">
                              {isSelf ? (
                                <span className="text-xs text-[#8A7E74]">You</span>
                              ) : isPrimaryAdmin && customer.role === 'admin' ? (
                                <span className="text-xs text-[#8A7E74]">Primary admin</span>
                              ) : customer.role === 'admin' ? (
                                <button
                                  type="button"
                                  onClick={() => setPendingRoleChange({ id: customer.id, name: customer.name, nextRole: 'customer' })}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3DCCF] px-3 py-1.5 text-xs font-semibold text-[#D94848] hover:bg-[#D94848]/10"
                                  title="Revoke admin access"
                                >
                                  <ShieldOff size={14} />
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPendingRoleChange({ id: customer.id, name: customer.name, nextRole: 'admin' })}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3DCCF] px-3 py-1.5 text-xs font-semibold text-[#2D241E] hover:border-[#C25934] hover:text-[#C25934]"
                                  title="Promote to admin"
                                >
                                  <ShieldCheck size={14} />
                                  Promote
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          )}

          {activeTab === 'reviews' && (
            <SectionCard title={`Product Reviews (${reviews.length})`}>
              {reviews.length === 0 ? (
                <EmptyState icon={Star} title="No reviews yet" description="Customer reviews will appear here." />
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-[#E3DCCF] bg-[#FDFBF7] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#2D241E]">
                            {productNameById[review.product_id] || 'Unknown product'}
                          </p>
                          <div className="mt-1 flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                size={14}
                                className={index < review.rating ? 'fill-[#B98A2F] text-[#B98A2F]' : 'text-[#E3DCCF]'}
                              />
                            ))}
                            <span className="ml-2 text-xs text-[#8A7E74]">by {review.user_name}</span>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-3">
                          <span className="text-xs text-[#8A7E74]">{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</span>
                          <button
                            type="button"
                            onClick={() => setPendingDelete({ type: 'review', id: review.id, label: `${review.user_name}'s review` })}
                            className="rounded-lg border border-[#E3DCCF] p-2 text-[#D94848] hover:bg-[#D94848]/10"
                            title="Delete review"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm text-[#5C4B40]">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              {contacts.length === 0 ? (
                <EmptyState icon={Mail} title="No messages yet" description="Contact form submissions will appear here." />
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} className="rounded-2xl border border-[#E3DCCF] bg-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#2D241E]">{contact.subject}</p>
                        <p className="mt-1 text-sm text-[#5C4B40]">{contact.name} - {contact.email}</p>
                        <p className="text-xs text-[#8A7E74]">{contact.created_at ? new Date(contact.created_at).toLocaleString() : ''}</p>
                      </div>
                      <div className="flex flex-shrink-0 gap-2">
                        <a
                          href={`mailto:${contact.email}`}
                          className="rounded-lg border border-[#E3DCCF] p-2 text-[#2D241E] hover:border-[#C25934] hover:text-[#C25934]"
                          title="Reply by email"
                        >
                          <Mail size={16} />
                        </a>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ type: 'contact', id: contact.id, label: contact.subject })}
                          className="rounded-lg border border-[#E3DCCF] p-2 text-[#D94848] hover:bg-[#D94848]/10"
                          title="Delete message"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap rounded-lg bg-[#FDFBF7] p-4 text-sm text-[#5C4B40]">{contact.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'banners' && <AdminBannerManager />}

          {activeTab === 'offer-media' && <AdminOfferMediaManager />}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <SectionCard title="Revenue - Last 14 Days">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={revenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E3DCCF" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5C4B40' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#5C4B40' }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, borderColor: '#E3DCCF' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#C25934" strokeWidth={2.5} dot={false} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <div className="grid gap-6 lg:grid-cols-2">
                <SectionCard title="Top Selling Products">
                  {topProducts.length === 0 ? (
                    <EmptyState icon={Package} title="No sales yet" description="Best sellers will show up once orders come in." />
                  ) : (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E3DCCF" />
                          <XAxis type="number" tick={{ fontSize: 12, fill: '#5C4B40' }} />
                          <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#5C4B40' }} />
                          <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, borderColor: '#E3DCCF' }} />
                          <Bar dataKey="revenue" fill="#C25934" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Revenue by Category">
                  {categoryRevenue.length === 0 ? (
                    <EmptyState icon={Layers3} title="No sales yet" description="Category breakdown will show up once orders come in." />
                  ) : (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryRevenue} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                            {categoryRevenue.map((entry, index) => (
                              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, borderColor: '#E3DCCF' }} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && <AnalyticsDashboard />}

          {activeTab === 'settings' && (
            <SectionCard title="Store Settings">
              <form onSubmit={handleSettingsSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Store Name</span>
                    <input
                      value={settingsForm.store_name}
                      onChange={(event) => updateSettingsField('store_name', event.target.value)}
                      className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Support Email</span>
                    <input
                      type="email"
                      value={settingsForm.support_email}
                      onChange={(event) => updateSettingsField('support_email', event.target.value)}
                      className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Support Phone</span>
                    <input
                      value={settingsForm.support_phone}
                      onChange={(event) => updateSettingsField('support_phone', event.target.value)}
                      className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Address</span>
                    <input
                      value={settingsForm.address}
                      onChange={(event) => updateSettingsField('address', event.target.value)}
                      className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Tagline</span>
                    <textarea
                      value={settingsForm.tagline}
                      onChange={(event) => updateSettingsField('tagline', event.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                    />
                  </label>
                </div>

                <div className="border-t border-[#E3DCCF] pt-5">
                  <h3 className="mb-4 font-['Playfair_Display'] text-lg font-bold text-[#2D241E]">Social Links</h3>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Facebook URL</span>
                      <input
                        value={settingsForm.facebook_url}
                        onChange={(event) => updateSettingsField('facebook_url', event.target.value)}
                        placeholder="https://facebook.com/..."
                        className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Instagram URL</span>
                      <input
                        value={settingsForm.instagram_url}
                        onChange={(event) => updateSettingsField('instagram_url', event.target.value)}
                        placeholder="https://instagram.com/..."
                        className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#2D241E]">Twitter URL</span>
                      <input
                        value={settingsForm.twitter_url}
                        onChange={(event) => updateSettingsField('twitter_url', event.target.value)}
                        placeholder="https://twitter.com/..."
                        className="w-full rounded-lg border border-[#E3DCCF] px-4 py-3 outline-none focus:border-[#C25934] focus:ring-2 focus:ring-[#C25934]/20"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#C25934] px-6 py-3 font-semibold text-white hover:bg-[#A84C2A] disabled:cursor-not-allowed disabled:bg-[#C25934]/60"
                  >
                    <Save size={18} />
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}
        </main>
      </div>

      <AdminConfirmDialog
        open={Boolean(pendingRoleChange)}
        onOpenChange={(open) => { if (!open) setPendingRoleChange(null); }}
        title={pendingRoleChange?.nextRole === 'admin' ? 'Promote to admin?' : 'Revoke admin access?'}
        description={
          pendingRoleChange?.nextRole === 'admin'
            ? `"${pendingRoleChange?.name}" will gain full access to this admin panel.`
            : `"${pendingRoleChange?.name}" will lose admin access and become a regular customer.`
        }
        confirmLabel={pendingRoleChange?.nextRole === 'admin' ? 'Promote' : 'Revoke'}
        destructive={pendingRoleChange?.nextRole !== 'admin'}
        onConfirm={handleConfirmedRoleChange}
      />

      <AdminConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title={
          pendingDelete?.type === 'product' ? 'Delete this product?'
            : pendingDelete?.type === 'coupon' ? 'Delete this coupon?'
            : pendingDelete?.type === 'review' ? 'Delete this review?'
            : 'Delete this message?'
        }
        description={`"${pendingDelete?.label}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmedDelete}
      />
    </div>
  );
};
