'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image'; // Import the Image component from next/image
import Card from './ui/Card';
import Button from './ui/Button';
import { useCart } from '@/context/CartContext';
import { fetchProducts } from '@/app/services/productsService';
export interface Product {
  id: string;
  // name?: string;
  title: string;
  price: number;
  quantity?: number;
  image?: string;
  description?: string;
  about_url?:string;
}

const Products = () => {
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        const transformedData = data.map(item => ({
          id: item.id,
          title: item.name,
          price: item.price,
          image: item.image || '/placeholder-product.jpg',
          description: item.description
        }));
        setProducts(transformedData);
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

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image,
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

  if (error) {
    return (
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
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
        
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Card key={product.id} className="h-full">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                  {product.image ? (
                    <Image 
                      src={product.image} 
                      alt={product.title} 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      {/* <span>Product Image</span> */}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.title}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{product.description}</p>
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
