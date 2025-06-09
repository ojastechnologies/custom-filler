'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  proceedToCheckout: (customerEmail?: string) => Promise<void>; // RESTORED
  isCheckingOut: boolean; // RESTORED
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to validate and clean image URLs
function getValidImageUrl(imageUrl?: string): string | undefined {
  if (!imageUrl || imageUrl.trim() === '') return undefined;
  
  const cleanUrl = imageUrl.trim();
  
  // Skip placeholder images
  if (cleanUrl === '/placeholder-product.jpg' || cleanUrl.includes('placeholder')) {
    return undefined;
  }
  
  // Check if it's a valid URL
  try {
    new URL(cleanUrl);
    return cleanUrl;
  } catch {
    // If it's not a valid URL, it might be a relative path
    // For now, we'll skip it to avoid Stripe errors
    console.warn('Invalid image URL detected:', cleanUrl);
    return undefined;
  }
}

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

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false); // RESTORED

  // Load cart from localStorage on initial render
  useEffect(() => {
    setItems(loadCartFromStorage());
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      saveCartToStorage(items);
    }
  }, [items, isInitialized]);

  const addToCart = (product: Product) => {
    setItems(prevItems => {
      // Check if the product is already in the cart
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // If it exists, update the quantity but preserve all fields
        const updatedItems = [...prevItems];
        const newQuantity = (prevItems[existingItemIndex].quantity || 0) + (product.quantity || 1);
        updatedItems[existingItemIndex] = {
          ...prevItems[existingItemIndex],
          ...product, // Update with any new field values
          quantity: newQuantity
        };
        return updatedItems;
      } else {
        // If it doesn't exist, add it to the cart with ALL fields
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
    
    // Also clear localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart');
      console.log('🧹 CART CLEARED - localStorage also cleared');
    }
  };

  // RESTORED: Updated Stripe checkout function with better URL handling
  const proceedToCheckout = async (customerEmail?: string) => {
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }

    setIsCheckingOut(true);
    
    try {
      console.log('🛒 Starting checkout process...');
      console.log('Cart items:', items);
      
      // Transform cart items to match the expected format for Stripe
      const checkoutItems = items.map(item => ({
        product: {
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description || `Product: ${item.name}`, // Use the actual description
          image_url: item.image || null
        },
        quantity: item.quantity
      }));

      console.log('💳 Checkout items prepared:', checkoutItems);

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: checkoutItems,
          customer_email: customerEmail || undefined,
        }),
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
  
  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity, 
    0
  );

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      proceedToCheckout, // RESTORED
      isCheckingOut // RESTORED
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