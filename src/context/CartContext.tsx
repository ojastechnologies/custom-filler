'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { validateDealCode, Deal } from '@/services/dealService';
import { createOrderInDatabase, updateOrderWithStripeInfo, CreateOrderData } from '@/services/ordersService';

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
  productDiscountAmount?: number; // NEW: Store product-level discount amount
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

// Helper function to calculate product discount
const calculateProductDiscount = (originalPrice: number, deal: Deal): number => {
  if (!isDealValid(deal)) return 0;
  
  let discountAmount = 0;
  if (deal.discount_type === 'percentage') {
    discountAmount = originalPrice * (deal.discount_value / 100);
  } else {
    discountAmount = deal.discount_value;
  }
  
  // Apply maximum discount limit if set
  if (deal.maximum_discount_amount && discountAmount > deal.maximum_discount_amount) {
    discountAmount = deal.maximum_discount_amount;
  }
  
  // Ensure discount doesn't exceed original price
  discountAmount = Math.min(discountAmount, originalPrice - 0.01);
  
  return Math.max(0, discountAmount);
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
  proceedToCheckout: (customerEmail?: string) => Promise<void>;
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
      
      // Calculate product-level discount if item has a deal
      let processedItem = { ...newItem };
      if (newItem.deal && isDealValid(newItem.deal)) {
        const originalPrice = newItem.price;
        const discountAmount = calculateProductDiscount(originalPrice, newItem.deal);
        const discountedPrice = originalPrice - discountAmount;
        
        processedItem = {
          ...newItem,
          originalPrice,
          productDiscountAmount: discountAmount,
          price: discountedPrice
        };
        
        console.log('🎉 Applied product discount:', {
          originalPrice,
          discountAmount,
          finalPrice: discountedPrice,
          deal: newItem.deal.code
        });
      }
      
      if (existingItem) {
        return safeItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + (processedItem.quantity || 1) }
            : item
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
      return safeItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
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

  const proceedToCheckout = useCallback(async (customerEmail?: string) => {
    try {
      setIsCheckingOut(true);
      
      const safeItems = Array.isArray(items) ? items : [];
      
      console.log('🛒 Starting checkout with items:', safeItems);

      if (safeItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate totals
      const subtotal = safeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const productDiscountTotal = safeItems.reduce((sum, item) => 
        sum + ((item.productDiscountAmount || 0) * item.quantity), 0
      );
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
        finalTotal 
      });

      // Validate final total
      if (finalTotal < 0.50) {
        throw new Error('Order total must be at least $0.50');
      }

      // Create order in database
      const orderData: CreateOrderData = {
        customer_email: customerEmail || 'guest@example.com',
        customer_name: undefined,
        customer_phone: undefined,
        subtotal: subtotal + productDiscountTotal,
        shipping_cost: 0,
        tax_amount: 0,
        total_amount: finalTotal,
        currency: 'usd',
        deal_id: appliedDeal?.deal?.id,
        deal_code: appliedDeal?.deal?.code,
        discount_amount: cartDiscountAmount + productDiscountTotal,
        items: safeItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.originalPrice || item.price,
          quantity: item.quantity,
          image: item.image,
          description: item.description,
          clientpathurl: item.clientpathurl,
          deal_id: item.deal_id,
          product_discount_amount: item.productDiscountAmount || 0
        }))
      };

      console.log('📝 Creating order in database:', orderData);
      const createdOrder = await createOrderInDatabase(orderData);
      console.log('✅ Order created in database:', createdOrder.order_number);

      // 🔥 FIX: Construct URLs properly
      const baseUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}`
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${createdOrder.id}`;
      const cancelUrl = `${baseUrl}/cart`;

      console.log('🔗 Constructed URLs:');
      console.log('- Success URL:', successUrl);
      console.log('- Cancel URL:', cancelUrl);

      // Prepare checkout data for Stripe - 🔥 INCLUDE ALL REQUIRED FIELDS
      const checkoutData = {
        orderId: createdOrder.id,
        items: safeItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price, // Use discounted price for Stripe
          quantity: item.quantity,
          image: item.image,
          description: item.description,
          clientpathurl: item.clientpathurl,
          originalPrice: item.originalPrice,
          productDiscountAmount: item.productDiscountAmount
        })),
        appliedDeal: appliedDeal ? {
          deal: {
            id: appliedDeal.deal.id,
            code: appliedDeal.deal.code,
            description: appliedDeal.deal.description
          },
          discountAmount: cartDiscountAmount
        } : undefined,
        customerEmail: customerEmail || undefined,
        successUrl: successUrl, // 🔥 REQUIRED FIELD
        cancelUrl: cancelUrl    // 🔥 REQUIRED FIELD
      };

      console.log('📤 Sending checkout data to Stripe:');
      console.log('- Order ID:', checkoutData.orderId);
      console.log('- Items count:', checkoutData.items.length);
      console.log('- Has applied deal:', !!checkoutData.appliedDeal);
      console.log('- Success URL present:', !!checkoutData.successUrl);
      console.log('- Cancel URL present:', !!checkoutData.cancelUrl);

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
      
      if (sessionId) {
        await updateOrderWithStripeInfo(createdOrder.id, sessionId);
        console.log('✅ Order updated with Stripe session ID');
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
  }, [items, appliedDeal]);

  // Calculate totals with product-level discounts
  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = safeItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const productDiscountTotal = safeItems.reduce((total, item) => 
    total + ((item.productDiscountAmount || 0) * item.quantity), 0
  );
  const cartDiscountAmount = appliedDeal ? appliedDeal.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - cartDiscountAmount);

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
