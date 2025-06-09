'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Card from './ui/Card';
import Button from './ui/Button';
import { useCart } from '@/context/CartContext';
import { fetchProducts } from '@/services/productsService';
import { ProductType } from '@/types/product';

const Products = () => {
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        if (data.length === 0) {
          setProducts([]);
        } else {
          setProducts(data);
        }
        setError(null);
      } catch {
        setError('Failed to load products. Please try again later.');
        setProducts([
          {
            id: 'fallback-1',
            title: 'Sample Product 1',
            price: 19.99,
            image: '/placeholder-product.jpg',
            description: 'This is a fallback product shown when database connection fails.',
            about_url: 'https://example.com/product1'
          },
          {
            id: 'fallback-2',
            title: 'Sample Product 2',
            price: 29.99,
            image: '/placeholder-product.jpg',
            description: 'This is a fallback product shown when database connection fails.',
            about_url: 'https://example.com/product2'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleAddToCart = (product: ProductType) => {
    // Add the product to cart with ALL fields including description and clientpathurl
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image,
      description: product.description, // Include description
      clientpathurl: product.about_url, // Map about_url to clientpathurl
    });

    console.log('🛒 Added to cart with all fields from Products component:', {
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image,
      description: product.description,
      clientpathurl: product.about_url,
    });
   
    setAddedToCart(prev => ({ ...prev, [product.id]: true }));
  
    setTimeout(() => {
      setAddedToCart(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  if (loading) {
    return (
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Quality aerosol products for various applications
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
            <p className="text-gray-600 dark:text-gray-400">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Card key={product.id} className="h-full">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                  {product.image && (
                    <Image 
                      src={product.image} 
                      alt={product.title} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover"
                      priority={false}
                    />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.title}</h3>
                  {product.description && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400 line-clamp-3">{product.description}</p>
                  )}
                  {/* Show about_url if available */}
                  {product.about_url && (
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 truncate">
                      More info: {product.about_url}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</span>
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
