"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { createOrderInDatabase } from '@/services/ordersService';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, proceedToCheckout, isCheckingOut } = useCart();
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  const handleCheckout = async () => {
    try {
      setCheckoutError('');
      setIsCreatingOrder(true);
      
      console.log('🚀 STARTING ORDER CREATION PROCESS');
      console.log('Cart items with all fields:', items);

      // First, create the order in our database with ALL product fields
      const orderData = {
        customer_email: customerEmail || 'test@example.com',
        customer_name: customerName || 'Test Customer',
        customer_phone: customerPhone || undefined,
        shipping_line1: '123 Test Street',
        shipping_city: 'Test City',
        shipping_state: 'TS',
        shipping_postal_code: '12345',
        shipping_country: 'US',
        subtotal: totalPrice,
        shipping_cost: 0,
        tax_amount: 0,
        total_amount: totalPrice,
        currency: 'usd',
        items: items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_description: item.description || `Product: ${item.name}`, // Include description
          product_image: item.image || null,
          product_clientpathurl: item.clientpathurl || null, // Include clientpathurl
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }))
      };

      console.log('📝 Creating order with ALL FIELDS:', orderData);

      // Create order in database
      const createdOrder = await createOrderInDatabase(orderData);
      console.log('✅ ORDER CREATED IN DATABASE WITH ALL FIELDS:', createdOrder.id);

      // Now proceed with Stripe checkout
      console.log('💳 Proceeding to Stripe checkout...');
      await proceedToCheckout(customerEmail);
      
    } catch (error) {
      console.error('❌ Checkout failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed. Please try again.';
      setCheckoutError(errorMessage);
    } finally {
      setIsCreatingOrder(false);
    }
  };  
  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Your Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </h1>
            
            {items.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                <svg 
                  className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                  />
                </svg>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Your cart is empty
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Looks like you haven't added any products to your cart yet.
                </p>
                <Link 
                  href="/products" 
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <>
                {/* Debug info in development - showing ALL fields */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-800 mb-2">Debug Info - Cart Items with ALL Fields:</h3>
                    <pre className="text-xs text-blue-700 overflow-auto max-h-40">
                      {JSON.stringify(items, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Cart Items
                    </h2>
                    <button
                      onClick={clearCart}
                      className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Clear Cart
                    </button>
                  </div>
                  
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map(item => (
                      <li key={item.id} className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 relative w-16 h-16 rounded overflow-hidden">
                            {item.image && item.image !== "/placeholder-product.jpg" ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">No Image</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ${item.price.toFixed(2)} each
                            </p>
                            {/* Show description if available */}
                            {item.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            {/* Show clientpathurl if available */}
                            {item.clientpathurl && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                URL: {item.clientpathurl}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            
                            <span className="text-gray-900 dark:text-white font-medium">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white font-medium">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className="text-gray-900 dark:text-white font-medium">Free</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="text-gray-900 dark:text-white font-medium">$0.00</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Customer Information Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Customer Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="customerEmail"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        id="customerPhone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  {checkoutError && (
                    <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-md">
                      {checkoutError}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <Link 
                    href="/products" 
                    className="inline-block px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
                  >
                    Continue Shopping
                  </Link>
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || isCreatingOrder}
                    className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingOrder ? 'Creating Order...' : isCheckingOut ? 'Processing...' : 'Create Order & Checkout'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}