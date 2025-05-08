"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { fetchProducts } from '@/app/services/productsService';

export default function ServicesPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
        
        // Initialize quantities for each product
        const initialQuantities: Record<string, number> = {};
        data.forEach((product: any) => {
          initialQuantities[product.id] = 1;
        });
        setQuantities(initialQuantities);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);
  
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }));
  };
  
  const handleAddToCart = (product: any) => {
    // Add the product to cart with the selected quantity
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantities[product.id] || 1
    });
    
    // Show "Added to Cart" feedback
    setAddedToCart(prev => ({ ...prev, [product.id]: true }));
    
    // Reset after 2 seconds
    setTimeout(() => {
      setAddedToCart(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };
  
  const handleBuyNow = (product: any) => {
    // Add to cart first with the selected quantity
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantities[product.id] || 1
    });
    
    // Navigate to cart
    router.push('/cart');
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

  if (error) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 p-4 rounded-lg">
              <p className="font-semibold">Error loading products</p>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
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
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Our Products & Services
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Aero Tech Labs offers a comprehensive range of aerosol filling solutions and services. 
              Browse our offerings below or contact us for custom requirements.
            </p>
            
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <div 
                  key={product.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div 
                    className="relative h-48 bg-gray-200 dark:bg-gray-700"
                  >
                    {product.image ? (
                      <Image 
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">Product Image</span>
                      </div>
                    )}
                    
                    <div 
                      className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 transition-opacity duration-300 ${
                        hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </h3>
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {product.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <Link 
                        href={`/products/${product.id}`}
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                      >
                        <span>Learn More</span>
                        <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleBuyNow(product)}
                        className={`px-3 py-1.5 text-sm rounded transition-colors ${
                          addedToCart[product.id]
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {addedToCart[product.id] ? 'Added ✓' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Call to Action */}
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
