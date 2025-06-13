import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});
export async function POST(req: NextRequest) {
  try {
    const { orderId, items, appliedDeal, customerEmail, successUrl, cancelUrl } = await req.json();

    console.log('🛒 Creating checkout session for order:', orderId);
    console.log('📦 Items:', items);
    console.log('🎫 Applied deal:', appliedDeal);

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const discountAmount = appliedDeal ? appliedDeal.discountAmount : 0;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description || undefined,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add discount as a line item if applicable
    if (appliedDeal && discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Discount (${appliedDeal.deal.code})`,
            description: appliedDeal.deal.description,
          },
          unit_amount: -Math.round(discountAmount * 100), // Negative amount for discount
        },
        quantity: 1,
      });
    }

    // Create checkout session with metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      // Include order ID and other data in metadata
      metadata: {
        orderId: orderId,
        cartItems: JSON.stringify(items),
        appliedDeal: appliedDeal ? JSON.stringify(appliedDeal) : '',
        customerEmail: customerEmail || '',
      },
    });

    console.log('✅ Checkout session created:', session.id);

    // Return both URL and session ID
    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}