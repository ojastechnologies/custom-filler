"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Generate aerosol products
const generateAerosolProducts = () => {
  const products = [
    {
      id: 1,
      title: "Standard Aerosol Can (1-inch)",
      price: 24.99,
      image: "https://images.unsplash.com/photo-1635766054474-ebf6a6c46c30?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Standard 1-inch aerosol can for general purpose applications. Perfect for small to medium batch production."
    },
    {
      id: 2,
      title: "Premium Aerosol Can (20mm)",
      price: 29.99,
      image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Premium 20mm aerosol can with enhanced durability and consistent spray pattern. Ideal for high-volume production."
    },
    {
      id: 3,
      title: "Laser Cryogen Spray",
      price: 49.99,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Medical-grade cryogen spray designed specifically for laser treatments. Meets the highest standards for medical applications."
    },
    {
      id: 4,
      title: "Custom Formulation Service",
      price: 199.99,
      image: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Custom aerosol formulation service. Our experts will develop a unique solution tailored to your specific requirements."
    },
    {
      id: 5,
      title: "Small Batch Filling (100 units)",
      price: 299.99,
      image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Small batch filling service for 100 units. Perfect for product testing or limited edition releases."
    },
    {
      id: 6,
      title: "Medium Batch Filling (500 units)",
      price: 1299.99,
      image: "https://images.unsplash.com/photo-1581092921461-7d65ca45ec1e?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Medium batch filling service for 500 units. Ideal for growing businesses with moderate demand."
    },
    {
      id: 7,
      title: "Large Batch Filling (1000+ units)",
      price: 2499.99,
      image: "https://images.unsplash.com/photo-1581093196277-9f608bb3d4b9?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Large batch filling service for 1000+ units. Cost-effective solution for high-volume production needs."
    },
    {
      id: 8,
      title: "Eco-Friendly Aerosol Can",
      price: 34.99,
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Environmentally friendly aerosol can made from recycled materials. Reduces environmental impact without compromising performance."
    },
    {
      id: 9,
      title: "Specialty Valve System",
      price: 19.99,
      image: "https://images.unsplash.com/photo-1581093458791-9d09da8a0ac5?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Specialty valve system for precise dispensing. Ensures consistent spray pattern and controlled application."
    },
    {
      id: 10,
      title: "Custom Labeling Service",
      price: 149.99,
      image: "https://images.unsplash.com/photo-1581093196485-fceafecd55c8?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Custom labeling service for your aerosol products. Professional design and application for your brand identity."
    },
    {
      id: 11,
      title: "Quality Testing Package",
      price: 99.99,
      image: "https://images.unsplash.com/photo-1581093577421-f561a654a353?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Comprehensive quality testing package for aerosol products. Ensures safety, performance, and compliance with regulations."
    },
    {
      id: 12,
      title: "Propellant Consultation",
      price: 79.99,
      image: "https://images.unsplash.com/photo-1581093577502-caa0be466aff?q=80&w=400&h=300&auto=format&fit=crop",
      description: "Expert consultation on propellant selection for your specific application. Optimize performance and safety."
    }
  ];
  
  return products;
};

const products = generateAerosolProducts();

export default function ServicesPage() {
  const router = useRouter();
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  
  const handleBuyNow = (product: any) => {
    // Encode the product data to pass as URL parameter
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
            
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <div 
                  key={product.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className={`object-cover transition-transform duration-500 ${
                        hoveredProduct === product.id ? 'scale-110' : 'scale-100'
                      }`}
                    />
                    
                    {/* Overlay on hover */}
                    <div 
                      className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
                        hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
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
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {product.title}
                    </h2>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        ${product.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleBuyNow(product)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Buy Now
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
