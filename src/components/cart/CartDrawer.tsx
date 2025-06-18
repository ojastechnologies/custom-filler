import React from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import DealInput from './DealInput';
import Link from 'next/link';
import { Deal } from '@/types/product';

// Helper function to check if deal is valid for product - 🔥 FIXED: Proper typing
const isDealValidForProduct = (deal: Deal, originalPrice: number, quantity: number): boolean => {
  if (!deal || !deal.is_active) return false;
  
  // Check expiration
  if (deal.expires_at && new Date(deal.expires_at) < new Date()) return false;
  
  // Check usage limit
  if (deal.usage_limit && deal.usage_count >= deal.usage_limit) return false;
  
  // Check if total order value meets minimum requirement
  const totalOrderValue = originalPrice * quantity;
  if (deal.minimum_order_amount && totalOrderValue < deal.minimum_order_amount) return false;
  
  return true;
};

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { 
    items, 
    removeFromCart, 
    totalItems, 
    subtotal, 
    productDiscountTotal,
    finalTotal, 
    appliedDeal,
    proceedToCheckout, 
    isCheckingOut 
  } = useCart();

  const handleCheckout = async () => {
    try {
      console.log('🛒 CartDrawer: Starting checkout...');
      console.log('🛒 CartDrawer: Items in cart:', items);
      console.log('🛒 CartDrawer: Applied deal:', appliedDeal);
      
      await proceedToCheckout();
    } catch (error) {
      console.error('❌ CartDrawer: Checkout failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Checkout failed. Please try again.';
      
      alert(`Checkout Error: ${errorMessage}`);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Your Cart ({totalItems})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
              Your cart is empty.
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 mb-6">
                {items.map(item => {
                  // Check if deal is valid for this specific item
                  const hasValidDeal = item.deal && item.originalPrice && 
                    isDealValidForProduct(item.deal, item.originalPrice, item.quantity);
                  
                  const minOrderValueNeeded = item.deal?.minimum_order_amount || 0;
                  const currentItemValue = (item.originalPrice || item.price) * item.quantity;
                  const additionalValueNeeded = Math.max(0, minOrderValueNeeded - currentItemValue);
                  
                  return (
                    <li key={item.id} className="py-4 flex items-center">
                      {item.image && (
                        <div className="relative w-12 h-12 mr-3 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        
                        {/* Show pricing based on deal validity */}
                        {item.originalPrice && item.productDiscountAmount && hasValidDeal ? (
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400 line-through mr-2">
                              ${item.originalPrice.toFixed(2)}
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              ${item.price.toFixed(2)}
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400 block">
                              Save ${item.productDiscountAmount.toFixed(2)} each
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ${item.price.toFixed(2)}
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity}
                        </div>
                        
                        <div className="text-sm font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        
                        {/* Show deal status */}
                        {item.deal && (
                          <div className="mt-1">
                            {hasValidDeal && item.productDiscountAmount ? (
                              <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded inline-block">
                                🎉 {item.deal.description} - Active
                              </div>
                            ) : (
                              <div className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded inline-block">
                                ⏳ {item.deal.code} - Need ${additionalValueNeeded.toFixed(2)} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Deal Input */}
              <div className="mb-6">
                <DealInput />
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            {/* Product-level discounts */}
            {productDiscountTotal > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Product Discounts</span>
                <span>-${productDiscountTotal.toFixed(2)}</span>
              </div>
            )}
            
            {/* Cart-level discount */}
            {appliedDeal && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Cart Discount ({appliedDeal.deal.code})</span>
                <span>-${appliedDeal.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
            
            {/* Total savings */}
            {(productDiscountTotal > 0 || appliedDeal) && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                <span>Total Savings</span>
                <span>-${(productDiscountTotal + (appliedDeal?.discountAmount || 0)).toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Link
              href="/cart"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded text-center hover:bg-primary-700 text-sm"
              onClick={onClose}
            >
              View Cart
            </Link>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || items.length === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded text-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isCheckingOut ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}