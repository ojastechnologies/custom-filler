import { supabase } from '@/lib/supabaseClient';
import { azureEmailService } from '@/services/azureEmailService';
import { OrderConfirmationData } from '@/types/email';

/**
 * Server-side order notifications.
 *
 * Both delivery paths (the Stripe webhook and /api/emails/send-order-confirmation,
 * which is called from the checkout success page) converge here. Delivery is
 * made idempotent by claiming per-order timestamp columns in the database
 * (`customer_notified_at`, `admin_notified_at`) with an atomic conditional
 * UPDATE: exactly one concurrent caller can claim each slot. A failed send
 * releases its slot so a later attempt (e.g. Stripe redelivering the webhook)
 * can retry.
 */

export interface DbOrderItem {
  id: string;
  product_id?: string | null;
  product_name: string | null;
  unit_price: number | null;
  quantity: number | null;
  total_price: number | null;
  product_image?: string | null;
}

export interface DbOrder {
  id: string;
  order_number: string | null;
  status: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number | null;
  shipping_cost: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  currency: string | null;
  deal_code?: string | null;
  created_at: string;
  stripe_payment_intent_id?: string | null;
  customer_notified_at?: string | null;
  admin_notified_at?: string | null;
  items?: DbOrderItem[];
}

const PLACEHOLDER_EMAIL = 'pending@stripe.com';

export type NotificationKind = 'customer' | 'admin';

export interface NotificationTargetResult {
  target: NotificationKind;
  attempted: boolean;
  sent: boolean;
  skippedReason?: 'already-notified' | 'no-recipient' | 'placeholder-email';
  error?: string;
}

export interface NotifyOrderResult {
  orderId: string;
  results: NotificationTargetResult[];
  allSucceeded: boolean;
}

const NOTIFIED_COLUMN: Record<NotificationKind, 'customer_notified_at' | 'admin_notified_at'> = {
  customer: 'customer_notified_at',
  admin: 'admin_notified_at',
};

/** Load an order with its items from the database. */
export async function loadOrderWithItems(orderId: string): Promise<DbOrder | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_id,
        product_name,
        unit_price,
        quantity,
        total_price,
        product_image
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !data) {
    console.error('📧 Notifications: failed to load order', orderId, error);
    return null;
  }

  const { order_items, ...order } = data as DbOrder & { order_items?: DbOrderItem[] };
  return { ...order, items: order_items || [] };
}

/** Resolve an order id from its unique order number (used by the email API route). */
export async function resolveOrderByNumber(orderNumber: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (error) {
    console.error('📧 Notifications: failed to resolve order number', orderNumber, error);
    return null;
  }
  return (data as { id: string } | null);
}

/**
 * Build the email payload straight from the database row — the DB is the
 * source of truth, not whatever the browser posted.
 */
export function buildEmailPayload(order: DbOrder): OrderConfirmationData {  const items = (order.items || []).map(item => {
    const quantity = item.quantity ?? 1;
    let price = Number(item.unit_price) || 0;
    const total = Number(item.total_price) || 0;

    // Derive unit price from the line total when missing/zero (mirrors the
    // success-page behaviour).
    if ((price === 0 || !price) && total > 0 && quantity > 0) {
      price = total / quantity;
    }

    let name = item.product_name || '';
    if (!name.trim()) {
      name = 'Laser Cryogen';
    }

    return {
      name,
      quantity: quantity || 1,
      price,
      total,
    };
  });

  const row = order as DbOrder & {
    shipping_line1?: string | null;
    shipping_line2?: string | null;
    shipping_city?: string | null;
    shipping_state?: string | null;
    shipping_postal_code?: string | null;
    shipping_country?: string | null;
  };

  return {
    orderNumber: order.order_number || order.id,
    customerName: order.customer_name || 'Valued Customer',
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone || '',
    orderItems: items,
    subtotal: Number(order.subtotal) || 0,
    discountAmount: Number(order.discount_amount) || 0,
    shippingCost: Number(order.shipping_cost) || 0,
    taxAmount: Number(order.tax_amount) || 0,
    totalAmount: Number(order.total_amount) || 0,
    currency: (order.currency || 'usd').toUpperCase(),
    paymentStatus: 'paid',
    orderDate: order.created_at || new Date().toISOString(),
    shippingAddress: {
      // Populated by reconciliation from the Stripe session; empty strings are
      // handled gracefully by the templates.
      line1: row.shipping_line1 || '',
      line2: row.shipping_line2 || undefined,
      city: row.shipping_city || '',
      state: row.shipping_state || '',
      postalCode: row.shipping_postal_code || '',
      country: row.shipping_country || 'US',
    },
    ...(order.stripe_payment_intent_id ? { paymentIntentId: order.stripe_payment_intent_id } : {}),
  };
}

/**
 * Atomically claim the notification slot for one target. Returns true when
 * this call owns the slot (first sender wins), false when somebody else
 * already sent (or is sending) that email.
 */
async function claimNotificationSlot(orderId: string, target: NotificationKind): Promise<boolean> {
  const column = NOTIFIED_COLUMN[target];
  const { data, error } = await supabase
    .from('orders')
    .update({ [column]: new Date().toISOString() })
    .eq('id', orderId)
    .is(column, null)
    .select('id')
    .maybeSingle();

  if (error) {
    // If the columns don't exist yet (migration not applied), fail OPEN:
    // better a rare duplicate than zero notifications.
    console.warn(`📧 Notifications: claim on ${column} failed (${error.message}); proceeding without claim`);
    return true;
  }

  return !!data;
}

async function releaseNotificationSlot(orderId: string, target: NotificationKind): Promise<void> {
  const column = NOTIFIED_COLUMN[target];
  const { error } = await supabase
    .from('orders')
    .update({ [column]: null })
    .eq('id', orderId);

  if (error) {
    console.error(`📧 Notifications: failed to release ${column} for order ${orderId}`, error);
  }
}

async function sendOne(
  orderId: string,
  target: NotificationKind,
  payload: OrderConfirmationData,
): Promise<NotificationTargetResult> {
  // Guard recipients before claiming.
  if (target === 'customer') {
    if (!payload.customerEmail) {
      return { target, attempted: false, sent: false, skippedReason: 'no-recipient' };
    }
    if (payload.customerEmail === PLACEHOLDER_EMAIL) {
      console.warn(`📧 Notifications: order ${orderId} still has placeholder email; skipping customer email`);
      return { target, attempted: false, sent: false, skippedReason: 'placeholder-email' };
    }
  }

  const claimed = await claimNotificationSlot(orderId, target);
  if (!claimed) {
    console.log(`📧 Notifications: ${target} email for order ${orderId} already handled elsewhere`);
    return { target, attempted: false, sent: true, skippedReason: 'already-notified' };
  }

  try {
    const ok = target === 'customer'
      ? await azureEmailService.sendOrderConfirmation(payload)
      : await azureEmailService.sendAdminNotification(payload);

    if (ok) {
      return { target, attempted: true, sent: true };
    }

    // Send failed — release the slot so Stripe's webhook retry (or a page
    // refresh) can attempt delivery again.
    await releaseNotificationSlot(orderId, target);
    return {
      target,
      attempted: true,
      sent: false,
      error: `${target} email failed to send`,
    };
  } catch (error) {
    await releaseNotificationSlot(orderId, target);
    return {
      target,
      attempted: true,
      sent: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send the customer confirmation and/or admin notification for an order,
 * exactly once per target regardless of how many callers race.
 */
export async function notifyOrder(
  orderId: string,
  options: { sendToAdmin?: boolean; sendToCustomer?: boolean } = {},
): Promise<NotifyOrderResult | null> {
  const { sendToAdmin = true, sendToCustomer = true } = options;

  const order = await loadOrderWithItems(orderId);
  if (!order) {
    return null;
  }

  const payload = buildEmailPayload(order);
  const targets: NotificationKind[] = [];
  if (sendToCustomer) targets.push('customer');
  if (sendToAdmin) targets.push('admin');

  const results: NotificationTargetResult[] = [];
  for (const target of targets) {
    results.push(await sendOne(order.id, target, payload));
  }

  const failures = results.filter(r => r.attempted && !r.sent);
  if (failures.length > 0) {
    console.error(`📧 Notifications: order ${orderId} had ${failures.length} failed send(s)`,
      failures.map(f => ({ target: f.target, error: f.error })));
  } else {
    console.log(`📧 Notifications: order ${orderId} notifications complete`,
      results.map(r => `${r.target}:${r.sent ? 'sent' : `skipped(${r.skippedReason})`}`));
  }

  return {
    orderId: order.id,
    results,
    allSucceeded: failures.length === 0,
  };
}
