"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { fetchProducts } from '@/app/services/productsService';

interface Product {
  id: string;
  title?: string;
  name?: string;
  price: number;
  image?: string;
  description?: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadProducts = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch products...');
        const data = await fetchProducts();
        if (isMounted) {
          console.log('Products received in component:', data);
          
          if (!data || data.length === 0) {
            console.log('No products returned from service');
          }
          
          setProducts(data || []);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching products in component:', err);
          setError(`Failed to load products: ${err instanceof Error ? err.message : String(err)}`);
          setLoading(false);
        }
      }
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);
  
  const handleBuyNow = (product: any) => {
    const productData = encodeURIComponent(JSON.stringify(product));
    router.push(`/checkout?product=${productData}`);
  };
  
  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Our Products & Services
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Aero Tech Labs offers a comprehensive range of aerosol filling solutions and services. 
              Browse our offerings below or contact us for custom requirements.
            </p>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded relative text-center">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No products found
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We couldn't find any products in our database.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(product => {
                  console.log('Rendering product:', product);
                  return (
                    <div 
                      key={product.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
                      onMouseEnter={() => setHoveredProduct(Number(product.id))}
                      onMouseLeave={() => setHoveredProduct(null)}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={product.image || "https://images.unsplash.com/photo-1635766054474-ebf6a6c46c30?q=80&w=400&h=300&auto=format&fit=crop"}
                          alt={product.title}
                          fill
                          className={`object-cover transition-transform duration-500 ${
                            hoveredProduct === Number(product.id) ? 'scale-110' : 'scale-100'
                          }`}
                        />
                        
                        <div 
                          className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
                            hoveredProduct === Number(product.id) ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <button
                            onClick={() => handleBuyNow(product)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h2 className="text-2xl font-bold text-black">
                          {product.title}
                        </h2>
                        
                        <p className="text-lg text-black my-4">
                          {product.description}
                        </p>
                        
                        <div>
                          <span className="text-xl font-bold text-black">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-16 bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Need a Custom Solution?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl mx-auto">
                Our team of experts is ready to help you develop the perfect aerosol product for your specific needs.
                Contact us today to discuss your requirements and get a personalized quote.
              </p>
              <Link 
                href="/contact-us" 
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request a Consultation
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
