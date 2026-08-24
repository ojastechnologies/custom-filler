import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';
import type Stripe from 'stripe';

const PLACEHOLDER_EMAIL = 'pending@stripe.com';

/**
 * The website's ONLY notification job: keep the order row in sync with Stripe.
 * Setting status='processing' is what fires the Supabase-side email pipeline
 * (trigger → Edge Function, plus a pg_cron sweeper as safety net) — see
 * supabase/migrations/*_order_notifications_via_supabase.sql and
 * supabase/functions/order-emails. This route intentionally does NOT send
 * emails itself.
 * Reconcile the order row with everything Stripe knows (customer identity,
 * addresses, payment ids, status). Mirrors /api/stripe/session/[sessionId] but
 * runs server-side without depending on the customer's browser reaching the
 * success page.
 */
async function reconcileOrderFromSession(session: Stripe.Checkout.Session): Promise<string | null> {
  // Prefer metadata; fall back to looking the order up by session id for
  // sessions created before this integration shipped.
  let orderId = session.metadata?.order_id || null;

  if (!orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

    if (!error && data) {
      orderId = (data as { id: string }).id;
    }
  }

  if (!orderId) {
    console.warn('🔔 Webhook: no order found for session', session.id);
    return null;
  }

  const email = session.customer_details?.email || session.customer_email || '';
  const name = session.customer_details?.name || null;
  const phone = session.customer_details?.phone || null;
  const address = session.customer_details?.address || null;
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;

  // Only patch what is missing — never clobber data already reconciled.
  const { data: current, error: fetchError } = await supabase
    .from('orders')
    .select('customer_email, customer_name, stripe_session_id')
    .eq('id', orderId)
    .single();

  if (fetchError) {
    console.error('🔔 Webhook: failed to load order', orderId, fetchError);
    return orderId; // still return it so notification can be attempted
  }

  const needsUpdate =
    !current?.customer_name ||
    current?.customer_email === PLACEHOLDER_EMAIL ||
    !current?.stripe_session_id;

  if (!needsUpdate) {
    return orderId;
  }

  const updates: Record<string, unknown> = {
    ...(email ? { customer_email: email } : {}),
    ...(name ? { customer_name: name } : {}),
    ...(phone ? { customer_phone: phone } : {}),
    stripe_session_id: session.id,
    ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
    payment_status: (session.payment_status as string) || 'paid',
    status: 'processing',
    updated_at: new Date().toISOString(),
  };

  if (address) {
    updates.shipping_line1 = address.line1 || null;
    updates.shipping_line2 = address.line2 || null;
    updates.shipping_city = address.city || null;
    updates.shipping_state = address.state || null;
    updates.shipping_postal_code = address.postal_code || null;
    updates.shipping_country = address.country || null;
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId);

  if (updateError) {
    console.error('🔔 Webhook: failed to reconcile order', orderId, updateError);
  } else {
    console.log('🔔 Webhook: reconciled order', orderId);
  }

  return orderId;
}

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
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('💳 Checkout session completed:', session.id);

      if (session.payment_status !== 'paid') {
        console.log(`🔔 Webhook: session ${session.id} not paid yet (${session.payment_status}); skipping`);
        break;
      }

      try {
        const orderId = await reconcileOrderFromSession(session);

        if (!orderId) {
          // Nothing to reconcile — acknowledge so Stripe stops retrying.
          console.warn('🔔 Webhook: completed session without a matching order:', session.id);
          break;
        }

        console.log('✅ Webhook: order reconciled, notifications owned by Supabase pipeline:', orderId);
      } catch (error) {
        console.error('❌ Webhook: failed reconciling checkout.session.completed:', error);
        // Non-2xx makes Stripe retry this event later.
        return NextResponse.json(
          { received: true, error: error instanceof Error ? error.message : 'processing failed' },
          { status: 500 }
        );
      }

      break;
    }

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
