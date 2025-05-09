"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { addToCart } = useCart();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadProducts = async () => {
      try {
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

  const handleBuyNow = (product: Product) => {
    // Add to cart first
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
    });

    // Navigate to cart
    router.push("/cart");
  };

  const handleShareOnWhatsApp = (product: Product) => {
    const message = `Check out this product: ${product.title} - ${window.location.origin}${product.about_url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
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
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Featured Products
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden h-full transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className="relative h-48 bg-gray-200 dark:bg-gray-700"
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  {product.image &&
                  product.image !== "/placeholder-product.jpg" ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">
                        Product Image
                      </span>
                    </div>
                  )}

                  <div
                    className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-3 transition-opacity duration-300 ${
                      hoveredProduct === product.id
                        ? "opacity-100"
                        : "opacity-0"
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
                      href={`${product?.about_url}`}
                      className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                    >
                      <span>Learn More</span>
                      <svg
                        className="ml-2 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
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
      </div>
    </section>
  );
};

export default ProductsSection;
