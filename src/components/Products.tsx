'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Card from './ui/Card';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { fetchProducts } from '@/services/productsService';
import { ProductType, Deal } from '@/types/product';

interface ProductsProps {
  isHomeSection?: boolean;
  maxProducts?: number;
  title?: string;
  subtitle?: string;
  showViewAllLink?: boolean;
  containerClassName?: string;
}

const Products = ({ 
  isHomeSection = false,
  maxProducts,
  title = "Featured Products",
  subtitle = "Quality aerosol products for various applications",
  showViewAllLink = false,
  containerClassName = ""
}: ProductsProps) => {
  const { addToCart } = useCart();
  const { loading: authLoading } = useAuth();
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        
        // Apply maxProducts limit if specified (useful for home section)
        const displayProducts = maxProducts ? data.slice(0, maxProducts) : data;
        
        setProducts(displayProducts);
        setError(null);
      } catch {
        setError('Failed to load products. Please try again later.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [maxProducts]);

  const handleAddToCart = (product: ProductType) => {
    // Add the product to cart with ALL fields including deal information
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image,
      description: product.description,
      clientpathurl: product.about_url,
      deal_id: product.deal_id,
      deal: product.deal,
      quantity: 1,
    });

    console.log(`🛒 ${isHomeSection ? 'Home Section' : 'Products Page'} - Added to cart:`, {
      id: product.id,
      name: product.title,
      price: product.price,
      deal: product.deal?.code || 'No deal'
    });

    setAddedToCart(prev => ({ ...prev, [product.id]: true }));
  
    setTimeout(() => {
      setAddedToCart(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Helper function to check if deal is valid - wrapped in useCallback
  const isDealValid = useCallback((deal: Deal): boolean => {
    if (!deal || !deal.is_active) return false;
    
    // Check expiration
    if (deal.expires_at && new Date(deal.expires_at) < new Date()) return false;
    
    // Check usage limit
    if (deal.usage_limit && deal.usage_count >= deal.usage_limit) return false;
    
    return true;
  }, []);

  // Determine grid columns based on number of products - EXACT SAME AS ProductsSection
  const getGridClass = () => {
    if (products.length === 1) return "grid-cols-1 max-w-sm";
    if (products.length === 2) return "grid-cols-1 md:grid-cols-2 max-w-2xl";
    if (products.length === 3) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-4xl";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl";
  };

  // Debug logging
  useEffect(() => {
    console.log(`🔍 ${isHomeSection ? 'Home Section' : 'Products Page'} Debug:`, {
      productsCount: products.length,
      productsWithDeals: products.filter(p => p.deal).length,
      productsWithValidDeals: products.filter(p => p.deal && isDealValid(p.deal)).length
    });

    // Log each product's deal status
    products.forEach(product => {
      if (product.deal) {
        console.log(`📦 Product "${product.title}":`, {
          hasDeal: !!product.deal,
          dealCode: product.deal.code,
          dealActive: product.deal.is_active,
          dealValid: isDealValid(product.deal),
          dealExpired: product.deal.expires_at ? new Date(product.deal.expires_at) < new Date() : false
        });
      }
    });
  }, [products, isDealValid, isHomeSection]);

  if (authLoading || loading) {
    return (
      <section className={`py-12 ${isHomeSection ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'} ${containerClassName}`}>
        <div className="container mx-auto px-4 text-center">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  return (
    <section className={`py-12 ${isHomeSection ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'} ${containerClassName}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className={`mt-4 text-gray-600 dark:text-gray-400 ${isHomeSection ? 'text-lg max-w-3xl mx-auto' : 'text-xl'}`}>
            {subtitle}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-8" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No products available at the moment.
            </p>
          </div>
        ) : (
          <div className={`grid ${getGridClass()} gap-6 mx-auto`}>
            {products.map((product) => {
              const hasValidDeal = product.deal && isDealValid(product.deal);
              
              return (
                <Card
                  key={product.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="relative h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-700 p-2">
                    {product.image && product.image !== "/placeholder-product.jpg" ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover p-2"
                        priority={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">
                          Product Image
                        </span>
                      </div>
                    )}
                    
                    {/* Deal Badge - NO CODE SHOWN */}
                    {hasValidDeal && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {product.deal!.discount_type === 'percentage' 
                          ? `${product.deal!.discount_value}% OFF` 
                          : `${product.deal!.discount_value} OFF`
                        }
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {product.title}
                    </h3>
                    
                    {product.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Deal Information - NO CODE SHOWN */}
                    {hasValidDeal && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                          {product.deal!.description}
                        </p>
                        
                        {/* Show minimum order requirement */}
                        {product.deal!.minimum_order_amount && (
                          <div className="bg-white dark:bg-gray-800 rounded px-2 py-1 border border-green-300 dark:border-green-600">
                            <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                              💰 Buy ${product.deal!.minimum_order_amount.toFixed(2)} worth to get{' '}
                              {product.deal!.discount_type === 'percentage' 
                                ? `${product.deal!.discount_value}% off`
                                : `${product.deal!.discount_value} off`
                              } each item
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Need {Math.ceil(product.deal!.minimum_order_amount / product.price)} items minimum
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Show about_url if available */}
                    {product.about_url && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-3 truncate">
                        More info: {product.about_url}
                      </p>
                    )}
                    
                    {/* ORIGINAL PRICE AND BUTTON LAYOUT */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <Button
                        variant={addedToCart[product.id] ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                      >
                        {addedToCart[product.id] ? 'Added ✓' : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Show "View All Products" link only for home section */}
        {showViewAllLink && isHomeSection && (
          <div className="mt-10 text-center">
            <Link 
              href="/products" 
              className="inline-block px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
            >
              View All Products
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
