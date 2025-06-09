'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';

export default function CheckoutSuccessPage() {
  const { clearCart, items, totalItems } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isCartCleared, setIsCartCleared] = useState(false);

  useEffect(() => {
    // Clear the cart after successful payment
    if (sessionId && !isCartCleared) {
      console.log('🎉 Payment successful! Current cart items:', items);
      console.log('🎉 Total items before clear:', totalItems);
      
      // Clear cart immediately
      clearCart();
      setIsCartCleared(true);
      
      // Double-check and force clear if needed
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cart');
          console.log('🧹 Force cleared localStorage as backup');
        }
      }, 500);
      
      console.log('✅ Cart clear process completed');
    }
  }, [sessionId, clearCart, isCartCleared, items, totalItems]);

  // Debug: Show current cart state
  useEffect(() => {
    console.log('🔍 Success page - Current cart state:', { 
      itemsCount: items.length, 
      totalItems,
      isCartCleared 
    });
  }, [items, totalItems, isCartCleared]);

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              {/* Success Icon */}
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Successful!
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Thank you for your order! Your payment has been processed successfully.
              </p>

              {sessionId && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Session ID:</span> {sessionId}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  You will receive an email confirmation shortly with your order details.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/products"
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Continue Shopping
                  </Link>
                  
                  <Link
                    href="/orders"
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    View Orders
                  </Link>
                </div>
              </div>

              {/* Cart status */}
              <div className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✅ Your cart has been cleared ({totalItems} items removed)
                </p>
              </div>

              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Debug: Cart items: {items.length}, Total: {totalItems}, Cleared: {isCartCleared ? 'Yes' : 'No'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}