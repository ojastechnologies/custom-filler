
/* eslint-disable @typescript-eslint/no-unused-vars */
import stripe from "stripe";

const createCheckoutSession = async () => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripeInstance.checkout.sessions.create({
    // ... other parameters
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/redirect-to-invoice?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
    // ... rest of configuration
  });
  return session;
};