import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    console.error('❌ No Stripe signature found in headers');
    return NextResponse.json(
      { error: 'No Stripe signature found' },
      { status: 400 }
    );
  }

  let event;

  try {
    // Get the server-side Stripe instance
    const stripe = getServerStripe();
    
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log('✅ Webhook signature verified, event type:', event.type);
  } catch (err: unknown) {
    console.error(`❌ Webhook signature verification failed:`, (err as Error).message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('💳 Checkout session completed:', session.id);
      
      // Here you could update your database with payment confirmation
      // For example: updateOrderPaymentStatus(session.metadata.order_id, 'paid')
      
      break;
    
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('💰 Payment succeeded:', paymentIntent.id);
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ Payment failed:', failedPayment.id);
      break;
      
    default:
      console.log(`🔔 Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}