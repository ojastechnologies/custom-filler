'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { validateDealCode, Deal } from '@/services/dealService';
import { createOrderInDatabase, CreateOrderData } from '@/services/ordersService';

// Update the Product and CartItem interfaces to include deal information
export interface Product {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  image?: string;
  description?: string;
  clientpathurl?: string;
  deal_id?: string;
  deal?: Deal;
  stripe_product_id?: string;
  stripe_price_id?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  clientpathurl?: string;
  deal_id?: string;
  deal?: Deal;
  originalPrice?: number; // NEW: Store original price before product discount
  productDiscountAmount?: number; // NEW: Store product-level discount amount (applied once)
  stripe_product_id?: string;
  stripe_price_id?: string;
}

export interface AppliedDeal {
  deal: Deal;
  discountAmount: number;
}

// Helper function to check if a deal is valid and active
const isDealValid = (deal: Deal): boolean => {
  if (!deal || !deal.is_active) return false;
  
  // Check expiration
  if (deal.expires_at && new Date(deal.expires_at) < new Date()) return false;
  
  // Check usage limit
  if (deal.usage_limit && deal.usage_count >= deal.usage_limit) return false;
  
  return true;
};

// 🔥 FIXED: Helper function to calculate product discount - 🔥 FIXED
const calculateProductDiscount = (originalPrice: number, quantity: number, deal: Deal): { discountPerItem: number, totalDiscount: number } => {
  if (!isDealValid(deal)) return { discountPerItem: 0, totalDiscount: 0 };
  
  const totalItemValue = originalPrice * quantity;
  
  // Check if total item value meets minimum order amount
  if (deal.minimum_order_amount && totalItemValue < deal.minimum_order_amount) {
    return { discountPerItem: 0, totalDiscount: 0 };
  }
  
  let totalDiscountAmount = 0;
  if (deal.discount_type === 'percentage') {
    totalDiscountAmount = totalItemValue * (deal.discount_value / 100);
  } else {
    totalDiscountAmount = deal.discount_value;
  }
  
  // Apply maximum discount limit if set
  if (deal.maximum_discount_amount && totalDiscountAmount > deal.maximum_discount_amount) {
    totalDiscountAmount = deal.maximum_discount_amount;
  }
  
  // Ensure discount doesn't exceed total item value
  totalDiscountAmount = Math.min(totalDiscountAmount, totalItemValue - 0.01);
  totalDiscountAmount = Math.max(0, totalDiscountAmount);
  
  const discountPerItem = totalDiscountAmount / quantity;
  
  return { discountPerItem, totalDiscount: totalDiscountAmount };
};

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  finalTotal: number;
  productDiscountTotal: number; // NEW: Total product-level discounts
  appliedDeal: AppliedDeal | null;
  applyDeal: (code: string) => Promise<{ isValid: boolean; message: string }>;
  removeDeal: () => void;
  proceedToCheckout: () => Promise<void>; // 🔥 FIXED: Removed customerEmail parameter
  isCheckingOut: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedDeal, setAppliedDeal] = useState<AppliedDeal | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      const savedDeal = localStorage.getItem('appliedDeal');
      
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setItems(parsedCart);
        } else {
          console.warn('Invalid cart data in localStorage, resetting to empty array');
          setItems([]);
          localStorage.removeItem('cart');
        }
      }
      
      if (savedDeal) {
        const parsedDeal = JSON.parse(savedDeal);
        setAppliedDeal(parsedDeal);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setItems([]);
      setAppliedDeal(null);
      localStorage.removeItem('cart');
      localStorage.removeItem('appliedDeal');
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('cart', JSON.stringify(items));
    } else {
      localStorage.removeItem('cart');
    }
  }, [items]);

  // Save applied deal to localStorage
  useEffect(() => {
    if (appliedDeal) {
      localStorage.setItem('appliedDeal', JSON.stringify(appliedDeal));
    } else {
      localStorage.removeItem('appliedDeal');
    }
  }, [appliedDeal]);

  const addToCart = useCallback((newItem: CartItem) => {
    console.log('🛒 Adding to cart:', newItem);
    
    setItems(prevItems => {
      const safeItems = Array.isArray(prevItems) ? prevItems : [];
      const existingItem = safeItems.find(item => item.id === newItem.id);
      
      // Calculate product-level discount
      let processedItem = { ...newItem };
      if (newItem.deal && isDealValid(newItem.deal)) {
        const originalPrice = newItem.price;
        const quantity = newItem.quantity || 1;
        
        // 🔥 FIXED: Calculate discount on total value, then divide by quantity
        const { discountPerItem, totalDiscount } = calculateProductDiscount(originalPrice, quantity, newItem.deal);
        
        if (totalDiscount > 0) {
          const discountedPrice = originalPrice - discountPerItem;
          
          processedItem = {
            ...newItem,
            originalPrice,
            productDiscountAmount: discountPerItem,
            price: discountedPrice
          };
          
          console.log('🎉 Applied product discount:', {
            originalPrice,
            quantity,
            totalItemValue: originalPrice * quantity,
            minimumRequired: newItem.deal.minimum_order_amount,
            totalDiscountAmount: totalDiscount,
            discountPerItem,
            finalPricePerItem: discountedPrice,
            deal: newItem.deal.code
          });
        } else {
          processedItem = {
            ...newItem,
            originalPrice,
            productDiscountAmount: 0,
            price: originalPrice
          };
          
          console.log('⏳ Product discount not applied - minimum order amount not met:', {
            originalPrice,
            quantity,
            totalItemValue: originalPrice * quantity,
            minimumRequired: newItem.deal.minimum_order_amount,
            deal: newItem.deal.code
          });
        }
      }
      
      if (existingItem) {
        // When updating existing item, recalculate discount based on new quantity
        const newQuantity = existingItem.quantity + (processedItem.quantity || 1);
        let updatedItem = { ...existingItem, quantity: newQuantity };
        
        // Recalculate product discount with new quantity
        if (existingItem.deal && existingItem.originalPrice && isDealValid(existingItem.deal)) {
          const { discountPerItem, totalDiscount } = calculateProductDiscount(
            existingItem.originalPrice, 
            newQuantity, 
            existingItem.deal
          );
          
          if (totalDiscount > 0) {
            updatedItem = {
              ...updatedItem,
              productDiscountAmount: discountPerItem,
              price: existingItem.originalPrice - discountPerItem
            };
            
            console.log('🔄 Recalculated product discount for existing item:', {
              newQuantity,
              totalItemValue: existingItem.originalPrice * newQuantity,
              totalDiscountAmount: totalDiscount,
              discountPerItem,
              deal: existingItem.deal.code
            });
          } else {
            updatedItem = {
              ...updatedItem,
              productDiscountAmount: 0,
              price: existingItem.originalPrice
            };
            
            console.log('⏳ Removed product discount - minimum no longer met:', {
              newQuantity,
              totalItemValue: existingItem.originalPrice * newQuantity,
              minimumRequired: existingItem.deal.minimum_order_amount
            });
          }
        }
        
        return safeItems.map(item =>
          item.id === newItem.id ? updatedItem : item
        );
      } else {
        return [...safeItems, { ...processedItem, quantity: processedItem.quantity || 1 }];
      }
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    console.log('🗑️ Removing from cart:', id);
    setItems(prevItems => {
      const safeItems = Array.isArray(prevItems) ? prevItems : [];
      return safeItems.filter(item => item.id !== id);
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    console.log('📝 Updating quantity:', id, quantity);
    
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems(prevItems => {
      const safeItems = Array.isArray(prevItems) ? prevItems : [];
      return safeItems.map(item => {
        if (item.id === id) {
          let updatedItem = { ...item, quantity };
          
          // 🔥 FIXED: Recalculate product discount based on new quantity
          if (item.deal && item.originalPrice && isDealValid(item.deal)) {
            const { discountPerItem, totalDiscount } = calculateProductDiscount(
              item.originalPrice, 
              quantity, 
              item.deal
            );
            
            if (totalDiscount > 0) {
              updatedItem = {
                ...updatedItem,
                productDiscountAmount: discountPerItem,
                price: item.originalPrice - discountPerItem
              };
              
              console.log('🔄 Product discount applied after quantity update:', {
                quantity,
                totalItemValue: item.originalPrice * quantity,
                totalDiscountAmount: totalDiscount,
                discountPerItem,
                deal: item.deal.code
              });
            } else {
              updatedItem = {
                ...updatedItem,
                productDiscountAmount: 0,
                price: item.originalPrice
              };
            }
          }
          
          return updatedItem;
        }
        return item;
      });
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    console.log('🧹 Clearing cart');
    setItems([]);
    setAppliedDeal(null);
  }, []);

  const applyDeal = useCallback(async (code: string) => {
    try {
      console.log('🎫 Applying cart deal:', code);
      
      const safeItems = Array.isArray(items) ? items : [];
      
      if (safeItems.length === 0) {
        return {
          isValid: false,
          message: 'Your cart is empty. Add items before applying a deal.'
        };
      }

      const result = await validateDealCode(code, safeItems);
      
      if (result.isValid && result.deal && result.discountAmount !== undefined) {
        setAppliedDeal({
          deal: result.deal,
          discountAmount: result.discountAmount
        });
        console.log('✅ Cart deal applied successfully:', result);
      }
      
      return {
        isValid: result.isValid,
        message: result.message
      };
    } catch (error) {
      console.error('❌ Error applying deal:', error);
      return {
        isValid: false,
        message: 'Error applying deal. Please try again.'
      };
    }
  }, [items]);

  const removeDeal = useCallback(() => {
    console.log('🗑️ Removing applied cart deal');
    setAppliedDeal(null);
  }, []);

  // 🔥 FIXED: Removed customerEmail parameter since Stripe will collect it
  const proceedToCheckout = useCallback(async () => {
    try {
      setIsCheckingOut(true);
      
      const safeItems = Array.isArray(items) ? items : [];
      
      console.log('🛒 Starting checkout with items:', safeItems);

      if (safeItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // 🔥 FIXED: Calculate totals properly
      const subtotal = safeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const productDiscountTotal = safeItems.reduce((sum, item) => 
        sum + ((item.productDiscountAmount || 0) * item.quantity), 0
      );
      
      // 🔥 FIXED: Cart discount is applied once to the entire cart, not per item
      let cartDiscountAmount = appliedDeal ? appliedDeal.discountAmount : 0;
      
      // Safety check: Ensure cart discount doesn't exceed subtotal
      if (cartDiscountAmount >= subtotal) {
        console.warn('⚠️ Cart discount amount exceeds subtotal, capping discount');
        cartDiscountAmount = Math.max(0, subtotal - 0.50);
      }
      
      const finalTotal = Math.max(0.50, subtotal - cartDiscountAmount);

      console.log('💰 Checkout totals:', { 
        subtotal, 
        productDiscountTotal, 
        cartDiscountAmount, 
        finalTotal,
        appliedDeal: appliedDeal ? {
          code: appliedDeal.deal.code,
          type: appliedDeal.deal.discount_type,
          value: appliedDeal.deal.discount_value,
          calculatedDiscount: cartDiscountAmount
        } : null
      });

      // Validate final total
      if (finalTotal < 0.50) {
        throw new Error('Order total must be at least $0.50');
      }

      // 🔥 FIXED: Create order without customer email - Stripe will update it later
      const orderData: CreateOrderData = {
        customer_email: 'pending@stripe.com', // Temporary email, will be updated from Stripe
        customer_name: undefined, // Will be updated from Stripe session
        customer_phone: undefined, // Will be updated from Stripe session
        subtotal: subtotal + productDiscountTotal, // Original subtotal before any discounts
        shipping_cost: 0,
        tax_amount: 0,
        total_amount: finalTotal,
        currency: 'usd',
        deal_id: appliedDeal?.deal?.id,
        deal_code: appliedDeal?.deal?.code,
        discount_amount: cartDiscountAmount + productDiscountTotal, // Total of both discount types
        items: safeItems.map(item => ({
          id: item.id, // 🔥 FIXED: Use id to match the expected interface
          name: item.name,
          price: item.originalPrice || item.price, // Store original price
          quantity: item.quantity,
          image: item.image || '',
          description: item.description || '',
          clientpathurl: item.clientpathurl || '',
          // Additional fields for order tracking (these don't conflict with the base interface)
          product_id: item.id,
          discounted_price: item.price,
          deal_id: item.deal_id,
          product_discount_amount: item.productDiscountAmount || 0,
          stripe_product_id: item.stripe_product_id,
          stripe_price_id: item.stripe_price_id,
          total_price: item.price * item.quantity
        }))
      };

      console.log('📝 Creating order in database (customer email will be updated from Stripe)');
      
      const createdOrder = await createOrderInDatabase(orderData);
      console.log('✅ Order created in database:', createdOrder.order_number);

      // Construct URLs properly
      const baseUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}`
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${createdOrder.id}&order_number=${createdOrder.order_number}`;
      const cancelUrl = `${baseUrl}/cart`;

      console.log('🔗 Constructed URLs:');
      console.log('- Success URL:', successUrl);
      console.log('- Cancel URL:', cancelUrl);

      // 🔥 FIXED: Prepare complete checkout data for Stripe (no customer email required)
      const checkoutData = {
        orderId: createdOrder.id,
        orderNumber: createdOrder.order_number,
        items: safeItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price, // Use discounted price for Stripe
          quantity: item.quantity,
          image: item.image || '',
          description: item.description || '',
          clientpathurl: item.clientpathurl || '',
          originalPrice: item.originalPrice || item.price,
          productDiscountAmount: item.productDiscountAmount || 0,
          stripe_product_id: item.stripe_product_id, // 🔥 FIXED: Include for Stripe
          stripe_price_id: item.stripe_price_id // 🔥 FIXED: Include for Stripe
        })),
        appliedDeal: appliedDeal ? {
          deal: {
            id: appliedDeal.deal.id,
            code: appliedDeal.deal.code,
            description: appliedDeal.deal.description,
            discount_type: appliedDeal.deal.discount_type,
            discount_value: appliedDeal.deal.discount_value
          },
          discountAmount: cartDiscountAmount // This is the actual calculated discount amount
        } : undefined,
        // 🔥 FIXED: Don't provide customerEmail - let Stripe collect it
        customerEmail: undefined,
        successUrl: successUrl,
        cancelUrl: cancelUrl
      };

      console.log('📤 Sending checkout data to Stripe (Stripe will collect customer email)');

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      console.log('📡 Stripe API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Stripe API error response:', errorText);
        
        let errorData: { error?: string };
        try {
          errorData = JSON.parse(errorText) as { error?: string };
        } catch {
          errorData = { error: errorText || 'Unknown error from Stripe API' };
        }
        
        throw new Error(errorData.error || `Checkout failed with status ${response.status}`);
      }

      const responseData = await response.json() as { url?: string; sessionId?: string };
      console.log('✅ Stripe API success response:', responseData);

      const { url, sessionId } = responseData;
      
      // 🔥 FIXED: Update order with Stripe session ID via API call instead of direct import
      if (sessionId) {
        try {
          const updateResponse = await fetch(`/api/stripe/session/${sessionId}`, {
            method: 'GET'
          });
          
          if (updateResponse.ok) {
            console.log('✅ Order updated with complete Stripe session data');
          } else {
            console.warn('⚠️ Could not update order with Stripe data, but checkout will continue');
          }
        } catch (updateError) {
          console.warn('⚠️ Error updating order with Stripe data:', updateError);
          // Don't fail the checkout for this
        }
      }
      
      if (url) {
        console.log('🔄 Redirecting to Stripe checkout:', url);
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received from Stripe');
      }
    } catch (error) {
      console.error('❌ Checkout error:', error);
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  }, [items, appliedDeal]); // 🔥 FIXED: Removed customerEmail dependency

  // 🔥 FIXED: Update the totals calculation
  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.reduce((total, item) => total + item.quantity, 0);

  // Calculate subtotal using original prices
  const subtotal = safeItems.reduce((total, item) => {
    const originalPrice = item.originalPrice || item.price;
    return total + (originalPrice * item.quantity);
  }, 0);

  // Calculate total product discounts
  const productDiscountTotal = safeItems.reduce((total, item) => 
    total + ((item.productDiscountAmount || 0) * item.quantity), 0
  );

  // Calculate subtotal after product discounts (this is what cart discount applies to)
  const subtotalAfterProductDiscounts = subtotal - productDiscountTotal;

  // Cart discount applies to the already discounted subtotal
  const cartDiscountAmount = appliedDeal ? appliedDeal.discountAmount : 0;

  // Final total
  const finalTotal = Math.max(0.50, subtotalAfterProductDiscounts - cartDiscountAmount);

  const value: CartContextType = {
    items: safeItems,
    addToCart,
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
    isCheckingOut,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};