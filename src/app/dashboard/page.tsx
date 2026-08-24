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
  return `$${value.toFixed(2)}`;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
            <div className="max-w-[1080px] mx-auto py-10 space-y-5" aria-busy="true">
              <div className="h-10 w-56 rounded-md animate-pulse" style={{ background: 'var(--surface)' }} />
              <div className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-72 rounded-[10px] animate-pulse" style={{ background: 'var(--surface)' }} />
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

  const initial = (user.email || '?').charAt(0).toUpperCase();

  const inputClasses = "w-full h-10 px-3 rounded-md border text-sm bg-[var(--raised)] text-[var(--fg)] border-[var(--line)] placeholder:text-[var(--muted)]/60 focus:outline-none focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]/30 transition-[color,border-color,box-shadow] duration-150";
  const groupLabelClasses = "text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]";

  return (
    <>
      <Header />
      <main className="pt-20 pb-20 min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-[1080px] mx-auto">

            {/* Workspace header */}
            <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pt-8 pb-7">
              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  className="h-11 w-11 rounded-full flex items-center justify-center text-base font-bold select-none"
                  style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}
                >
                  {initial}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>
                    Admin portal
                  </p>
                  <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-[var(--fg)]">Dashboard</h1>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <a
                  href="/"
                  className="text-sm font-medium underline decoration-[var(--line)] underline-offset-4 transition-colors hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 rounded"
                  style={{ color: 'var(--muted)' }}
                >
                  View storefront ↗
                </a>
                {isAdmin && activeTab === 'products' && !showForm && (
                  <Button variant="primary" onClick={() => setShowForm(true)}>
                    Add product
                  </Button>
                )}
              </div>
            </header>

            {/* Recent orders */}
            {isAdmin && (
              <section aria-label="Recent orders" className="mb-9 rounded-xl border overflow-hidden bg-[var(--raised)]" style={{ borderColor: 'var(--line)' }}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4 pb-3">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-sm font-semibold text-[var(--fg)]">Recent orders</h2>
                    {!loadingOrders && orders.length > 0 && (
                      <p className="text-xs text-[var(--muted)]">
                        {orders.length} total{pendingOrders > 0 && (
                          <> · <span className="font-semibold" style={{ color: 'var(--accent)' }}>{pendingOrders} awaiting payment</span></>
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/orders')}
                    className="text-[13px] font-medium hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 rounded"
                    style={{ color: 'var(--accent)' }}
                  >
                    All orders →
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="px-5 pb-5 space-y-2" aria-busy="true">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="h-10 rounded-md animate-pulse" style={{ background: 'var(--surface)' }} />
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="px-5 pb-5">
                    <div className="rounded-lg border border-dashed px-4 py-6 text-center" style={{ borderColor: 'var(--line)' }}>
                      <p className="text-sm font-medium text-[var(--fg)]">No orders yet</p>
                      <p className="text-xs mt-1 text-[var(--muted)]">New orders appear here the moment they are placed.</p>
                    </div>
                  </div>
                ) : (
                  <div role="table" aria-label="Latest five orders" className="pb-1">
                    {/* Column headers */}
                    <div
                      role="row"
                      className={`hidden sm:grid gap-4 px-5 pb-2 ${'grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto_auto]'}`}
                    >
                      {['Order', 'Customer', 'Total', 'Placed', 'Status'].map(h => (
                        <span key={h} role="columnheader" className={`${h === 'Total' || h === 'Placed' ? 'text-right' : ''} ${h === 'Status' ? 'text-center pr-6' : ''} text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]`}>
                          {h}
                        </span>
                      ))}
                    </div>

                    <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
                      {recentOrders.map((order) => {
                        const isPending = order.status === 'pending';
                        return (
                          <li key={order.id} role="row">
                            <button
                              onClick={() => router.push('/dashboard/orders')}
                              className="w-full sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto_auto] gap-4 items-center text-left px-5 py-2.5 transition-colors duration-150 hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]/50"
                              aria-label={`Order ${order.order_number}, view all orders`}
                            >
                              <span role="cell" className="font-mono text-[13px] font-medium text-[var(--fg)] truncate">
                                #{order.order_number}
                              </span>
                              <span role="cell" className="hidden sm:block text-[13px] truncate text-[var(--muted)]">
                                {order.customer_name || order.customer_email || '—'}
                              </span>
                              <span role="cell" className="hidden sm:block text-[13px] tabular-nums font-semibold text-right text-[var(--fg)]">
                                {formatMoney(order.total_amount)}
                              </span>
                              <span role="cell" className="hidden lg:block text-xs tabular-nums text-right text-[var(--muted)] whitespace-nowrap">
                                {formatDate(order.created_at)}
                              </span>
                              <span role="cell" className="flex justify-start sm:justify-end">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    isPending
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </span>
                              {/* Compact meta for mobile */}
                              <span role="cell" className="sm:hidden w-full flex items-center justify-between mt-1 -mb-0.5">
                                <span className="text-xs tabular-nums font-semibold text-[var(--fg)]">{formatMoney(order.total_amount)}</span>
                                <span className="text-xs text-[var(--muted)]">{formatDate(order.created_at)}</span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Tabs */}
            {isAdmin && (
              <div className="mb-7 border-b" style={{ borderColor: 'var(--line)' }}>
                <nav className="flex gap-6" aria-label="Dashboard sections">
                  {(['products', 'deals'] as const).map((tab) => {
                    const count = tab === 'products' ? products.length : deals.length;
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(tab)}
                        className={`relative py-2.5 px-0.5 -mb-px border-b-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 rounded-sm ${
                          isActive
                            ? 'text-[var(--fg)]'
                            : 'border-transparent text-[var(--muted)] hover:text-[var(--fg)]'
                        }`}
                        style={isActive ? { borderColor: 'var(--accent)' } : undefined}
                      >
                        {tab === 'products' ? 'Products' : 'Deals & Promotions'}
                        <span
                          className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full text-[11px] font-semibold tabular-nums transition-colors duration-150 ${
                            isActive ? '' : 'text-[var(--muted)]'
                          }`}
                          style={isActive ? { background: 'var(--accent-tint)', color: 'var(--accent)' } : undefined}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'products' ? (
              <>
                {/* Data-fetch error */}
                {error && !showForm && (
                  <div role="alert" className="mb-6 rounded-xl border px-5 py-4 bg-[var(--raised)]" style={{ borderColor: '#f2c4c4' }}>
                    <p className="text-sm font-medium" style={{ color: '#b42318' }}>Couldn’t load products</p>
                    <p className="text-sm mt-0.5 text-[var(--muted)]">{error}</p>
                    <div className="flex items-center gap-4 mt-2.5">
                      <button onClick={() => setError(null)} className="text-sm underline underline-offset-4 text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 rounded">
                        Dismiss
                      </button>
                      <button onClick={loadProducts} className="text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40 rounded" style={{ color: 'var(--accent)' }}>
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Product Form */}
                {isAdmin && showForm && (
                  <section aria-label="Product form" className="mb-10 rounded-xl border bg-[var(--raised)]" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
                      <h2 className="text-[15px] font-semibold text-[var(--fg)]">
                        {editingProduct ? 'Edit product' : 'New product'}
                      </h2>
                      <button
                        onClick={resetForm}
                        aria-label="Close form"
                        className="h-8 w-8 -mr-2 rounded-md flex items-center justify-center text-lg leading-none text-[var(--muted)] transition-colors duration-150 hover:bg-[var(--surface)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                      {formError && (
                        <div role="alert" className="mx-6 mt-5 rounded-md border px-4 py-3 text-sm"
                          style={{ borderColor: '#f2c4c4', background: 'rgba(180,35,24,0.06)', color: '#b42318' }}>
                          {formError}
                        </div>
                      )}

                      {/* Details group */}
                      <fieldset className="px-6 pt-5">
                        <legend className={groupLabelClasses}>Details</legend>
                        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 mt-2.5">
                          <div>
                            <label htmlFor="name" className="block text-[13px] font-medium mb-1.5 text-[var(--fg)]">
                              Name <span style={{ color: 'var(--accent)' }}>*</span>
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
                            <label htmlFor="unit_price" className="block text-[13px] font-medium mb-1.5 text-[var(--fg)]">
                              Price <span style={{ color: 'var(--accent)' }}>*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--muted)' }}>$</span>
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

                        <div className="mt-4">
                          <label htmlFor="description" className="block text-[13px] font-medium mb-1.5 text-[var(--fg)]">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className={`${inputClasses} h-auto py-2.5 resize-y`}
                          />
                        </div>
                      </fieldset>

                      {/* Classification group */}
                      <fieldset className="px-6 pt-6 mt-6 border-t" style={{ borderColor: 'var(--line)' }}>
                        <legend className={groupLabelClasses}>Classification</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2.5">
                          <div>
                            <label htmlFor="clientpathurl" className="block text-[13px] font-medium mb-1.5 text-[var(--fg)]">
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
                            <label htmlFor="deal_id" className="block text-[13px] font-medium mb-1.5 text-[var(--fg)]">
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
                                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                                  {selectedDeal.code}: {selectedDeal.description}
                                </p>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </fieldset>

                      {/* Media group */}
                      <fieldset className="px-6 pt-6 pb-6 mt-6 border-t" style={{ borderColor: 'var(--line)' }}>
                        <legend className={groupLabelClasses}>Media</legend>
                        <div className="mt-2.5">
                          <ImageUploader
                            currentImage={formData.image || ''}
                            onImageSelected={handleImageSelected}
                          />
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            Recommended size: 800×800px, max 2MB.
                          </p>
                        </div>
                      </fieldset>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 px-6 py-4 border-t bg-[var(--surface)] rounded-b-xl" style={{ borderColor: 'var(--line)' }}>
                        <Button variant="outline" onClick={resetForm} type="button">
                          Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={isUploading}>
                          {isUploading ? 'Saving…' : editingProduct ? 'Save changes' : 'Add product'}
                        </Button>
                      </div>
                    </form>
                  </section>
                )}

                {/* Products List */}
                <section aria-label="Products">
                  <div className="flex justify-between items-baseline mb-4">
                    <h2 className="text-sm font-semibold text-[var(--fg)]">
                      All products
                      {!loadingProducts && (
                        <span className="ml-2 text-xs font-normal tabular-nums" style={{ color: 'var(--muted)' }}>
                          {products.length}
                        </span>
                      )}
                    </h2>
                  </div>

                  {loadingProducts ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="rounded-[10px] border overflow-hidden bg-[var(--raised)]" style={{ borderColor: 'var(--line)' }}>
                          <div className="h-40 animate-pulse" style={{ background: 'var(--surface)' }} />
                          <div className="p-4 space-y-2.5">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <article
                          key={product.id}
                          className="rounded-[10px] border overflow-hidden flex flex-col h-full bg-[var(--raised)] transition-shadow duration-200 hover:shadow-[0_3px_14px_rgba(23,28,38,0.07)]"
                          style={{ borderColor: 'var(--line)' }}
                        >
                          {product.image && (
                            <div className="relative w-full h-40 flex-shrink-0 border-b" style={{ borderColor: 'var(--line)' }}>
                              <Image
                                src={product.image}
                                alt={product.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>
                          )}

                          <div className="flex flex-col flex-1 p-4">
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold leading-snug mb-1 line-clamp-2 text-[var(--fg)]">{product.title}</h3>
                              <p className="text-[15px] font-bold tabular-nums mb-2.5 text-[var(--fg)]">
                                ${product.price.toFixed(2)}
                              </p>

                              {product.deal && (
                                <span
                                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold mb-2.5"
                                  style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}
                                >
                                  {product.deal.code} · {product.deal.discount_type === 'percentage'
                                    ? `${product.deal.discount_value}% off`
                                    : `$${product.deal.discount_value} off`}
                                </span>
                              )}

                              {product.description && (
                                <p className="text-[13px] leading-relaxed line-clamp-2 text-[var(--muted)]">
                                  {product.description}
                                </p>
                              )}
                            </div>

                            <div className="flex-shrink-0 pt-3.5 mt-auto flex gap-2 border-t" style={{ borderColor: 'var(--line)', marginTop: 'auto' }}>
                              <button
                                onClick={() => handleEdit(product)}
                                className="flex-1 h-8.5 py-1.5 rounded-md border text-[13px] font-medium transition-colors duration-150 hover:bg-[var(--accent-tint)] hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
                                style={{ borderColor: 'var(--line)', color: 'var(--fg)' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product)}
                                className="flex-1 py-1.5 rounded-md border text-[13px] font-medium text-red-700 dark:text-red-300 transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-900/25 hover:border-red-300 dark:hover:border-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40"
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
          className="dsh-toast-in fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium shadow-[0_8px_24px_rgba(23,28,38,0.14)] bg-[var(--raised)]"
          style={{
            borderColor: toast.tone === 'success' ? 'var(--line)' : '#f2c4c4',
            color: toast.tone === 'success' ? 'var(--fg)' : '#b42318',
          }}
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ background: toast.tone === 'success' ? 'var(--accent)' : '#b42318' }}
          />
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
