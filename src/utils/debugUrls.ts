export const testUrlGeneration = () => {
  console.log('🧪 Testing URL generation...');
  
  const baseUrl = window.location.origin;
  const testOrderId = 'test-order-123';
  
  const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${testOrderId}`;
  const cancelUrl = `${baseUrl}/cart`;
  
  console.log('Base URL:', baseUrl);
  console.log('Success URL:', successUrl);
  console.log('Cancel URL:', cancelUrl);
  
  // Test URL validation
  try {
    new URL(successUrl.replace('{CHECKOUT_SESSION_ID}', 'test_session_123'));
    new URL(cancelUrl);
    console.log('✅ URLs are valid');
    return { successUrl, cancelUrl, valid: true };
  } catch (error) {
    console.error('❌ Invalid URLs:', error);
    return { successUrl, cancelUrl, valid: false, error };
  }
};