// This file was moved from /services/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { fetchProducts } from "@/services/productsService";import Card from "@/components/ui/Card";
import { ProductType } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
export default function ProductsPage() {
  const { addToCart } = useCart();
  const { loading } = useAuth();

  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loadingProducts, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Attempting to load products...');
        
        // Try the full version first, fall back to simple if it fails
        let data: ProductType[];
        try {
          data = await fetchProducts();
          console.log('✅ Full products loaded successfully');
        } catch (fullError) {
          console.warn('⚠️ Full fetch failed, trying simple version:', fullError);
          data = await fetchProducts();
          console.log('✅ Simple products loaded successfully');
        }
        
        setProducts(data);
        
        // Initialize quantities
        const initialQuantities: Record<string, number> = {};
        data.forEach((product: ProductType) => {
          initialQuantities[product.id] = 1;
        });
        setQuantities(initialQuantities);
        
      } catch (err) {
        console.error("❌ All product loading attempts failed:", err);
        setError("Failed to load products. Please try again later.");
        setProducts([]); // Set empty array instead of fallback products
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddToCart = (product: ProductType) => {
    // Add the product to cart with ALL fields including deal information
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image,
      description: product.description,
      clientpathurl: product.about_url,
      deal_id: product.deal_id, // NEW: Include deal_id
      deal: product.deal, // NEW: Include deal object
      quantity: quantities[product.id] || 1,
    });

    console.log('🛒 Added to cart with deal info:', {
      id: product.id,
      name: product.title,
      price: product.price,
      deal: product.deal?.code || 'No deal',
      quantity: quantities[product.id] || 1,
    });

    setAddedToCart((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedToCart((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const filteredProducts = selectedCategory
    ? products.filter(
        (product) => (product.category || "Uncategorized") === selectedCategory
      )
    : products;

  if (loading || loadingProducts) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 flex justify-center items-center min-h-[50vh]">
            <LoadingSpinner />
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
              Products
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Aero Tech Labs offers a comprehensive range of aerosol filling
              solutions and services. Browse our offerings below or contact us
              for custom requirements.
            </p>
            
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Debug Info:</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Products loaded: {products.length}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Products with deals: {products.filter(p => p.deal).length}
                </p>
              </div>
            )}
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 12H4M12 4v16"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  No products found
                </h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  Check back later for our product listings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="flex flex-col h-full transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div
                      className="relative h-48 bg-gray-200 dark:bg-gray-700"
                    >
                      <Image
                        src={product.image || "/images/placeholder-product.jpg"}
                        alt={product.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/placeholder-product.jpg";
                        }}
                      />
                      
                      {/* Deal Badge - only show if deal exists and is valid */}
                      {product.deal && product.deal.is_active && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          {product.deal.discount_type === 'percentage' 
                            ? `${product.deal.discount_value}% OFF` 
                            : `$${product.deal.discount_value} OFF`
                          }
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {product.title}
                        </h3>
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-2 flex-grow">
                        {product.description || "No description available."}
                      </p>

                      {/* Deal Information */}
                      {product.deal && product.deal.is_active && (
                        <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                          <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                            🎉 Deal: {product.deal.code}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {product.deal.description}
                          </p>
                        </div>
                      )}

                      {/* Show about_url if available */}
                      {product.about_url && (
                        <div className="mb-4">
                          <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                            More info: {product.about_url}
                          </p>
                        </div>
                      )}

                      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-2 justify-end items-center">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className={`w-full sm:w-auto px-4 py-2 text-sm rounded transition-colors ${
                            addedToCart[product.id]
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-primary-600 hover:bg-primary-700 text-white"
                          }`}
                        >
                          {addedToCart[product.id] ? "Added ✓" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-lg text-center shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Need a Custom Solution?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-3xl mx-auto">
                Our team of experts is ready to help you develop the perfect
                aerosol product for your specific needs. Contact us today to
                discuss your requirements and get a personalized quote.
              </p>
              <Link
                href="/contact-us"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
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
