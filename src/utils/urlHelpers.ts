export const getBaseUrl = (): string => {
  // In browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // In server-side rendering
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // This should not happen in production
  throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required');
};

export const buildCheckoutUrls = (orderId: string) => {
  const baseUrl = getBaseUrl();
  
  const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`;
  const cancelUrl = `${baseUrl}/cart`;
  
  console.log('🔗 Built checkout URLs:', { baseUrl, successUrl, cancelUrl });
  
  // Validate URLs
  try {
    new URL(successUrl.replace('{CHECKOUT_SESSION_ID}', 'test'));
    new URL(cancelUrl);
    console.log('✅ URLs validated successfully');
  } catch (error) {
    console.error('❌ Invalid URL generated:', error);
    throw new Error(`Invalid checkout URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return { successUrl, cancelUrl };
};

// Test function for debugging
export const testUrlGeneration = () => {
  console.log('🧪 Testing URL generation...');
  
  try {
    const testOrderId = 'test-order-123';
    const { successUrl, cancelUrl } = buildCheckoutUrls(testOrderId);
    
    console.log('✅ URL generation test passed');
    console.log('Success URL:', successUrl);
    console.log('Cancel URL:', cancelUrl);
    
    return { successUrl, cancelUrl };
  } catch (error) {
    console.error('❌ URL generation test failed:', error);
    throw error;
  }
};