"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

const products = [
  {
    id: 'laser-cryogen-standard',
    title: 'Laser Cryogen - Standard', // Changed from 'name' to 'title'
    description: 'Our standard laser cryogen spray for dermatological applications, compatible with most laser systems.',
    image: '/placeholder-product.jpg',
    price: 149.99,
    category: 'Cryogen' // Added category for consistency
  },
  {
    id: 'laser-cryogen-extended',
    title: 'Laser Cryogen - Extended Duration', // Changed from 'name' to 'title'
    description: 'Extended duration formula providing longer cooling effect for specialized laser treatments.',
    image: '/placeholder-product.jpg',
    price: 199.99,
    category: 'Cryogen' // Added category for consistency
  },
  {
    id: 'sample-kit',
    title: 'Custom Filling Sample Kit', // Changed from 'name' to 'title'
    description: 'A sample kit showcasing our various filling capabilities and container options.',
    image: '/placeholder-product.jpg',
    price: 79.99,
    category: 'Samples' // Added category for consistency
  }
];

const ProductsSection = () => {
  const router = useRouter();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const handleBuyNow = (product: any) => {
    // Encode the product data to pass as URL parameter
    const productData = encodeURIComponent(JSON.stringify(product));
    router.push(`/checkout?product=${productData}`);
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore our specialized aerosol products
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden h-full transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
              <div 
                className="relative h-48 bg-gray-200 dark:bg-gray-700"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                {/* Replace with actual image */}
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">Product Image</span>
                </div>
                
                {/* Overlay on hover */}
                <div 
                  className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
                    hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <button
                    onClick={() => handleBuyNow(product)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {product.title}
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
                    className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
