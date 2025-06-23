'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { fetchProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '@/services/productsService';
import { fetchDeals, Deal } from '@/services/dealService'; // NEW: Import deals
import ImageUploader from '@/components/admin/ImageUploader';
import DealManagement from '@/components/admin/DealManagement';
import { ProductType } from '@/types/product';
import { supabase } from '@/lib/supabaseClient';

import { debugStorageBucket } from '@/services/productsService';

// Service categories dropdown options
const SERVICE_CATEGORIES = [
  { name: '1 Inch Opening Contract Filling', path: 'services/1-inch-filling' },
  { name: '20 mm Opening Contract Aerosol Filling', path: 'services/20mm-filling' },
  { name: 'NON FLAMMABLE PROPELLANTS', path: 'services/non-flammable-propellant' },
  { name: 'LASER CRYOGEN', path: 'services/laser-cryogen' }
];

export default function DashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]); // NEW: Add deals state
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    deal_id: '' // NEW: Add deal_id to form data
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // NEW: Load deals when component mounts
  useEffect(() => {
    const loadDeals = async () => {
      if (isAdmin) {
        try {
          // setLoadingDeals(true);
          const dealsData = await fetchDeals();
          setDeals(dealsData.filter(deal => deal.is_active)); // Only show active deals
        } catch (err) {
          console.error('Error loading deals:', err);
        } finally {
          // setLoadingDeals(false);
        }
      }
    };
    loadDeals();
  }, [isAdmin]);

  debugStorageBucket();

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      // If Supabase thinks there is a session but AuthContext does not, clear it
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          supabase.auth.signOut();
          // Remove legacy keys if present
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.refresh_token');
          localStorage.removeItem('supabase.auth.access_token');
        }
        router.push('/auth/enter-portal-9f3b2');
      });
    }
  }, [user, loading, router]);

  // Robust session sync: Wait for both Supabase and AuthContext to resolve before redirecting or fetching
  useEffect(() => {
    if (loading) return; // Wait for AuthContext to finish loading
    supabase.auth.getSession().then(({ data }) => {
      const supabaseSession = !!data?.session;
      if (!user && !supabaseSession) {
        // No session anywhere: redirect
        router.push('/auth/enter-portal-9f3b2');
      } else if (!user && supabaseSession) {
        // Supabase has session but AuthContext does not: force reload to sync context
        window.location.reload();
      }
      // else: user is present, do nothing (normal flow)
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
      if (err instanceof Error) {
        setError(err.message || 'Failed to load products');
      } else {
        setError('Failed to load products');
      }
    } finally {
      setLoadingProducts(false);
    }
  }, [fetchProductsWithTimeout]);

  // Fetch products
  useEffect(() => {
    // Only check session for dashboard, not for public product fetches
    if (!loading && user && activeTab === 'products') {
      const checkAndLoadProducts = async () => {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          loadProducts();
        } else {
          setError('No active session. Please log in again.');
        }
      };
      checkAndLoadProducts();
    }
  }, [user, loading, loadProducts, activeTab]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // 🔥 Debug deal selection
    if (name === 'deal_id') {
      console.log('🎫 Deal selection changed:', { name, value });
      const selectedDeal = deals.find(d => d.id === value);
      console.log('🎫 Selected deal object:', selectedDeal);
    }
    
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
    
    // 🔥 STRICT VALIDATION
    if (!formData.title || formData.title.trim() === '') {
      setError('Product title is required and cannot be empty');
      return;
    }

    if (!formData.price || formData.price <= 0) {
      setError('Product price must be greater than 0');
      return;
    }
    const selectedDeal = deals.find(d => d.id === formData.deal_id);
    console.log('📝 Form submission - selected deal:', selectedDeal);
    
    try {
      setIsUploading(true);
      let imageUrl = formData.image;
      if (selectedFile) {
        imageUrl = await uploadProductImage(selectedFile);
      }
      if (editingProduct) {
        // Update existing product using the service
        const result = await updateProduct(editingProduct.id, {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          image: imageUrl,
          category: formData.category,
          about_url: formData.about_url,
          clientpathurl: formData.clientpathurl,
          deal_id: formData.deal_id, // 🔥 Pass as-is, service will handle empty string conversion
          imageFile: selectedFile || undefined,
        });
        
        setProducts((prev) =>
          prev.map((product) =>
            product.id === editingProduct.id ? result : product
          )
        );
      } else {
        // Create new product using the service
        const result = await createProduct({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          image: imageUrl,
          imageFile: selectedFile || undefined,
          category: formData.category,
          about_url: formData.about_url,
          clientpathurl: formData.clientpathurl,
          deal_id: formData.deal_id, // 🔥 Pass as-is, service will handle empty string conversion
        });
        setProducts([...products, { ...result }]);
      }
      
      // 🔥 IMPORTANT: Reload products to ensure fresh data from database
      console.log('🔄 Reloading products from database to ensure fresh data...');
      await loadProducts();
      
      resetForm();
    } catch (err: unknown) {
      console.error('Error saving product:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to save product');
      } else {
        setError('Failed to save product');
      }
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
      deal_id: product.deal_id || '' // NEW: Include deal_id
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  // Handle product delete
  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteProduct(id);
      setProducts(products.filter(product => product.id !== id));
    } catch (err: unknown) {
      console.error('Error deleting product:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to delete product');
      } else {
        setError('Failed to delete product');
      }
    }
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
      deal_id: '' // NEW: Include deal_id
    });
    setEditingProduct(null);
    setSelectedFile(null);
    setShowForm(false);
  };
 

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back,
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.email}
                </span>
              </div>
            </div>
            
            {isAdmin && (
              <Card className="p-6 mb-8 border-l-4 border-primary-600">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Admin Access
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      You have administrator privileges. You can manage products and deals directly from this dashboard.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Tab Navigation */}
            {isAdmin && (
              <div className="mb-8">
                <nav className="flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'products'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Products
                  </button>
                  <button
                    onClick={() => setActiveTab('deals')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'deals'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Deals & Promotions
                  </button>
                </nav>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'products' ? (
              <>
                {/* Product Form for Admins */}
                {isAdmin && showForm && (
                  <Card className="p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Product Name
                          </label>
                          <input
                            id="name"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Price ($)
                          </label>
                          <input
                            id="unit_price"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label htmlFor="clientpathurl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Service Category
                          </label>
                          <select
                            id="clientpathurl"
                            name="clientpathurl"
                            value={formData.clientpathurl}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select a service category</option>
                            {SERVICE_CATEGORIES.map((category) => (
                              <option key={category.path} value={category.path}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* NEW: Deal Selection Dropdown */}
                        <div>
                          <label htmlFor="deal_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Associated Deal
                          </label>
                          <select
                            id="deal_id"
                            name="deal_id"
                            value={formData.deal_id || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">No deal</option>
                            {deals.map((deal) => (
                              <option key={deal.id} value={deal.id}>
                                {deal.code} - {deal.description} 
                                ({deal.discount_type === 'percentage' 
                                  ? `${deal.discount_value}% off`
                                  : `$${deal.discount_value} off`
                                })
                              </option>
                            ))}
                          </select>
                          
                          {/* 🔥 NEW: Show selected deal info */}
                          {formData.deal_id && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                              {(() => {
                                const selectedDeal = deals.find(d => d.id === formData.deal_id);
                                return selectedDeal ? (
                                  <div className="text-sm">
                                    <p className="font-medium text-green-800 dark:text-green-200">
                                      ✅ Selected: {selectedDeal.code}
                                    </p>
                                    <p className="text-green-600 dark:text-green-300">
                                      {selectedDeal.description}
                                    </p>
                                    <p className="text-green-600 dark:text-green-300">
                                      Discount: {selectedDeal.discount_type === 'percentage' 
                                        ? `${selectedDeal.discount_value}%`
                                        : `$${selectedDeal.discount_value}`
                                      }
                                    </p>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={formData.description}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Image
                        </label>
                        <ImageUploader 
                          currentImage={formData.image || ''} 
                          onImageSelected={handleImageSelected} 
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Recommended size: 800x800px. Max file size: 2MB.
                        </p>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={resetForm}
                          type="button"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={isUploading}
                        >
                          {isUploading 
                            ? 'Uploading...' 
                            : editingProduct 
                              ? 'Update Product' 
                              : 'Add Product'}
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <button 
                        onClick={() => setError(null)} 
                        className="text-sm underline"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={loadProducts}
                        className="text-sm underline text-primary-700 font-semibold"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Products List */}
                <Card className="p-6 mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Products
                    </h2>
                    {isAdmin && (
                      <Button
                        variant="primary"
                        onClick={() => setShowForm(!showForm)}
                      >
                        {showForm ? 'Cancel' : 'Add New Product'}
                      </Button>
                    )}
                  </div>
                  
                  {loadingProducts ? (
                    <div className="flex flex-col justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-2"></div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Loading products...</p>
                      {error && (
                        <button
                          onClick={loadProducts}
                          className="mt-2 text-sm underline text-primary-700 font-semibold"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No products found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col">
                         
                          {product.image && (
                            <div className="relative w-full h-48 mb-4 flex-shrink-0">
                              <Image
                                src={product.image}
                                alt={product.title}
                                fill
                                className="object-cover rounded-t-lg"
                              />
                            </div>
                          )}
                          
                          <div className="flex flex-col flex-1 min-h-0 p-6 pt-2">
                            <div className="flex-1 overflow-hidden">
                              {/* Product Info */}
                              <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.title}</h3>
                              <p className="text-gray-600 dark:text-gray-300 mb-3 text-lg font-bold">${product.price.toFixed(2)}</p>
                              
                              {product.deal ? (
                                <div className="mb-3">
                                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    🎉 {product.deal.code}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                    {product.deal.discount_type === 'percentage' 
                                      ? `${product.deal.discount_value}% off`
                                      : `${product.deal.discount_value} off`
                                    }
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {product.deal.description}
                                  </p>
                                </div>
                              ) : (
                                <div className="mb-3">
                                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    No deal assigned
                                  </div>
                                </div>
                              )}
                              
                              {product.description && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                                  {product.description}
                                </p>
                              )}
                            </div>
                            
                            {/* FIXED HEIGHT BOTTOM SECTION - Always same position */}
                            <div className="flex-shrink-0 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex gap-2 h-10">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors flex items-center justify-center"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors flex items-center justify-center"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            ) : (
              isAdmin && <DealManagement />
            )}
            
            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/orders')}
                    className="flex items-center justify-center py-3"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Manage Orders
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push('/services')}
                  className="flex items-center justify-center py-3"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Browse Products
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/contact-us')}
                  className="flex items-center justify-center py-3"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                  </svg>
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/faqs')}
                  className="flex items-center justify-center py-3"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  FAQs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/cart')}
                  className="flex items-center justify-center py-3"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8" />
                  </svg>
                  View Cart
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
