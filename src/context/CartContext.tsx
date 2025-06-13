'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { validateDealCode } from '@/services/dealService';

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

interface CartItem extends Product {
  quantity: number;
}

interface Deal {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AppliedDeal {
  deal: Deal;
  discountAmount: number;
}

// Define the request body type for checkout
interface CheckoutRequestBody {
  items: Array<{
    product: {
      id: string;
      name: string;
      price: number;
      description: string;
      image_url: string | null;
    };
    quantity: number;
  }>;
  customer_email?: string;
  deal?: {
    id: string;
    code: string;
    discount_amount: number;
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  appliedDeal: AppliedDeal | null;
  applyDeal: (code: string) => Promise<{ success: boolean; message: string }>;
  removeDeal: () => void;
  proceedToCheckout: (customerEmail?: string) => Promise<void>;
  isCheckingOut: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Use localStorage to persist cart data
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedCart = localStorage.getItem('cart');
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    return [];
  }
};

const saveCartToStorage = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('cart', JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

const loadDealFromStorage = (): AppliedDeal | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedDeal = localStorage.getItem('appliedDeal');
    return storedDeal ? JSON.parse(storedDeal) : null;
  } catch (error) {
    console.error('Failed to load deal from localStorage:', error);
    return null;
  }
};

const saveDealToStorage = (deal: AppliedDeal | null) => {
  if (typeof window === 'undefined') return;
  
  try {
    if (deal) {
      localStorage.setItem('appliedDeal', JSON.stringify(deal));
    } else {
      localStorage.removeItem('appliedDeal');
    }
  } catch (error) {
    console.error('Failed to save deal to localStorage:', error);
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedDeal, setAppliedDeal] = useState<AppliedDeal | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Use useCallback to memoize the recalculateDeal function
  const recalculateDeal = useCallback(async () => {
    if (!appliedDeal) return;
    
    try {
      const validation = await validateDealCode(appliedDeal.deal.code, items);
      if (validation.isValid && validation.deal && validation.discountAmount !== undefined) {
        setAppliedDeal({
          deal: validation.deal,
          discountAmount: validation.discountAmount
        });
      } else {
        // Deal no longer valid, remove it
        setAppliedDeal(null);
      }
    } catch (error) {
      console.error('Error recalculating deal:', error);
      setAppliedDeal(null);
    }
  }, [appliedDeal, items]);

  // Load cart and deal from localStorage on initial render
  useEffect(() => {
    setItems(loadCartFromStorage());
    setAppliedDeal(loadDealFromStorage());
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes and recalculate deal
  useEffect(() => {
    if (isInitialized) {
      saveCartToStorage(items);
      // Recalculate deal when cart changes
      if (appliedDeal) {
        recalculateDeal();
      }
    }
  }, [items, isInitialized, appliedDeal, recalculateDeal]);

  // Save deal to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      saveDealToStorage(appliedDeal);
    }
  }, [appliedDeal, isInitialized]);

  const addToCart = (product: Product) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        const newQuantity = (prevItems[existingItemIndex].quantity || 0) + (product.quantity || 1);
        updatedItems[existingItemIndex] = {
          ...prevItems[existingItemIndex],
          ...product,
          quantity: newQuantity
        };
        return updatedItems;
      } else {
        const newItem = { 
          ...product, 
          quantity: product.quantity || 1 
        };
        return [...prevItems, newItem];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    console.log('🧹 CLEARING CART');
    setItems([]);
    setAppliedDeal(null);
    
    // Also clear localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
      localStorage.removeItem('appliedDeal');
      console.log('🧹 CART CLEARED - localStorage also cleared');
    }
  };

  const applyDeal = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const validation = await validateDealCode(code, items);
      
      if (validation.isValid && validation.deal && validation.discountAmount !== undefined) {
        setAppliedDeal({
          deal: validation.deal,
          discountAmount: validation.discountAmount
        });
        return {
          success: true,
          message: validation.message || `Deal "${code}" applied successfully!`
        };
      } else {
        return {
          success: false,
          message: validation.message || 'Invalid deal code'
        };
      }
    } catch (error) {
      console.error('Error applying deal:', error);
      return {
        success: false,
        message: 'Error applying deal. Please try again.'
      };
    }
  };

  const removeDeal = () => {
    setAppliedDeal(null);
  };

  // Updated Stripe checkout function with deal support
  const proceedToCheckout = async (customerEmail?: string) => {
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }

    setIsCheckingOut(true);
    
    try {
      console.log('🛒 Starting checkout process...');
      console.log('Cart items:', items);
      console.log('Applied deal:', appliedDeal);
      
      // Transform cart items to match the expected format for Stripe
      const checkoutItems = items.map(item => ({
        product: {
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description || `Product: ${item.name}`,
          image_url: item.image || null
        },
        quantity: item.quantity
      }));

      console.log('💳 Checkout items prepared:', checkoutItems);

      // Use proper typing instead of 'any'
      const requestBody: CheckoutRequestBody = {
        items: checkoutItems,
        customer_email: customerEmail || undefined,
      };

      // Add deal information if applied
      if (appliedDeal) {
        requestBody.deal = {
          id: appliedDeal.deal.id,
          code: appliedDeal.deal.code,
          discount_amount: appliedDeal.discountAmount
        };
        console.log('🎫 Deal included in checkout:', requestBody.deal);
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Checkout session creation failed:', data);
        throw new Error(data.error || 'Failed to create checkout session');
      }

      console.log('✅ Checkout session created:', data.sessionId);
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error) {
      console.error('❌ Checkout failed:', error);
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const discountAmount = appliedDeal ? appliedDeal.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice: subtotal, // Keep for backward compatibility
      subtotal,
      finalTotal,
      appliedDeal,
      applyDeal,
      removeDeal,
      proceedToCheckout,
      discountAmount,
      isCheckingOut
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
