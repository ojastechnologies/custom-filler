"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';

export default function CheckoutPage() {
  const { items, finalTotal, clearCart, proceedToCheckout, isCheckingOut } = useCart();
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    name: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setCustomerInfo(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setCustomerInfo(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Updated handlePlaceOrder function that creates order in database
  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setOrderError('Your cart is empty');
      return;
    }

    if (!customerInfo.email || !customerInfo.name) {
      setOrderError('Please fill in required fields (Name and Email)');
      return;
    }

    setIsProcessing(true);
    setOrderError('');

    try {
      console.log('🛒 Creating order with items:', items);
      console.log('👤 Customer info:', customerInfo);

      // Create order in database first
      const orderData = {
        customer_email: customerInfo.email,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone || null,
        
        // Shipping Address
        shipping_line1: customerInfo.address.line1 || null,
        shipping_line2: customerInfo.address.line2 || null,
        shipping_city: customerInfo.address.city || null,
        shipping_state: customerInfo.address.state || null,
        shipping_postal_code: customerInfo.address.postal_code || null,
        shipping_country: customerInfo.address.country || 'US',
        
        // Order totals
        subtotal: finalTotal,
        shipping_cost: 0, // You can calculate shipping cost here
        tax_amount: 0, // You can calculate tax here
        total_amount: finalTotal,
        currency: 'usd',
        status: 'pending',
        
        // Order items
        items: items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_description: `Product: ${item.name}`,
          product_image: item.image || null,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }))
      };

      // Call API to create order
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      console.log('✅ Order created successfully:', result.order.id);

      // Now proceed to Stripe checkout with the order ID
      await proceedToCheckout();
      
      // Clear cart after successful order creation
      clearCart();
      
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      setOrderError(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Your cart is empty
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Add some products to your cart before checking out.
              </p>
              <Link
                href="/products"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Browse Products
              </Link>
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Checkout
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer Information Form */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Customer Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                  Shipping Address
                </h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="address.line1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      id="address.line1"
                      name="address.line1"
                      value={customerInfo.address.line1}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="address.line2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      id="address.line2"
                      name="address.line2"
                      value={customerInfo.address.line2}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        id="address.city"
                        name="address.city"
                        value={customerInfo.address.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        id="address.state"
                        name="address.state"
                        value={customerInfo.address.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="address.postal_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        id="address.postal_code"
                        name="address.postal_code"
                        value={customerInfo.address.postal_code}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country
                      </label>
                      <select
                        id="address.country"
                        name="address.country"
                        value={customerInfo.address.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      {item.image && (
                        <div className="w-16 h-16 relative">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">${finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className="text-gray-900 dark:text-white">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="text-gray-900 dark:text-white">$0.00</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {orderError && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-md">
                    {orderError}
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || isCheckingOut}
                  className="w-full mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Creating Order...' : isCheckingOut ? 'Redirecting to Payment...' : 'Place Order & Pay'}
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  You will be redirected to Stripe for secure payment processing
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
