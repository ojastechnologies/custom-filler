import { validateDealCode, CartItem } from '@/services/dealService';

// Test data for deal validation
export const testCartItems: CartItem[] = [
  { id: '1', name: 'Product A', price: 25.00, quantity: 2 },
  { id: '2', name: 'Product B', price: 15.00, quantity: 1 },
  { id: '3', name: 'Product C', price: 30.00, quantity: 1 },
];

export const testDealValidation = async () => {
  console.log('🧪 Testing Deal Validation');
  console.log('Cart items:', testCartItems);
  console.log('Cart total:', testCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0));
  
  const testCodes = ['SAVE10', 'WELCOME20', 'BUY2GET1', 'EXPIRED'];
  
  for (const code of testCodes) {
    console.log(`\n--- Testing code: ${code} ---`);
    try {
      const result = await validateDealCode(code, testCartItems, 'test@example.com');
      console.log('Result:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  }
};

// Run in browser console: testDealValidation()
if (typeof window !== 'undefined') {
  (window as any).testDealValidation = testDealValidation;
}