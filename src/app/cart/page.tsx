"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DealInput from '@/components/cart/DealInput';
import { useCart } from '@/context/CartContext';
// import { Deal } from '@/types/product';

// Helper function to check if deal is valid for product - 🔥 FIXED: Proper typing
// const isDealValidForProduct = (deal: Deal, originalPrice: number, quantity: number): boolean => {
//   if (!deal || !deal.is_active) return false;
  
//   // Check expiration
//   if (deal.expires_at && new Date(deal.expires_at) < new Date()) return false;
  
//   // Check usage limit
//   if (deal.usage_limit && deal.usage_count >= deal.usage_limit) return false;
  
//   // Check if total order value meets minimum requirement
//   const totalOrderValue = originalPrice * quantity;
//   if (deal.minimum_order_amount && totalOrderValue < deal.minimum_order_amount) return false;
  
//   return true;
// };

// // Helper function to calculate product discount - 🔥 ADDED: For potential savings calculation
// const calculateProductDiscount = (originalPrice: number, deal: Deal): number => {
//   if (!deal || !deal.is_active) return 0;
  
//   let discountAmount = 0;
//   if (deal.discount_type === 'percentage') {
//     discountAmount = originalPrice * (deal.discount_value / 100);
//   } else {
//     discountAmount = deal.discount_value;
//   }
  
//   // Apply maximum discount limit if set
//   if (deal.maximum_discount_amount && discountAmount > deal.maximum_discount_amount) {
//     discountAmount = deal.maximum_discount_amount;
//   }
  
//   // Ensure discount doesn't exceed original price
//   discountAmount = Math.min(discountAmount, originalPrice - 0.01);
  
//   return Math.max(0, discountAmount);
// };

export default function CartPage() {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    totalItems, 
    subtotal, 
    finalTotal, 
    productDiscountTotal,
    appliedDeal,
    proceedToCheckout, 
    isCheckingOut 
  } = useCart();
  const [customerEmail, setCustomerEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  
  const handleCheckout = async () => {
    try {
      setCheckoutError('');
      console.log('Starting checkout with items:', items);
      await proceedToCheckout(customerEmail);
    } catch (error) {
      console.error('Checkout failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed. Please try again.';
      setCheckoutError(errorMessage);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent mb-4">
                Shopping Cart
              </h1>
              <div className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
                </span>
              </div>
            </div>
            
            {items.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                <div className="relative mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center shadow-inner">
                    <svg 
                      className="w-12 h-12 text-gray-400 dark:text-gray-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                      />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <span className="text-xs text-red-600 dark:text-red-400 font-bold">0</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Your cart is empty
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                  Discover amazing products and start building your perfect order. Your next favorite item is just a click away!
                </p>
                <Link 
                  href="/products" 
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Browse Products
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Enhanced Cart Items */}
                  <div className="xl:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-primary-500 rounded-full mr-3 animate-pulse"></div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                              Cart Items
                            </h2>
                          </div>
                          <button
                            onClick={clearCart}
                            className="flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear Cart
                          </button>
                        </div>
                      </div>
                      
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map((item, index) => (
                          <li key={item.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group">
                            <div className="flex items-center space-x-6">
                              {/* Enhanced Product Image */}
                              <div className="flex-shrink-0 relative">
                                <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300 border-2 border-gray-200 dark:border-gray-600">
                                  {item.image && item.image !== "/placeholder-product.jpg" ? (
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                      <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                {/* Item number badge */}
                                <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                  {index + 1}
                                </div>
                              </div>
                              
                              {/* Enhanced Product Details */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                  {item.name}
                                </h3>
                                
                                {/* Enhanced Pricing */}
                                {item.originalPrice && item.productDiscountAmount ? (
                                  <div className="mb-3">
                                    <div className="flex items-center space-x-3 mb-1">
                                      <span className="text-gray-500 dark:text-gray-400 line-through text-sm">
                                        ${item.originalPrice.toFixed(2)} each
                                      </span>
                                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                        ${item.price.toFixed(2)} each
                                      </span>
                                    </div>
                                    <div className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Save ${item.productDiscountAmount.toFixed(2)} per item
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    ${item.price.toFixed(2)} each
                                  </p>
                                )}
                                
                                {item.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                                    {item.description}
                                  </p>
                                )}
                                
                                {/* Enhanced Deal Badge */}
                                {item.deal && item.productDiscountAmount && (
                                  <div className="mb-2">
                                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 rounded-full border border-green-200 dark:border-green-700">
                                      🎉 {item.deal.code} - {item.deal.description}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Enhanced Quantity Controls */}
                              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-2 rounded-lg bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 hover:text-gray-800 dark:hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                
                                <span className="text-gray-900 dark:text-white font-bold min-w-[3rem] text-center text-lg">
                                  {item.quantity}
                                </span>
                                
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-2 rounded-lg bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 hover:text-gray-800 dark:hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </button>
                              </div>
                              
                              {/* Enhanced Price and Remove */}
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  {/* Enhanced savings display */}
                                  {item.originalPrice && item.productDiscountAmount && (
                                    <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                                      💰 Save ${(item.productDiscountAmount * item.quantity).toFixed(2)}
                                    </div>
                                  )}
                                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 group"
                                >
                                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Enhanced Order Summary */}
                  <div className="xl:col-span-1">
                    <div className="sticky top-24 space-y-6">
                      {/* Enhanced Order Summary Card */}
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                        <div className="flex items-center mb-6">
                          <div className="w-3 h-3 bg-primary-500 rounded-full mr-3"></div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Order Summary
                          </h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal</span>
                            <span className="text-gray-900 dark:text-white font-bold text-lg">${subtotal.toFixed(2)}</span>
                          </div>
                          
                          {/* Enhanced product-level discounts */}
                          {productDiscountTotal > 0 && (
                            <div className="flex justify-between items-center py-2 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 -mx-1">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-green-700 dark:text-green-300 font-medium">Product Discounts</span>
                              </div>
                              <span className="text-green-700 dark:text-green-300 font-bold">-${productDiscountTotal.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {/* Enhanced cart-level discount */}
                          {appliedDeal && (
                            <div className="flex justify-between items-center py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 -mx-1">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                                </svg>
                                <span className="text-blue-700 dark:text-blue-300 font-medium">Cart Discount ({appliedDeal.deal.code})</span>
                              </div>
                              <span className="text-blue-700 dark:text-blue-300 font-bold">-${appliedDeal.discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Shipping</span>
                            <span className="text-gray-900 dark:text-white font-medium text-sm">Calculated at checkout</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Tax</span>
                            <span className="text-gray-900 dark:text-white font-medium text-sm">Calculated at checkout</span>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                          
                          <div className="flex justify-between items-center py-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl px-4 -mx-1">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">Total</span>
                            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">${finalTotal.toFixed(2)}</span>
                          </div>
                          
                          {/* Enhanced total savings */}
                          {(productDiscountTotal > 0 || appliedDeal) && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <span className="text-2xl mr-2">🎉</span>
                                  <span className="font-bold text-green-700 dark:text-green-300">Total Savings</span>
                                </div>
                                <span className="text-xl font-bold text-green-700 dark:text-green-300">
                                  ${(productDiscountTotal + (appliedDeal?.discountAmount || 0)).toFixed(2)}
                                </span>
                              </div>
                              {productDiscountTotal > 0 && (
                                <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Includes ${productDiscountTotal.toFixed(2)} in product discounts
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Deal Input */}
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-yellow-200 dark:border-yellow-700">
                          <div className="flex items-center">
                            <span className="text-xl mr-2">🏷️</span>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Have a promo code?</h4>
                          </div>
                        </div>
                        <div className="p-4">
                          <DealInput />
                        </div>
                      </div>

                      {/* Enhanced Checkout Section */}
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center mb-6">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Checkout Information
                          </h3>
                        </div>
                        
                        <div className="mb-6">
                          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Email Address (Optional)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                              </svg>
                            </div>
                            <input
                              type="email"
                              id="email"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            We&apos;ll send your receipt to this email address
                          </p>
                        </div>
                        
                        {checkoutError && (
                          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-xl flex items-start">
                            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <div>
                              <p className="font-medium">Checkout Error</p>
                              <p className="text-sm mt-1">{checkoutError}</p>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleCheckout}
                          disabled={isCheckingOut}
                          className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                        >
                          {isCheckingOut ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              Proceed to Stripe Checkout
                            </>
                          )}
                        </button>
                        
                        {/* Security badges */}
                        <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Secure
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            SSL Protected
                          </div>
                        </div>
                      </div>
                    
                      {/* Enhanced Continue Shopping */}
                      <div className="text-center">
                        <Link 
                          href="/products" 
                          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-white rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                          Continue Shopping
                        </Link>
                      </div>
                    </div>
                  </div>
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