"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import { fetchProducts } from "@/services/productsService";
import { useCart } from "@/context/CartContext";
import { ProductType, Deal } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const ProductsSection = () => {
  const { addToCart } = useCart();
  const { loading } = useAuth();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProducts();
        // For featured products, you might want to limit the number or filter specific ones
        const featuredProducts = data.slice(0, 8); // Show first 8 products as featured
        setProducts(featuredProducts);
        setError(null);
      } catch {
        setError("Failed to load products. Please try again later.");
        setProducts([]);
      } finally {
        setIsLoading(false);
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
      deal_id: product.deal_id, // Include deal_id
      deal: product.deal, // Include deal object
      quantity: 1,
    });

    console.log('🛒 Featured Products - Added to cart with deal info:', {
      id: product.id,
      name: product.title,
      price: product.price,
      deal: product.deal?.code || 'No deal'
    });

    setAddedToCart((prev) => ({ ...prev, [product.id]: true }));

    // Reset after 2 seconds
    setTimeout(() => {
      setAddedToCart((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Helper function to check if deal is valid
  const isDealValid = (deal: Deal): boolean => {
    if (!deal || !deal.is_active) return false;
    
    // Check expiration
    if (deal.expires_at && new Date(deal.expires_at) < new Date()) return false;
    
    // Check usage limit
    if (deal.usage_limit && deal.usage_count >= deal.usage_limit) return false;
    
    return true;
  };

  // Helper function to calculate discounted price
  const getDiscountedPrice = (originalPrice: number, deal: Deal): number => {
    if (!deal || !isDealValid(deal)) return originalPrice;
    
    let discountAmount = 0;
    if (deal.discount_type === 'percentage') {
      discountAmount = originalPrice * (deal.discount_value / 100);
    } else {
      discountAmount = deal.discount_value;
    }
    
    // Apply maximum discount limit if set
    if (deal.maximum_discount_amount && discountAmount > deal.maximum_discount_amount) {
      discountAmount = deal.maximum_discount_amount;
    }
    
    // Ensure discount doesn't exceed original price
    discountAmount = Math.min(discountAmount, originalPrice - 0.01);
    
    return Math.max(0.01, originalPrice - discountAmount);
  };

  // Determine grid columns based on number of products
  const getGridClass = () => {
    if (products.length === 1) return "grid-cols-1 max-w-sm";
    if (products.length === 2) return "grid-cols-1 md:grid-cols-2 max-w-2xl";
    if (products.length === 3) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-4xl";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-6xl";
  };

  // Debug logging
  useEffect(() => {
    console.log('🔍 Featured Products Debug:', {
      productsCount: products.length,
      productsWithDeals: products.filter(p => p.deal).length,
      productsWithValidDeals: products.filter(p => p.deal && isDealValid(p.deal)).length
    });

    // Log each product's deal status
    products.forEach(product => {
      if (product.deal) {
        console.log(`📦 Featured Product "${product.title}":`, {
          hasDeal: !!product.deal,
          dealCode: product.deal.code,
          dealActive: product.deal.is_active,
          dealValid: isDealValid(product.deal),
          originalPrice: product.price,
          discountedPrice: getDiscountedPrice(product.price, product.deal)
        });
      }
    });
  }, [products]);

  if (loading || isLoading) {
    return (
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Featured Products
          </h2>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore our specialized aerosol products with exclusive deals
          </p>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-8" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No products available at the moment.
            </p>
          </div>
        ) : (
          <div className={`grid ${getGridClass()} gap-6 mx-auto`}>
            {products.map((product) => {
              const hasValidDeal = product.deal && isDealValid(product.deal);
              const discountedPrice = hasValidDeal ? getDiscountedPrice(product.price, product.deal!) : product.price;
              
              return (
                <Card
                  key={product.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="relative h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-700 p-2">
                    {product.image &&
                    product.image !== "/placeholder-product.jpg" ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-contain p-2"
                        priority={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">
                          Product Image
                        </span>
                      </div>
                    )}
                    
                    {/* Deal Badge */}
                    {hasValidDeal && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {product.deal!.discount_type === 'percentage' 
                          ? `${product.deal!.discount_value}% OFF` 
                          : `$${product.deal!.discount_value} OFF`
                        }
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {product.title}
                      </h3>
                      
                      {/* Price Display with Deal Support */}
                      <div className="flex flex-col items-end">
                        {hasValidDeal ? (
                          <>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                ${discountedPrice.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                ${product.price.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Save ${(product.price - discountedPrice).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                      {product.description}
                    </p>
                    
                    {/* Deal Information */}
                    {hasValidDeal && (
                      <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                        <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                          🎉 Deal: {product.deal!.code}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {product.deal!.description}
                        </p>
                      </div>
                    )}
                    
                    {/* Show about_url if available */}
                    {product.about_url && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-3 truncate">
                        More info: {product.about_url}
                      </p>
                    )}
                    
                    {/* Buttons at the bottom of the card */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-2 justify-end items-center">
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
              );
            })}
          </div>
        )}
        
        <div className="mt-10 text-center">
          <Link 
            href="/products" 
            className="inline-block px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
