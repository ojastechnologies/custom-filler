export const testStripeCheckout = async () => {
  console.log('🧪 Testing Stripe checkout with hardcoded URLs...');
  
  const testData = {
    orderId: 'test-order-123',
    items: [
      {
        id: 'test-item-1',
        name: 'Test Product',
        price: 10.00,
        quantity: 1,
        description: 'Test product for checkout'
      }
    ],
    successUrl: 'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=test-123',
    cancelUrl: 'http://localhost:3000/cart',
    customerEmail: 'test@example.com'
  };

  console.log('📤 Sending test data:', testData);

  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Test failed:', errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('✅ Test successful:', result);
    return { success: true, result };

  } catch (error) {
    console.error('❌ Test error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};