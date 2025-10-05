'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Image from 'next/image';

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
    applyDeal,
    removeDeal,
    proceedToCheckout,
    isCheckingOut
  } = useCart();

  const [dealCode, setDealCode] = useState('');
  const [dealMessage, setDealMessage] = useState('');
  const [isApplyingDeal, setIsApplyingDeal] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleApplyDeal = async () => {
    if (!dealCode.trim()) {
      setDealMessage('Please enter a deal code');
      return;
    }

    setIsApplyingDeal(true);
    setDealMessage('');

    try {
      const result = await applyDeal(dealCode.trim());
      setDealMessage(result.message);
      
      if (result.isValid) {
        setDealCode('');
      }
    } catch (error) {
      console.error('Error applying deal:', error);
      setDealMessage('Error applying deal. Please try again.');
    } finally {
      setIsApplyingDeal(false);
    }
  };

  const handleRemoveDeal = () => {
    removeDeal();
    setDealMessage('');
  };

  const handleCheckout = async () => {
    try {
      setCheckoutError('');
      console.log('Starting checkout with items:', items);
      // 🔥 FIXED: Remove customerEmail parameter - Stripe will collect it
      await proceedToCheckout();
    } catch (error) {
      console.error('Checkout failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed. Please try again.';
      setCheckoutError(errorMessage);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-6">Add some items to your cart to continue shopping.</p>
            <Link 
              href="/products" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const cartDiscountAmount = appliedDeal ? appliedDeal.discountAmount : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {item.image && (
                      <Image 
                        src={item.image} 
                        alt={item.name}
                        width={64}
                        height={64}
                        className="object-cover rounded"
                        priority={false}
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      {item.deal && (
                        <p className="text-sm text-green-600">
                          Product Deal: {item.deal.code} 
                          {item.productDiscountAmount && item.productDiscountAmount > 0 && (
                            <span> (-${(item.productDiscountAmount * item.quantity).toFixed(2)})</span>
                          )}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 text-sm">
                        {item.originalPrice && item.originalPrice !== item.price ? (
                          <>
                            <span className="line-through text-gray-500">
                              ${item.originalPrice.toFixed(2)}
                            </span>
                            <span className="font-semibold text-green-600">
                              ${item.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold">
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          <div className="flex justify-between items-center">
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-800"
            >
              Clear Cart
            </button>
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-800"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Items ({totalItems})</span>
                  <span>${(subtotal + productDiscountTotal).toFixed(2)}</span>
                </div>
                
                {productDiscountTotal > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Product Discounts</span>
                    <span>-${productDiscountTotal.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                {appliedDeal && cartDiscountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Cart Discount ({appliedDeal.deal.code})</span>
                    <span>-${cartDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Deal Code Section */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Deal Code</h3>
                {appliedDeal ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                    <div>
                      <span className="font-medium text-green-800">{appliedDeal.deal.code}</span>
                      <p className="text-sm text-green-600">
                        -{appliedDeal.deal.discount_type === 'percentage' 
                          ? `${appliedDeal.deal.discount_value}%` 
                          : `$${appliedDeal.deal.discount_value}`} applied
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveDeal}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={dealCode}
                        onChange={(e) => setDealCode(e.target.value)}
                        placeholder="Enter deal code"
                        className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isApplyingDeal}
                      />
                      <button
                        onClick={handleApplyDeal}
                        disabled={isApplyingDeal || !dealCode.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isApplyingDeal ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {dealMessage && (
                      <p className={`text-sm ${dealMessage.includes('Error') || dealMessage.includes('expired') || dealMessage.includes('invalid') ? 'text-red-600' : 'text-green-600'}`}>
                        {dealMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <div className="space-y-4">
                {checkoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-600 text-sm">{checkoutError}</p>
                  </div>
                )}
                
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                  You&apos;ll be redirected to Stripe to complete your payment securely
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}