"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

type CheckoutStep = 'customer-details' | 'delivery-method' | 'payment' | 'review';

import { useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  interface Product {
    id: number;
    title: string;
    price: number;
    image?: string;
  }
  const [product, setProduct] = useState<Product | null>(null);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('customer-details');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    country: 'US',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    promoCode: '',
    deliveryMethod: 'free',
    sameAsBilling: true,
  });
  
  useEffect(() => {
    const productParam = searchParams.get('product');
    if (productParam) {
      try {
        const parsedProduct = JSON.parse(decodeURIComponent(productParam));
        setProduct(parsedProduct);
      } catch (error) {
        console.error('Error parsing product data:', error);
      }
    } else {
      // Fallback product for testing
      setProduct({
        id: 1,
        title: 'PHONE CASE',
        price: 15.00,
        image: 'https://via.placeholder.com/400x300/333333/FFFFFF?text=Phone+Case'
      });
    }
  }, [searchParams]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleContinue = () => {
    if (currentStep === 'customer-details') {
      setCurrentStep('delivery-method');
    } else if (currentStep === 'delivery-method') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
    }
  };
  
  const handleEdit = (step: CheckoutStep) => {
    setCurrentStep(step);
  };
  
  const handlePlaceOrder = () => {
    alert('Order placed successfully!');
    // Here you would typically process the payment and create the order
  };
  
  if (!product) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              CHECKOUT
            </h1>
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <Link href="/services" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 md:mb-0">
                ← Continue Browsing
              </Link>
              
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4 md:mb-0 w-full md:w-auto">
                Express checkout
              </button>
              
              <div className="text-gray-600 dark:text-gray-400">
                <span>or</span>
                <Link href="/auth/enter-portal-9f3b2" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">
                  Have an account? Log in
                </Link>
              </div>
            </div>
            
            {/* Checkout Steps Indicator */}
            <div className="mb-8">
              <div className="flex justify-between">
                <div className={`flex flex-col items-center ${currentStep === 'customer-details' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${currentStep === 'customer-details' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    1
                  </div>
                  <span className="text-sm">Details</span>
                </div>
                <div className="flex-1 flex items-center">
                  <div className={`h-1 w-full ${currentStep !== 'customer-details' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                </div>
                <div className={`flex flex-col items-center ${currentStep === 'delivery-method' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${currentStep === 'delivery-method' ? 'bg-blue-600 text-white' : currentStep === 'payment' || currentStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    2
                  </div>
                  <span className="text-sm">Delivery</span>
                </div>
                <div className="flex-1 flex items-center">
                  <div className={`h-1 w-full ${currentStep === 'payment' || currentStep === 'review' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                </div>
                <div className={`flex flex-col items-center ${currentStep === 'payment' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${currentStep === 'payment' ? 'bg-blue-600 text-white' : currentStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    3
                  </div>
                  <span className="text-sm">Payment</span>
                </div>
                <div className="flex-1 flex items-center">
                  <div className={`h-1 w-full ${currentStep === 'review' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                </div>
                <div className={`flex flex-col items-center ${currentStep === 'review' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${currentStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    4
                  </div>
                  <span className="text-sm">Review</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Checkout Form */}
              <div className="w-full lg:w-2/3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
                  {/* Customer Details Step */}
                  {currentStep === 'customer-details' && (
                    <>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Customer details
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="col-span-2">
                          <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 mb-1">
                            Email*
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="firstName" className="block text-gray-700 dark:text-gray-300 mb-1">
                            First name*
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-gray-700 dark:text-gray-300 mb-1">
                            Last name*
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label htmlFor="phone" className="block text-gray-700 dark:text-gray-300 mb-1">
                            Phone*
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Delivery details
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="col-span-2">
                          <label htmlFor="country" className="block text-gray-700 dark:text-gray-300 mb-1">
                            Country/Region*
                          </label>
                          <select
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="MX">Mexico</option>
                            <option value="UK">United Kingdom</option>
                            <option value="NP">Nepal</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label htmlFor="address" className="block text-gray-700 dark:text-gray-300 mb-1">
                            Address*
                          </label>
                          <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="city" className="block text-gray-700 dark:text-gray-300 mb-1">
                            City*
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-gray-700 dark:text-gray-300 mb-1">
                            State*
                          </label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="col-span-2">
                        <label htmlFor="zipCode" className="block text-gray-700 dark:text-gray-300 mb-1">
                            Zip / Postal code*
                          </label>
                          <input
                            type="text"
                            id="zipCode"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Continue
                      </button>
                    </>
                  )}
                  
                  {/* Delivery Method Step */}
                  {currentStep === 'delivery-method' && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Customer & delivery details
                        </h2>
                        <button 
                          onClick={() => handleEdit('customer-details')}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Edit
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.firstName} {formData.lastName}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">{formData.email}</p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.address}, {formData.city}, {formData.state} {formData.zipCode}, {formData.country}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">{formData.phone}</p>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Delivery method
                      </h2>
                      
                      <div className="space-y-4 mb-6">
                        <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="free"
                            checked={formData.deliveryMethod === 'free'}
                            onChange={handleInputChange}
                            className="h-5 w-5 text-blue-600"
                          />
                          <div className="ml-4 flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">Free Shipping</div>
                            <div className="text-gray-600 dark:text-gray-400">5-7 business days</div>
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">Free</div>
                        </label>
                        
                        <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="standard"
                            checked={formData.deliveryMethod === 'standard'}
                            onChange={handleInputChange}
                            className="h-5 w-5 text-blue-600"
                          />
                          <div className="ml-4 flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">Standard Shipping</div>
                            <div className="text-gray-600 dark:text-gray-400">2-4 business days</div>
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">$4.99</div>
                        </label>
                        
                        <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="express"
                            checked={formData.deliveryMethod === 'express'}
                            onChange={handleInputChange}
                            className="h-5 w-5 text-blue-600"
                          />
                          <div className="ml-4 flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">Express Shipping</div>
                            <div className="text-gray-600 dark:text-gray-400">1-2 business days</div>
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">$9.99</div>
                        </label>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Continue
                      </button>
                    </>
                  )}
                  
                  {/* Payment Step */}
                  {currentStep === 'payment' && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Customer & delivery details
                        </h2>
                        <button 
                          onClick={() => handleEdit('customer-details')}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Edit
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.firstName} {formData.lastName}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">{formData.email}</p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.address}, {formData.city}, {formData.state} {formData.zipCode}, {formData.country}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">{formData.phone}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Delivery method
                        </h2>
                        <button 
                          onClick={() => handleEdit('delivery-method')}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Edit
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.deliveryMethod === 'free' && 'Free Shipping'}
                          {formData.deliveryMethod === 'standard' && 'Standard Shipping'}
                          {formData.deliveryMethod === 'express' && 'Express Shipping'}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.deliveryMethod === 'free' && 'Free'}
                          {formData.deliveryMethod === 'standard' && '$4.99'}
                          {formData.deliveryMethod === 'express' && '$9.99'}
                        </p>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Payment
                      </h2>
                      
                      <div className="space-y-6 mb-6">
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Payment method</h3>
                          
                          <div className="space-y-4">
                            <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="credit"
                                defaultChecked
                                className="h-5 w-5 text-blue-600"
                              />
                              <div className="ml-4 flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">Credit Card</div>
                              </div>
                              <div className="flex space-x-2">
                                <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                              </div>
                            </label>
                            
                            <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="paypal"
                                className="h-5 w-5 text-blue-600"
                              />
                              <div className="ml-4 flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">PayPal</div>
                              </div>
                              <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </label>
                          </div>
                        </div>
                        
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Billing address</h3>
                          
                          <label className="flex items-center mb-4">
                            <input
                              type="checkbox"
                              name="sameAsBilling"
                              checked={formData.sameAsBilling}
                              onChange={handleInputChange}
                              className="h-5 w-5 text-blue-600 rounded"
                            />
                            <span className="ml-2 text-gray-700 dark:text-gray-300">
                              Same as delivery address
                            </span>
                          </label>
                          
                          {!formData.sameAsBilling && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="col-span-2">
                                <label htmlFor="billingAddress" className="block text-gray-700 dark:text-gray-300 mb-1">
                                  Address*
                                </label>
                                <input
                                  type="text"
                                  id="billingAddress"
                                  name="billingAddress"
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                              </div>
                              <div>
                                <label htmlFor="billingCity" className="block text-gray-700 dark:text-gray-300 mb-1">
                                  City*
                                </label>
                                <input
                                  type="text"
                                  id="billingCity"
                                  name="billingCity"
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                              </div>
                              <div>
                                <label htmlFor="billingState" className="block text-gray-700 dark:text-gray-300 mb-1">
                                  State*
                                </label>
                                <input
                                  type="text"
                                  id="billingState"
                                  name="billingState"
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                              </div>
                              <div className="col-span-2">
                                <label htmlFor="billingZipCode" className="block text-gray-700 dark:text-gray-300 mb-1">
                                  Zip / Postal code*
                                </label>
                                <input
                                  type="text"
                                  id="billingZipCode"
                                  name="billingZipCode"
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Continue
                      </button>
                    </>
                  )}
                  
                  {/* Review Step */}
                  {currentStep === 'review' && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Customer & delivery details
                        </h2>
                        <button 
                          onClick={() => handleEdit('customer-details')}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Edit
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.firstName} {formData.lastName}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">{formData.email}</p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.address}, {formData.city}, {formData.state} {formData.zipCode}, {formData.country}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">{formData.phone}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Delivery method
                        </h2>
                        <button 
                          onClick={() => handleEdit('delivery-method')}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Edit
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.deliveryMethod === 'free' && 'Free Shipping'}
                          {formData.deliveryMethod === 'standard' && 'Standard Shipping'}
                          {formData.deliveryMethod === 'express' && 'Express Shipping'}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {formData.deliveryMethod === 'free' && 'Free'}
                          {formData.deliveryMethod === 'standard' && '$4.99'}
                          {formData.deliveryMethod === 'express' && '$9.99'}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Payment
                        </h2>
                        <button 
                          onClick={() => handleEdit('payment')}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Edit
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <p className="text-gray-700 dark:text-gray-300">
                          Billing address: {formData.sameAsBilling ? 'Same as delivery address' : 'Different billing address'}
                        </p>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Review & place order
                      </h2>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          Review your details above and continue when you&apos;re ready.
                        </p>
                        
                        <button
                          type="button"
                          onClick={handlePlaceOrder}
                          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Place Order & Pay
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="w-full lg:w-1/3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 sticky top-24">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Order summary (1)
                  </h2>
                  
                  <div className="mb-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Number of items 1
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden mr-4">
                        <Image
                          src={product.image || 'https://via.placeholder.com/400x300/333333/FFFFFF?text=Product'}
                          alt={product.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {product.title.toUpperCase()}
                        </h3>
                        <div className="text-blue-600 dark:text-blue-400 font-bold">
                          ${product.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-gray-700 dark:text-gray-300 mb-2">
                      <span>Price</span>
                      <span>${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300 mb-2">
                      <span>Qty:</span>
                      <span>1</span>
                    </div>
                  </div>
                  
                  {/* Promo Code */}
                  <div className="mb-6">
                    <div className="flex">
                      <input
                        type="text"
                        name="promoCode"
                        value={formData.promoCode}
                        onChange={handleInputChange}
                        placeholder="Enter a promo code"
                        className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-r-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  
                  {/* Order Totals */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                    <div className="flex justify-between text-gray-700 dark:text-gray-300 mb-2">
                      <span>Subtotal</span>
                      <span>${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300 mb-2">
                      <span>Delivery</span>
                      <span>
                        {formData.deliveryMethod === 'free' && 'Free'}
                        {formData.deliveryMethod === 'standard' && '$4.99'}
                        {formData.deliveryMethod === 'express' && '$9.99'}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300 mb-2">
                      <span>Sales Tax</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white mt-4">
                      <span>Total</span>
                      <span>
                        ${(product.price + 
                          (formData.deliveryMethod === 'standard' ? 4.99 : 
                           formData.deliveryMethod === 'express' ? 9.99 : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Checkout Button */}
                  {currentStep === 'review' ? (
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Secure Checkout
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Continue
                    </button>
                  )}
                  
                  {/* Payment Methods */}
                  <div className="mt-4 flex justify-center space-x-2">
                    <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-10 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading checkout...</h1>
        </div>
        <Footer />
      </>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
