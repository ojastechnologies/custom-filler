'use client';

import { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useCart } from '@/context/CartContext';

const products = [
  {
    id: 'prod_1',
    name: 'Laser Cryogen Spray',
    price: 29.99,
    image: '/images/product-placeholder.jpg',
    description: 'Professional-grade cryogen spray for laser treatments.',
  },
  {
    id: 'prod_2',
    name: 'Aerosol Filling Kit',
    price: 49.99,
    image: '/images/product-placeholder.jpg',
    description: 'Complete kit for small-scale aerosol filling operations.',
  },
  {
    id: 'prod_3',
    name: 'Custom Valve Assembly',
    price: 19.99,
    image: '/images/product-placeholder.jpg',
    description: 'Precision valve assembly for specialized aerosol applications.',
  },
  {
    id: 'prod_4',
    name: 'Propellant Mixture',
    price: 34.99,
    image: '/images/product-placeholder.jpg',
    description: 'Professional-grade propellant mixture for aerosol products.',
  },
];

const Products = () => {
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    
    // Show "Added" status temporarily
    setAddedToCart(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedToCart(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <section className="py-12 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Quality aerosol products for various applications
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="h-full">
              <div className="h-48 bg-gray-200 dark:bg-gray-700">
                {/* Replace with actual image */}
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <span>Product Image</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.name}</h3>
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
      </div>
    </section>
  );
};

export default Products;