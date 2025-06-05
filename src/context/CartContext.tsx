'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Update the Product type to include the image property
export interface Product {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  image?: string;
  description?: string;
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
  proceedToCheckout: (customerEmail?: string) => Promise<void>;
  isCheckingOut: boolean;
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
  const [isCheckingOut, setIsCheckingOut] = useState(false);

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
        // If it exists, update the quantity
        const updatedItems = [...prevItems];
        const newQuantity = (prevItems[existingItemIndex].quantity || 0) + (product.quantity || 1);
        updatedItems[existingItemIndex] = {
          ...prevItems[existingItemIndex],
          quantity: newQuantity
        };
        return updatedItems;
      } else {
        // If it doesn't exist, add it to the cart
        return [...prevItems, { 
          ...product, 
          quantity: product.quantity || 1 
        }];
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
    setItems([]);
  };

  // Updated Stripe checkout function with better URL handling
  const proceedToCheckout = async (customerEmail?: string) => {
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }

    setIsCheckingOut(true);
    
    try {
      // Convert cart items to match the expected format from your original API route
      const checkoutItems = items.map(item => {
        const validImageUrl = getValidImageUrl(item.image);
        
        return {
          product: {
            id: item.id,
            name: item.name,
            price: item.price,
            // Provide a meaningful description or omit if empty
            description: item.description && item.description.trim() !== '' 
              ? item.description.trim() 
              : `${item.name} - Quality aerosol product`,
            image_url: validImageUrl, // Only include valid URLs
          },
          quantity: item.quantity,
        };
      });

      console.log('Sending checkout data:', { items: checkoutItems, customer_email: customerEmail });

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: checkoutItems,
          customer_email: customerEmail,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create checkout session`);
      }

      const responseData = await response.json();
      console.log('Checkout session response:', responseData);
      
      if (responseData.url) {
        window.location.href = responseData.url;
      } else {
        throw new Error('No checkout URL received from Stripe');
      }
    } catch (error) {
      console.error('Checkout error:', error);
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