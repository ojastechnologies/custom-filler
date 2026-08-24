'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { fetchProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '@/services/productsService';
import { fetchDeals, Deal } from '@/services/dealService';
import { fetchOrders, Order } from '@/services/ordersService';
import ImageUploader from '@/components/admin/ImageUploader';
import DealManagement from '@/components/admin/DealManagement';
import { ProductType } from '@/types/product';
import { supabase } from '@/lib/supabaseClient';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

// Service categories dropdown options
const SERVICE_CATEGORIES = [
  { name: '1 Inch Opening Contract Filling', path: 'services/1-inch-filling' },
  { name: '20 mm Opening Contract Aerosol Filling', path: 'services/20mm-filling' },
  { name: 'NON FLAMMABLE PROPELLANTS', path: 'services/non-flammable-propellant' },
  { name: 'LASER CRYOGEN', path: 'envirolase-laser-cryogen-coolant' }
];

type Toast = { message: string; tone: 'success' | 'error' } | null;

function formatMoney(amount: number | null | undefined, currency?: string | null) {
  const value = typeof amount === 'number' ? amount : 0;
  return `$${value.toFixed(2)}${currency ? ` ${currency.toUpperCase()}` : ''}`;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null); // data-fetch errors
  const [formError, setFormError] = useState<string | null>(null); // form validation/save errors
  const [toast, setToast] = useState<Toast>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'deals'>('products');

  // For product form
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState<ProductType & { deal_id?: string }>({
    id: '',
    title: '',
    description: '',
    price: 0,
    image: '',
    category: '',
    quantity: 1,
    about_url: '',
    clientpathurl: '',
    deal_id: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
  }>({
    isOpen: false,
    productId: '',
    productName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const loadDeals = async () => {
      if (isAdmin) {
        try {
          const dealsData = await fetchDeals();
          setDeals(dealsData.filter(deal => deal.is_active));
        } catch (err) {
          console.error('Error loading deals:', err);
        }
      }
    };
    loadDeals();
  }, [isAdmin]);

  // Recent orders for the admin overview strip
  const loadOrders = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoadingOrders(true);
      const data = await fetchOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && isAdmin) loadOrders();
  }, [loading, isAdmin, loadOrders]);

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.refresh_token');
          localStorage.removeItem('supabase.auth.access_token');
        }
        router.push('/auth/enter-portal-9f3b2');
      });
    }
  }, [user, loading, router]);

  // Robust session sync: wait for both Supabase and AuthContext to resolve before redirecting or fetching
  useEffect(() => {
    if (loading) return;
    supabase.auth.getSession().then(({ data }) => {
      const supabaseSession = !!data?.session;
      if (!user && !supabaseSession) {
        router.push('/');
      } else if (!user && supabaseSession) {
        window.location.reload();
      }
    });
  }, [user, loading, router]);

  // Fetch products with timeout and retry
  const fetchProductsWithTimeout = useCallback(async (timeoutMs = 8000) => {
    return Promise.race([
      fetchProducts(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out. Please try again.')), timeoutMs))
    ]);
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const data = await fetchProductsWithTimeout();
      if (Array.isArray(data)) {
        setProducts(data as ProductType[]);
        setError(null);
      } else {
        throw new Error('Invalid product data received');
      }
    } catch (err: unknown) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message || 'Failed to load products' : 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  }, [fetchProductsWithTimeout]);

  useEffect(() => {
    if (!loading && user && activeTab === 'products') {
      const checkAndLoadProducts = async () => {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          loadProducts();
        } else {
          setError('No active session. Please log in again.');
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      };
      checkAndLoadProducts();
    }
  }, [user, loading, loadProducts, activeTab, router]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image selection
  const handleImageSelected = (imageUrl: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }));
    setSelectedFile(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title || formData.title.trim() === '') {
      setFormError('Product title is required.');
      return;
    }

    if (!formData.price || formData.price <= 0) {
      setFormError('Product price must be greater than 0.');
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl = formData.image;
      if (selectedFile) {
        imageUrl = await uploadProductImage(selectedFile);
      }
      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          image: imageUrl,
          category: formData.category,
          about_url: formData.about_url,
          clientpathurl: formData.clientpathurl,
          deal_id: formData.deal_id,
          imageFile: selectedFile || undefined,
        });

        setProducts((prev) =>
          prev.map((product) =>
            product.id === editingProduct.id ? result : product
          )
        );
        setToast({ message: `Updated “${result.title}”`, tone: 'success' });
      } else {
        const result = await createProduct({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          image: imageUrl,
          imageFile: selectedFile || undefined,
          category: formData.category,
          about_url: formData.about_url,
          clientpathurl: formData.clientpathurl,
          deal_id: formData.deal_id,
        });
        setProducts([...products, { ...result }]);
        setToast({ message: `Added “${result.title}”`, tone: 'success' });
      }

      await loadProducts();
      resetForm();
    } catch (err: unknown) {
      console.error('Error saving product:', err);
      setFormError(err instanceof Error ? err.message || 'Failed to save product' : 'Failed to save product');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle product edit
  const handleEdit = (product: ProductType) => {
    if (!isAdmin) return;

    setEditingProduct(product);
    setFormData({
      ...product,
      deal_id: product.deal_id || ''
    });
    setSelectedFile(null);
    setFormError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle product delete - open dialog
  const handleDelete = (product: ProductType) => {
    if (!isAdmin) return;

    setDeleteDialog({
      isOpen: true,
      productId: product.id,
      productName: product.title
    });
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteDialog.productId) return;

    try {
      setIsDeleting(true);
      await deleteProduct(deleteDialog.productId);
      setProducts(products.filter(product => product.id !== deleteDialog.productId));
      setToast({ message: `Deleted “${deleteDialog.productName}”`, tone: 'success' });

      setDeleteDialog({
        isOpen: false,
        productId: '',
        productName: ''
      });
    } catch (err: unknown) {
      console.error('Error deleting product:', err);
      setToast({
        message: err instanceof Error ? err.message || 'Failed to delete product' : 'Failed to delete product',
        tone: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Close delete dialog
  const closeDeleteDialog = () => {
    if (isDeleting) return; // Prevent closing while deleting

    setDeleteDialog({
      isOpen: false,
      productId: '',
      productName: ''
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      price: 0,
      image: '',
      category: '',
      quantity: 1,
      about_url: '',
      clientpathurl: '',
      deal_id: ''
    });
    setEditingProduct(null);
    setSelectedFile(null);
    setFormError(null);
    setShowForm(false);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 min-h-screen" style={{ background: 'var(--bg)' }}>
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto py-10 space-y-6" aria-busy="true">
              <div className="h-9 w-48 rounded animate-pulse" style={{ background: 'var(--surface)' }} />
              <div className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const inputClasses = "w-full px-3 py-2 rounded-md border text-sm bg-[var(--raised)] text-[var(--fg)] border-[var(--line)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)] focus:ring-opacity-30 transition-colors";
  const labelClasses = "block text-xs font-semibold uppercase tracking-wide mb-1.5 text-[var(--muted)]";

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">

            {/* Page header */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pt-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--accent)' }}>
                  Admin Portal
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--fg)]">Dashboard</h1>
                <p className="text-sm mt-1 text-[var(--muted)]">{user.email}</p>
              </div>
              <a
                href="/"
                className="text-sm font-medium underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--fg)] transition-all"
                style={{ color: 'var(--muted)' }}
              >
                View storefront ↗
              </a>
            </div>

            {/* Recent orders */}
            {isAdmin && (
              <section aria-label="Recent orders" className="mb-10 rounded-xl border bg-[var(--raised)]" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <h2 className="text-sm font-semibold text-[var(--fg)]">
                    Recent orders
                    {!loadingOrders && pendingOrders > 0 && (
                      <span
                        className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold align-middle"
                        style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}
                      >
                        {pendingOrders} pending
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={() => router.push('/dashboard/orders')}
                    className="text-sm font-medium hover:underline underline-offset-4"
                    style={{ color: 'var(--accent)' }}
                  >
                    Manage orders →
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="px-5 pb-5 space-y-2" aria-busy="true">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="h-9 rounded-md animate-pulse" style={{ background: 'var(--surface)' }} />
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <p className="px-5 pb-5 text-sm text-[var(--muted)]">
                    No orders yet. New orders appear here as soon as they are placed.
                  </p>
                ) : (
                  <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
                    {recentOrders.map((order) => {
                      const isPending = order.status === 'pending';
                      return (
                        <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-[13px] font-medium text-[var(--fg)] truncate">
                              #{order.order_number}
                            </span>
                            <span className="text-[13px] text-[var(--muted)] truncate hidden sm:inline">
                              {order.customer_name || order.customer_email}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-[13px] tabular-nums font-medium text-[var(--fg)]">
                              {formatMoney(order.total_amount, order.currency)}
                            </span>
                            <span className="text-xs text-[var(--muted)] w-12 text-right">{formatDate(order.created_at)}</span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                isPending
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {/* Tab Navigation */}
            {isAdmin && (
              <div className="mb-6 border-b" style={{ borderColor: 'var(--line)' }}>
                <nav className="flex space-x-6" aria-label="Dashboard sections">
                  {(['products', 'deals'] as const).map((tab) => (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={activeTab === tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2.5 px-1 -mb-px border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab
                          ? 'text-[var(--fg)]'
                          : 'border-transparent text-[var(--muted)] hover:text-[var(--fg)]'
                      }`}
                      style={activeTab === tab ? { borderColor: 'var(--accent)' } : undefined}
                    >
                      {tab === 'products' ? 'Products' : 'Deals & Promotions'}
                      <span className="ml-1.5 text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                        {tab === 'products' ? products.length : deals.length}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'products' ? (
              <>
                {/* Product Form for Admins */}
                {isAdmin && showForm && (
                  <section aria-label="Product form" className="mb-8 rounded-xl border bg-[var(--raised)]" style={{ borderColor: 'var(--line)' }}>
                    <div className="px-6 pt-5 pb-1">
                      <h2 className="text-lg font-semibold text-[var(--fg)]">
                        {editingProduct ? 'Edit product' : 'Add new product'}
                      </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 pt-4">
                      {formError && (
                        <div role="alert" className="mb-5 rounded-md border px-4 py-3 text-sm"
                          style={{ borderColor: '#f2c4c4', background: 'rgba(180,35,24,0.06)', color: '#b42318' }}>
                          {formError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div>
                          <label htmlFor="name" className={labelClasses}>
                            Product name <span style={{ color: 'var(--accent)' }}>*</span>
                          </label>
                          <input
                            id="name"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={inputClasses}
                            placeholder="e.g. EnviroLase Laser Cryogen – 250ml"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="unit_price" className={labelClasses}>
                            Price <span style={{ color: 'var(--accent)' }}>*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">$</span>
                            <input
                              id="unit_price"
                              name="price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.price}
                              onChange={handleInputChange}
                              className={`${inputClasses} pl-7`}
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div>
                          <label htmlFor="clientpathurl" className={labelClasses}>
                            Service category
                          </label>
                          <select
                            id="clientpathurl"
                            name="clientpathurl"
                            value={formData.clientpathurl}
                            onChange={handleInputChange}
                            className={inputClasses}
                          >
                            <option value="">Select a service category</option>
                            {SERVICE_CATEGORIES.map((category) => (
                              <option key={category.path} value={category.path}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="deal_id" className={labelClasses}>
                            Associated deal
                          </label>
                          <select
                            id="deal_id"
                            name="deal_id"
                            value={formData.deal_id || ''}
                            onChange={handleInputChange}
                            className={inputClasses}
                          >
                            <option value="">No deal</option>
                            {deals.map((deal) => (
                              <option key={deal.id} value={deal.id}>
                                {deal.code} · {deal.discount_type === 'percentage'
                                  ? `${deal.discount_value}% off`
                                  : `$${deal.discount_value} off`}
                              </option>
                            ))}
                          </select>
                          {formData.deal_id && (() => {
                            const selectedDeal = deals.find(d => d.id === formData.deal_id);
                            return selectedDeal ? (
                              <p className="mt-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                                {selectedDeal.code}: {selectedDeal.description}
                              </p>
                            ) : null;
                          })()}
                        </div>
                      </div>

                      <div className="mb-5">
                        <label htmlFor="description" className={labelClasses}>
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={formData.description}
                          onChange={handleInputChange}
                          className={inputClasses}
                        />
                      </div>

                      <div className="mb-6">
                        <label className={labelClasses}>
                          Product image
                        </label>
                        <ImageUploader
                          currentImage={formData.image || ''}
                          onImageSelected={handleImageSelected}
                        />
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Recommended size: 800×800px, max 2MB.
                        </p>
                      </div>

                      <div className="flex justify-end space-x-3 pt-1 border-t" style={{ borderColor: 'var(--line)' }}>
                        <Button variant="outline" onClick={resetForm} type="button">
                          Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={isUploading}>
                          {isUploading ? 'Saving…' : editingProduct ? 'Update product' : 'Add product'}
                        </Button>
                      </div>
                    </form>
                  </section>
                )}

                {/* Data-fetch error */}
                {error && (
                  <div role="alert" className="mb-6 rounded-xl border px-5 py-4 bg-[var(--raised)]" style={{ borderColor: '#f2c4c4' }}>
                    <p className="text-sm font-medium" style={{ color: '#b42318' }}>Couldn’t load products</p>
                    <p className="text-sm mt-0.5 text-[var(--muted)]">{error}</p>
                    <div className="flex items-center space-x-3 mt-2.5">
                      <button onClick={() => setError(null)} className="text-sm underline underline-offset-4 text-[var(--muted)]">
                        Dismiss
                      </button>
                      <button onClick={loadProducts} className="text-sm font-semibold underline underline-offset-4" style={{ color: 'var(--accent)' }}>
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Products List */}
                <section aria-label="Products">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-[var(--fg)]">Products</h2>
                    {isAdmin && (
                      <Button
                        variant={showForm ? 'outline' : 'primary'}
                        onClick={() => (showForm ? resetForm() : setShowForm(true))}
                      >
                        {showForm ? 'Close form' : 'Add product'}
                      </Button>
                    )}
                  </div>

                  {loadingProducts ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="rounded-xl border overflow-hidden bg-[var(--raised)]" style={{ borderColor: 'var(--line)' }}>
                          <div className="h-44 animate-pulse" style={{ background: 'var(--surface)' }} />
                          <div className="p-5 space-y-3">
                            <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'var(--surface)' }} />
                            <div className="h-3 w-1/4 rounded animate-pulse" style={{ background: 'var(--surface)' }} />
                            <div className="h-3 w-full rounded animate-pulse" style={{ background: 'var(--surface)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-14 rounded-xl border border-dashed" style={{ borderColor: 'var(--line)' }}>
                      <p className="text-[var(--fg)] font-medium">No products yet</p>
                      <p className="text-sm mt-1 text-[var(--muted)]">
                        Add your first product so customers can order it.
                      </p>
                      {isAdmin && (
                        <div className="mt-4">
                          <Button variant="primary" onClick={() => setShowForm(true)}>Add product</Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {products.map((product) => (
                        <article
                          key={product.id}
                          className="group rounded-xl border overflow-hidden flex flex-col h-full bg-[var(--raised)] transition-shadow hover:shadow-[0_4px_16px_rgba(23,28,38,0.08)]"
                          style={{ borderColor: 'var(--line)' }}
                        >
                          {product.image && (
                            <div className="relative w-full h-44 flex-shrink-0">
                              <Image
                                src={product.image}
                                alt={product.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>
                          )}

                          <div className="flex flex-col flex-1 p-5">
                            <div className="flex-1">
                              <h3 className="text-[15px] font-semibold leading-snug mb-1.5 line-clamp-2 text-[var(--fg)]">{product.title}</h3>
                              <p className="text-[17px] font-bold tabular-nums mb-3 text-[var(--fg)]">
                                ${product.price.toFixed(2)}
                              </p>

                              {product.deal ? (
                                <div className="mb-3">
                                  <span
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                    style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}
                                  >
                                    {product.deal.code} · {product.deal.discount_type === 'percentage'
                                      ? `${product.deal.discount_value}% off`
                                      : `$${product.deal.discount_value} off`}
                                  </span>
                                  {product.deal.description && (
                                    <p className="text-xs mt-1.5 line-clamp-1 text-[var(--muted)]">
                                      {product.deal.description}
                                    </p>
                                  )}
                                </div>
                              ) : null}

                              {product.description && (
                                <p className="text-[13px] leading-relaxed line-clamp-2 text-[var(--muted)]">
                                  {product.description}
                                </p>
                              )}
                            </div>

                            <div className="flex-shrink-0 pt-4 mt-4 border-t flex gap-2" style={{ borderColor: 'var(--line)' }}>
                              <button
                                onClick={() => handleEdit(product)}
                                className="flex-1 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors hover:bg-[var(--accent-tint)] hover:border-[var(--accent)]"
                                style={{ borderColor: 'var(--line)', color: 'var(--fg)' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product)}
                                className="flex-1 px-3 py-1.5 rounded-md border text-sm font-medium text-red-700 dark:text-red-300 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800"
                                style={{ borderColor: 'var(--line)' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : (
              isAdmin && <DealManagement />
            )}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg bg-[var(--raised)]"
          style={{
            borderColor: toast.tone === 'success' ? 'var(--line)' : '#f2c4c4',
            color: toast.tone === 'success' ? 'var(--fg)' : '#b42318',
          }}
        >
          {toast.message}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteDialog.productName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      <Footer />
    </>
  );
}
