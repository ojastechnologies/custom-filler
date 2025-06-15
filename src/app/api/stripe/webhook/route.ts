import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe'; // 🔥 Use your main Stripe instance
import { supabase } from '@/lib/supabaseClient';
import Stripe from 'stripe';

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
  } catch (err: unknown) {
    console.error(`❌ Webhook signature verification failed:`, (err as Error).message);
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

    // 🔥 FIX: Properly type the update data
    interface OrderUpdateData {
      stripe_session_id: string;
      stripe_payment_intent_id: string | null;
      status: string;
      updated_at: string;
      customer_name: string | null;
      customer_phone: string | null;
      shipping_line1: string | null;
      shipping_line2: string | null;
      shipping_city: string | null;
      shipping_state: string | null;
      shipping_postal_code: string | null;
      shipping_country: string | null;
    }

    const updateData: OrderUpdateData = {
      stripe_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id || null,
      status: 'processing',
      updated_at: new Date().toISOString(),
      customer_name: session.customer_details?.name || null,
      customer_phone: session.customer_details?.phone || null,
      shipping_line1: session.customer_details?.address?.line1 || null,
      shipping_line2: session.customer_details?.address?.line2 || null,
      shipping_city: session.customer_details?.address?.city || null,
      shipping_state: session.customer_details?.address?.state || null,
      shipping_postal_code: session.customer_details?.address?.postal_code || null,
      shipping_country: session.customer_details?.address?.country || null,
    };

    // Update order status and add payment information
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
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