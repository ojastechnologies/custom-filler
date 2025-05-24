'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/services/productsService';
import ImageUploader from '@/components/admin/ImageUploader';
import { ProductType } from '@/types/product';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For product form
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState<ProductType>({
    id: '',
    title: '',
    description: '',
    price: 0,
    image: '',
    category: '',
    quantity: 1,
    about_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // Fetch products with timeout and retry
  const fetchProductsWithTimeout = async (timeoutMs = 8000) => {
    return Promise.race([
      fetchProducts(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out. Please try again.')), timeoutMs))
    ]);
  };

  const loadProducts = async () => {
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
  };

  // Fetch products
  useEffect(() => {
    // Only check session for dashboard, not for public product fetches
    if (!loading && user) {
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
  }, [user, loading, loadProducts]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'unit_price' ? parseFloat(value) || 0 : value
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
    
    if (!isAdmin) return;
    
    try {
      setIsUploading(true);
      
      if (editingProduct) {
        // Update existing product using the service
        const result = await updateProduct(editingProduct.id, {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          image: formData.image,
          category: formData.category,
          about_url: formData.about_url
        });
        
        setProducts((prev) =>
          prev.map((product) =>
            product.id === editingProduct.id ? result : product
          )
        );
      } else {
        // Create new product using the service
        const result = await createProduct({
          name: formData.title,
          description: formData.description,
          unit_price: formData.price,
          thumbnail_url: formData.image,
          imageFile: selectedFile || undefined,
          category: formData.category,
          about_url: formData.about_url
        });
        
        setProducts([...products, {
          ...result
        }]);
      }
      
      // Reset form
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
      ...product
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  // Handle product delete
  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      // Delete product using the service
      await deleteProduct(id);
      
      // Update local state regardless of the result
      // This ensures the UI stays in sync even if there's an issue with the database
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
      about_url: ''
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
                      You have administrator privileges. You can manage products directly from this dashboard.
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Button
                      variant="primary"
                      onClick={() => setShowForm(!showForm)}
                    >
                      {showForm ? 'Cancel' : 'Add New Product'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
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
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                    <colgroup>
                      <col style={{ width: '320px' }}/>
                      <col style={{ width: '120px' }}/>
                      {isAdmin && <col style={{ width: '160px' }}/>}
                    </colgroup>
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-80"
                        >
                          Product
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28"
                        >
                          Price
                        </th>
                        {isAdmin && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40"
                          >
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap w-80 max-w-xs">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 relative">
                                <Image
                                  src={product.image || "/placeholder-product.jpg"}
                                  alt={product.title}
                                  fill
                                  className="object-cover rounded-md"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/placeholder-product.jpg";
                                  }}
                                />
                              </div>
                              <div className="ml-4 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {product.title}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis break-normal">
                                  {product.description || "No description"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-28">
                            <div className="text-sm text-gray-900 dark:text-white">
                              ${product.price?.toFixed(2) || "0.00"}
                            </div>
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-40">
                              <button
                                onClick={() => handleEdit(product)}
                                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
            
            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
