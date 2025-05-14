'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getProductById, Product } from '@/app/services/adminProductsService';
import NextImage from 'next/image';
import { ProductType } from '@/types/product';

export default function AdminProductDetailPage({ params }: { params: { id: string } }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  // Add this near your other useState declarations
const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [product, setProduct] = useState<ProductType>({
    id: '',
    title: '',
    price: 0,
    // other defaults
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in or not admin
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
    }
    
    // Fetch product details
    if (user && isAdmin && params.id) {
      loadProduct();
    }
  }, [user, loading, isAdmin, router, params.id]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const data = await getProductById(params.id);
      setProduct(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
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

  if (!user || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
                {error}
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/products')}
              >
                Back to Products
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-md">
                Product not found
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/products')}
              >
                Back to Products
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Product Details
              </h1>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/products')}
                >
                  Back to Products
                </Button>
                {/* Only show edit button if user is super admin */}
                {user && isAdmin && (
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                  >
                    Edit Product
                  </Button>
                )}
              </div>
            </div>
            
            <Card className="p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        No image available
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {product.title}
                  </h2>
                  
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                      {product.category || 'Uncategorized'}
                    </span>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Created At
                      </h3>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(product.created_at || '').toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Last Updated
                      </h3>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(product.updated_at || '').toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}