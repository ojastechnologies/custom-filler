import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});
export async function POST(req: NextRequest) {
  console.log('🔔 Webhook received');
  
  const body = await req.text();
  const headersList = headers();
  const sig = (await headersList).get('stripe-signature');

  if (!sig) {
    console.error('❌ No Stripe signature found');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log('✅ Webhook signature verified, event type:', event.type);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log('🎉 Payment successful for session:', session.id);
    console.log('📋 Session metadata:', session.metadata);
    
    try {
      await updateOrderAfterPayment(session);
      console.log('✅ Order updated successfully after payment');
    } catch (error) {
      console.error('❌ Error updating order after payment:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
async function updateOrderAfterPayment(session: Stripe.Checkout.Session) {
  try {
    console.log('🔄 Updating order after successful payment');
    
    const metadata = session.metadata || {};
    const orderId = metadata.orderId;
    
    if (!orderId) {
      console.error('❌ No order ID found in session metadata');
      return;
    }

    console.log('📝 Updating order:', orderId);

    // Update order status and add payment information
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string || null,
        status: 'processing',
        updated_at: new Date().toISOString(),
        // Update customer info from Stripe if available
        customer_name: session.customer_details?.name || null,
        customer_phone: session.customer_details?.phone || null,
        // Update shipping address from Stripe
        shipping_line1: session.customer_details?.address?.line1 || null,
        shipping_line2: session.customer_details?.address?.line2 || null,
        shipping_city: session.customer_details?.address?.city || null,
        shipping_state: session.customer_details?.address?.state || null,
        shipping_postal_code: session.customer_details?.address?.postal_code || null,
        shipping_country: session.customer_details?.address?.country || null,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Error updating order:', updateError);
      throw updateError;
    }

    console.log('✅ Order updated successfully with payment info');

  } catch (error) {
    console.error('❌ Error in updateOrderAfterPayment:', error);
    throw error;
  }
}