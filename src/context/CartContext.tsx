'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Update the Product type to include the image property
export interface Product {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<Product, "quantity">) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Omit<Product, "quantity">) => {
    // Ensure name is defined
    const productWithName = {
      ...product,
      name: product.name as string // Type assertion
    };
    
    setItems(prevItems => {
      // Check if the product is already in the cart
      const existingItem = prevItems.find(item => item.id === productWithName.id);
      
      if (existingItem) {
        // If it exists, increase the quantity
        return prevItems.map(item => 
          item.id === productWithName.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        
        return [...prevItems, { ...productWithName, quantity: 1 }];
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
      totalPrice
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