'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { validateDealCode, incrementDealUsage } from '@/services/dealService';
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  clientpathurl?: string;
  deal?: Deal; // Add this line
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



  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedDeal(null);








    localStorage.removeItem('cart-items');
    localStorage.removeItem('applied-deal');
  }, []);

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
  const proceedToCheckout = useCallback(async (customerEmail?: string) => {
    try {
      setIsCheckingOut(true);
      
      console.log('🛒 Starting checkout with items:', items);
      console.log('🎫 Applied deal:', appliedDeal);

      if (items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = appliedDeal ? appliedDeal.discountAmount : 0;
      const finalTotal = subtotal - discountAmount;

      // 🔥 CREATE ORDER IN DATABASE FIRST 🔥
      const orderData: CreateOrderData = {
        customer_email: customerEmail || 'guest@example.com',
        customer_name: null,
        customer_phone: null,
        subtotal: subtotal,
        shipping_cost: 0,
        tax_amount: 0,
        total_amount: finalTotal,
        currency: 'usd',
        deal_id: appliedDeal?.deal?.id,
        deal_code: appliedDeal?.deal?.code,
        discount_amount: discountAmount,
        items: items.map(item => ({
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

      // Now proceed to Stripe checkout
      const checkoutData = {
        orderId: createdOrder.id, // Include order ID
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          description: item.description,
          clientpathurl: item.clientpathurl
        })),
        appliedDeal: appliedDeal,
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      const { url, sessionId } = await response.json();
      
      // Update order with Stripe session ID
      if (sessionId) {
        await updateOrderWithStripeInfo(createdOrder.id, sessionId);
        console.log('✅ Order updated with Stripe session ID');
      }
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('❌ Checkout error:', error);
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  }, [items, appliedDeal]);

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
