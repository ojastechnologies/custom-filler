"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import { fetchProducts } from "@/app/services/productsService";
import { useCart } from "@/context/CartContext";

interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  category?: string;
  about_url?: string;
}

const ProductsSection = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadProducts = async () => {
      try {
        debugger;
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data.slice(0, 3));
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    // Add the product to cart
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    });

    // Show "Added to Cart" feedback
    setAddedToCart((prev) => ({ ...prev, [product.id]: true }));

    // Reset after 2 seconds
    setTimeout(() => {
      setAddedToCart((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Determine grid columns based on number of products
  const getGridClass = () => {
    const count = products.length;
    if (count === 1) return "grid-cols-1 max-w-md";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-2xl";
    return "grid-cols-1 md:grid-cols-3 max-w-5xl";
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
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
            Explore our specialized aerosol products
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No products available at the moment.
            </p>
          </div>
        ) : (
          <div className={`grid ${getGridClass()} gap-6 mx-auto`}>
            {products.map((product) => (
              <Card
                key={product.id}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className="relative h-48 flex items-center justify-center bg-white dark:bg-gray-800 p-2"
                >
                  {product.image &&
                  product.image !== "/placeholder-product.jpg" ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">
                        Product Image
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {product.title}
                    </h3>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                    {product.description}
                  </p>
                  
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
            ))}
          </div>
        )}
        
        <div className="mt-10 text-center">
          <Link 
            href="/services" 
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
