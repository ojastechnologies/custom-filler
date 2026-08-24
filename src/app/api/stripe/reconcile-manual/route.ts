import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

/**
 * Manual 2-step order recovery from a Stripe checkout session.
 *
 * mode=fetch : retrieve the session and return normalized details. NO writes.
 * mode=apply : retrieve again (Stripe stays source of truth) and write the
 *              customer/address/payment fields onto the order.
 *
 * Applying also flips pending→processing when the session is paid, which
 * fires the normal notification pipeline for recovered orders.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode: 'fetch' | 'apply' = body.mode === 'apply' ? 'apply' : 'fetch';
    let sessionId: string | undefined = body.sessionId;
    const orderId: string | undefined = body.orderId;

    if (!sessionId && !orderId) {
      return NextResponse.json({ error: 'orderId or sessionId is required' }, { status: 400 });
    }
    if (mode === 'apply' && !orderId) {
      return NextResponse.json({ error: 'orderId is required to apply' }, { status: 400 });
    }

    // Resolve the session id from the order when not provided
    if (!sessionId) {
      const { data: ord, error: ordErr } = await supabase
        .from('orders')
        .select('stripe_session_id')
        .eq('id', orderId)
        .single();
      if (ordErr || !ord?.stripe_session_id) {
        return NextResponse.json(
          { error: 'Order has no checkout session id to recover from' },
          { status: 400 },
        );
      }
      sessionId = ord.stripe_session_id;
    }
    if (!sessionId) {
      return NextResponse.json({ error: 'Order has no checkout session id' }, { status: 400 });
    }

    const stripe = getServerStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent'],
    });

    const cd = session.customer_details ?? null;
    const addr = cd?.address ?? null;
    const pi =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const details = {
      session_id: session.id,
      session_status: session.status ?? null,
      payment_status: session.payment_status ?? null,
      payment_intent_id: pi,
      customer_email: cd?.email ?? null,
      customer_name: cd?.name ?? null,
      customer_phone: cd?.phone ?? null,
      shipping_line1: addr?.line1 ?? null,
      shipping_line2: addr?.line2 ?? null,
      shipping_city: addr?.city ?? null,
      shipping_state: addr?.state ?? null,
      shipping_postal_code: addr?.postal_code ?? null,
      shipping_country: addr?.country ?? null,
      amount_total: session.amount_total != null ? session.amount_total / 100 : null,
      currency: session.currency ?? null,
      metadata_order_id: session.metadata?.order_id ?? null,
      created: session.created ? new Date(session.created * 1000).toISOString() : null,
    };

    if (mode === 'fetch') {
      return NextResponse.json({ ok: true, mode, details });
    }

    // ---------- apply ----------
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (details.customer_email) updates.customer_email = details.customer_email;
    if (details.customer_name) updates.customer_name = details.customer_name;
    if (details.customer_phone) updates.customer_phone = details.customer_phone;
    for (const f of [
      'shipping_line1', 'shipping_line2', 'shipping_city',
      'shipping_state', 'shipping_postal_code', 'shipping_country',
    ] as const) {
      if (details[f]) updates[f] = details[f];
    }
    if (details.payment_intent_id) updates.stripe_payment_intent_id = details.payment_intent_id;
    updates.stripe_session_id = details.session_id;
    updates.payment_status = details.payment_status || 'paid';
    if (details.payment_status === 'paid') updates.status = 'processing';

    const { data: updated, error: updErr } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select('*')
      .single();

    if (updErr) {
      console.error('reconcile-manual update error:', updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, mode, applied: Object.keys(updates), order: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reconcile from Stripe';
    console.error('reconcile-manual error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
