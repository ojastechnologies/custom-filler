import Stripe from 'stripe';

// Helper function to get server-side stripe instance safely
export const getServerStripe = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables. Please check your .env.local file.');
  }

  if (!secretKey.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY appears to be invalid. It should start with "sk_"');
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-05-28.basil',
    typescript: true,
  });
};

// Client-side Stripe instance (for frontend components)
export const stripePromise = (() => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.warn('⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
    return null;
  }

  // Only import loadStripe on client-side
  if (typeof window !== 'undefined') {
    return import('@stripe/stripe-js').then(({ loadStripe }) => 
      loadStripe(publishableKey)
    );
  }
  
  return null;
})();

// Legacy export for backwards compatibility - but always use getServerStripe() in API routes
export const stripe = null; // Don't initialize here to avoid timing issues