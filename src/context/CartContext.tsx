'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { validateDealCode, Deal } from '@/services/dealService';
import { createOrderInDatabase, updateOrderWithStripeInfo, CreateOrderData } from '@/services/ordersService';

// Update the Product type to include all fields
export interface Product {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  image?: string;
  description?: string;
  clientpathurl?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  clientpathurl?: string;
}

export interface AppliedDeal {
  deal: Deal;
  discountAmount: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  finalTotal: number;
  appliedDeal: AppliedDeal | null;
  applyDeal: (code: string) => Promise<{ isValid: boolean; message: string }>;
  removeDeal: () => void;
  proceedToCheckout: (customerEmail?: string) => Promise<void>;
  isCheckingOut: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 🔥 ENSURE ITEMS IS ALWAYS AN ARRAY
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
        // 🔥 ENSURE PARSED CART IS AN ARRAY
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
      // Reset to safe defaults
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
      // 🔥 ENSURE PREVITEMS IS ALWAYS AN ARRAY
      const safeItems = Array.isArray(prevItems) ? prevItems : [];
      
      const existingItem = safeItems.find(item => item.id === newItem.id);
      
      if (existingItem) {
        return safeItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
            : item
        );
      } else {
        return [...safeItems, { ...newItem, quantity: newItem.quantity || 1 }];
      }
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    console.log('🗑️ Removing from cart:', id);
    
    setItems(prevItems => {
      // 🔥 ENSURE PREVITEMS IS ALWAYS AN ARRAY
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
      // 🔥 ENSURE PREVITEMS IS ALWAYS AN ARRAY
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
      console.log('🎫 Applying deal:', code);
      
      // 🔥 ENSURE ITEMS IS AN ARRAY BEFORE VALIDATION
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
        console.log('✅ Deal applied successfully:', result);
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
    console.log('🗑️ Removing applied deal');
    setAppliedDeal(null);
  }, []);

  const proceedToCheckout = useCallback(async (customerEmail?: string) => {
    try {
      setIsCheckingOut(true);
      
      // 🔥 ENSURE ITEMS IS AN ARRAY
      const safeItems = Array.isArray(items) ? items : [];
      
      console.log('🛒 Starting checkout with items:', safeItems);
      console.log('🎫 Applied deal:', appliedDeal);

      if (safeItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate totals with safe array
      const subtotal = safeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let discountAmount = appliedDeal ? appliedDeal.discountAmount : 0;
      
      // Safety check: Ensure discount doesn't exceed subtotal
      if (discountAmount >= subtotal) {
        console.warn('⚠️ Discount amount exceeds subtotal, capping discount');
        discountAmount = Math.max(0, subtotal - 0.50);
      }
      
      const finalTotal = Math.max(0.50, subtotal - discountAmount);

      console.log('💰 Checkout totals:', { subtotal, discountAmount, finalTotal });

      // Validate final total
      if (finalTotal < 0.50) {
        throw new Error('Order total must be at least $0.50');
      }

      // Create order in database
      const orderData: CreateOrderData = {
        customer_email: customerEmail || 'guest@example.com',
        customer_name: undefined,
        customer_phone: undefined,
        subtotal: subtotal,
        shipping_cost: 0,
        tax_amount: 0,
        total_amount: finalTotal,
        currency: 'usd',
        deal_id: appliedDeal?.deal?.id,
        deal_code: appliedDeal?.deal?.code,
        discount_amount: discountAmount,
        items: safeItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          description: item.description,
          clientpathurl: item.clientpathurl
        }))
      };

      console.log('📝 Creating order in database:', orderData);
      const createdOrder = await createOrderInDatabase(orderData);
      console.log('✅ Order created in database:', createdOrder.order_number);

      // Prepare checkout data
      const checkoutData = {
        orderId: createdOrder.id,
        items: safeItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          description: item.description,
          clientpathurl: item.clientpathurl
        })),
        appliedDeal: appliedDeal ? {
          ...appliedDeal,
          discountAmount: discountAmount
        } : undefined,
        customerEmail: customerEmail || undefined,
        successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${createdOrder.id}`,
        cancelUrl: `${window.location.origin}/cart`
      };

      console.log('📤 Sending checkout data to Stripe:', checkoutData);

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
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error from Stripe API' };
        }
        
        throw new Error(errorData.error || `Checkout failed with status ${response.status}`);
      }

      const responseData = await response.json();
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
  // 🔥 SAFE CALCULATIONS WITH ARRAY CHECKS
  const totalItems = Array.isArray(items) ? items.reduce((total, item) => total + item.quantity, 0) : 0;
  const subtotal = Array.isArray(items) ? items.reduce((total, item) => total + item.price * item.quantity, 0) : 0;
  const discountAmount = appliedDeal ? appliedDeal.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const value: CartContextType = {
    items: Array.isArray(items) ? items : [], // 🔥 ALWAYS RETURN AN ARRAY
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    finalTotal,
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
