// ============================================================================
// order-emails — Supabase Edge Function
//
// Sends customer confirmation + admin notification emails for a paid order via
// Azure Communication Email (REST API, HMAC-signed — no SDK needed).
//
// Invoked by:
//   - the orders trigger through pg_net  ({ orderId, source: 'db-trigger' })
//   - the pg_cron sweeper                ({ orderId, source: 'cron-sweep' })
//
// Idempotency: claims orders.customer_notified_at / admin_notified_at with a
// conditional PostgREST PATCH (same columns the website fallback uses), so any
// number of concurrent invocations sends each email exactly once. Failed sends
// release their claim so the cron sweeper retries.
//
// Secrets (supabase secrets set ...):
//   AZURE_COMMUNICATION_CONNECTION_STRING
//   AZURE_FROM_EMAIL
//   AZURE_ADMIN_EMAIL
//   NOTIFICATION_SHARED_SECRET   (must match notification_settings.shared_secret)
// ============================================================================

const MAX_ORDER_AGE_DAYS = 7;
const PLACEHOLDER_EMAIL = 'pending@stripe.com';

interface OrderItemRow {
  product_name: string | null;
  unit_price: number | null;
  quantity: number | null;
  total_price: number | null;
}

interface OrderRow {
  id: string;
  order_number: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number | null;
  shipping_cost: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total_amount: number | null;
  currency: string | null;
  deal_code: string | null;
  created_at: string;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  order_items?: OrderItemRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64Decode(value: string): Uint8Array {
  const binary = atob(value.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const money = (n: number | null | undefined) => `$${(Number(n) || 0).toFixed(2)}`;

// ---------------------------------------------------------------------------
// Supabase (PostgREST) access — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are
// injected automatically into Edge Functions.
// ---------------------------------------------------------------------------

function restHeaders(): Record<string, string> {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not available');
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

async function loadOrder(orderId: string): Promise<OrderRow | null> {
  const url = `${Deno.env.get('SUPABASE_URL')}/rest/v1/orders?select=*,order_items(product_name,unit_price,quantity,total_price)&id=eq.${orderId}`;
  const res = await fetch(url, { headers: restHeaders() });
  if (!res.ok) {
    console.error(`loadOrder failed: ${res.status} ${await res.text()}`);
    return null;
  }
  const rows = await res.json() as OrderRow[];
  return rows[0] ?? null;
}

/**
 * Atomically claim one notification slot. Returns true when this invocation
 * owns the send; false when another caller already claimed it.
 */
async function claimSlot(orderId: string, column: 'customer_notified_at' | 'admin_notified_at'): Promise<boolean> {
  const url = `${Deno.env.get('SUPABASE_URL')}/rest/v1/orders?id=eq.${orderId}&${column}=is.null`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...restHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({ [column]: new Date().toISOString() }),
  });
  if (!res.ok) {
    // Fail OPEN on unexpected errors: prefer a rare duplicate over silence.
    console.error(`claimSlot(${column}) failed: ${res.status} ${await res.text()}`);
    return true;
  }
  const rows = await res.json() as unknown[];
  return rows.length > 0;
}

async function releaseSlot(orderId: string, column: 'customer_notified_at' | 'admin_notified_at'): Promise<void> {
  const url = `${Deno.env.get('SUPABASE_URL')}/rest/v1/orders?id=eq.${orderId}`;
  await fetch(url, {
    method: 'PATCH',
    headers: restHeaders(),
    body: JSON.stringify({ [column]: null }),
  });
}

// ---------------------------------------------------------------------------
// Azure Communication Email (REST + HMAC-SHA256 request signing)
// ---------------------------------------------------------------------------

interface AzureConfig {
  endpointOrigin: string;
  accessKey: Uint8Array;
}

function parseAzureConnectionString(connectionString: string): AzureConfig {
  const map = new Map<string, string>();
  for (const part of connectionString.trim().split(';')) {
    if (!part) continue;
    const idx = part.indexOf('=');
    if (idx > 0) map.set(part.slice(0, idx).toLowerCase(), part.slice(idx + 1));
  }
  const endpoint = map.get('endpoint');
  const accessKey = map.get('accesskey');
  if (!endpoint || !accessKey) {
    throw new Error('AZURE_COMMUNICATION_CONNECTION_STRING must contain endpoint= and accesskey=');
  }
  return {
    endpointOrigin: new URL(endpoint).origin,
    accessKey: base64Decode(accessKey),
  };
}

interface OutgoingEmail {
  to: { address: string; displayName?: string }[];
  subject: string;
  html: string;
  plainText: string;
}

async function azureSendEmail(cfg: AzureConfig, fromEmail: string, message: OutgoingEmail): Promise<{ ok: boolean; detail: string }> {
  const pathAndQuery = '/emails:send?api-version=2023-03-31';
  const payload = {
    senderAddress: fromEmail,
    content: {
      subject: message.subject,
      html: message.html,
      plainText: message.plainText,
    },
    recipients: {
      to: message.to.map(r => ({ address: r.address, displayName: r.displayName ?? '' })),
    },
  };

  const bodyBytes = new TextEncoder().encode(JSON.stringify(payload));
  const contentSha256 = base64Encode(new Uint8Array(await crypto.subtle.digest('SHA-256', bodyBytes)));
  const date = new Date().toUTCString();
  const host = new URL(cfg.endpointOrigin).host;

  // ACS string-to-sign: METHOD\npathAndQuery\nx-ms-date;host;x-ms-content-sha256 values
  const stringToSign = `POST\n${pathAndQuery}\n${date};${host};${contentSha256}`;
  const key = await crypto.subtle.importKey('raw', cfg.accessKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = base64Encode(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(stringToSign))));

  const res = await fetch(`${cfg.endpointOrigin}${pathAndQuery}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ms-date': date,
      'x-ms-content-sha256': contentSha256,
      Authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`,
    },
    body: JSON.stringify(payload),
  });

  // 202 Accepted = Azure queued the message for delivery.
  if (res.status === 202 || res.status === 200) {
    return { ok: true, detail: `operation ${(await res.text()).slice(0, 200)}` };
  }
  return { ok: false, detail: `${res.status}: ${(await res.text()).slice(0, 500)}` };
}

// ---------------------------------------------------------------------------
// Email templates (compact versions of the website templates)
// ---------------------------------------------------------------------------

interface EmailModel {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  subtotal: number;
  discountAmount: number;
  dealCode: string | null;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  orderDate: string;
  shipping: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
}

function buildModel(order: OrderRow): EmailModel {
  const items = (order.order_items ?? []).map(it => {
    const quantity = it.quantity ?? 1;
    const total = Number(it.total_price) || 0;
    // The site stores unit_price as the PRE-DISCOUNT list price while
    // total_price is the actually-charged line total (product deals applied).
    // Derive the displayed unit price from the line total so every row is
    // self-consistent ("Qty 2 × $54.00 = $108.00"), falling back to the stored
    // unit price when there is no usable total.
    const price = total > 0 && quantity > 0 ? total / quantity : Number(it.unit_price) || 0;
    return { name: (it.product_name || '').trim() || 'Laser Cryogen', quantity: quantity || 1, price, total };
  });

  return {
    orderNumber: order.order_number || order.id,
    customerName: order.customer_name || 'Valued Customer',
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone || '',
    items,
    subtotal: Number(order.subtotal) || 0,
    discountAmount: Number(order.discount_amount) || 0,
    dealCode: order.deal_code,
    shippingCost: Number(order.shipping_cost) || 0,
    taxAmount: Number(order.tax_amount) || 0,
    totalAmount: Number(order.total_amount) || 0,
    currency: (order.currency || 'usd').toUpperCase(),
    orderDate: new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
    shipping: {
      line1: order.shipping_line1 || '',
      line2: order.shipping_line2 || undefined,
      city: order.shipping_city || '',
      state: order.shipping_state || '',
      postalCode: order.shipping_postal_code || '',
      country: order.shipping_country || 'US',
    },
  };
}

function renderHtml(m: EmailModel, isAdmin: boolean): string {
  const headerBg = isAdmin ? '#DC2626' : '#3B82F6';
  const accent = isAdmin ? '#DC2626' : '#3B82F6';
  const title = isAdmin ? '🔔 New Order Received!' : '✓ Order Confirmation';
  const banner = isAdmin ? `<div style="background:#FEE2E2;border:2px solid #FECACA;border-radius:8px;padding:12px 15px;margin-bottom:20px;color:#991B1B;font-weight:600">⚡ ACTION REQUIRED: Please process this order promptly.</div>` : '';

  // Suppress the shipping block when reconciliation produced no usable address.
  const hasAddress = Boolean(m.shipping.line1?.trim() || m.shipping.city?.trim() || m.shipping.state?.trim() || m.shipping.postalCode?.trim());

  const itemRows = m.items.map(it => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #E5E7EB">
        <strong>${escapeHtml(it.name)}</strong><br>
        <span style="color:#6B7280;font-size:13px">Qty ${it.quantity} × ${money(it.price)}</span>
      </td>
      <td style="padding:10px;border-bottom:1px solid #E5E7EB;text-align:right;font-weight:600">${money(it.total)}</td>
    </tr>`).join('');

  const th = 'padding:8px 10px;border-bottom:2px solid #E5E7EB;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6B7280';
  const itemsTable = m.items.length === 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px"><tr><td style="padding:10px;color:#6B7280;font-size:13px">No line items recorded.</td></tr></table>`
    : `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-collapse:separate;border-spacing:0;border-radius:8px;overflow:hidden">
    <tr><th align="left" style="${th}">Item</th><th align="right" style="${th}">Amount</th></tr>${itemRows}</table>`;

  const addressHtml = [
    m.shipping.line1,
    m.shipping.line2,
    `${m.shipping.city}${m.shipping.state ? `, ${m.shipping.state}` : ''} ${m.shipping.postalCode}`,
    m.shipping.country,
  ].filter(Boolean).map(escapeHtml).join('<br>');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.6;color:#1F2937;background:#F9FAFB;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#FFF">
  <div style="background:${headerBg};color:#fff;padding:28px 20px;text-align:center">
    <h1 style="margin:0;font-size:24px">${title}</h1>
    <p style="margin:6px 0 0;opacity:.95">${isAdmin ? `Order #${escapeHtml(m.orderNumber)}` : `Thank you for your order, ${escapeHtml(m.customerName)}!`}</p>
  </div>
  <div style="padding:20px">
    ${banner}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;margin-bottom:16px">
      <tr><td style="padding:14px">
        <strong>Order</strong> #${escapeHtml(m.orderNumber)}<br>
        <span style="color:#6B7280;font-size:13px">${escapeHtml(m.orderDate)}</span>
        ${isAdmin ? `<br><span style="color:#6B7280;font-size:13px">Payment status: paid</span>` : ''}
      </td></tr>
    </table>

    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:${accent};margin:18px 0 8px">Customer</h3>
    <p style="margin:0">${escapeHtml(m.customerName)}<br>${escapeHtml(m.customerEmail)}${m.customerPhone ? `<br>${escapeHtml(m.customerPhone)}` : ''}</p>

    ${hasAddress ? `
    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:${accent};margin:18px 0 8px">Shipping Address</h3>
    <p style="margin:0">${addressHtml}</p>` : ''}

    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:${accent};margin:18px 0 8px">Order Items (${m.items.length})</h3>
    ${itemsTable}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;font-size:14px">
      <tr><td style="padding:4px 0;color:#6B7280">Subtotal</td><td align="right">${money(m.subtotal)}</td></tr>
      ${m.discountAmount > 0 ? `<tr><td style="padding:4px 0;color:#6B7280">Discount${m.dealCode ? ` (${escapeHtml(m.dealCode)})` : ''}</td><td align="right" style="color:#059669">-${money(m.discountAmount)}</td></tr>` : ''}
      <tr><td style="padding:4px 0;color:#6B7280">Shipping</td><td align="right">${money(m.shippingCost)}</td></tr>
      <tr><td style="padding:4px 0;color:#6B7280">Tax</td><td align="right">${money(m.taxAmount)}</td></tr>
      <tr><td style="padding:10px 0;border-top:2px solid #E5E7EB;margin-top:6px"><strong>Total</strong></td><td align="right" style="border-top:2px solid #E5E7EB;padding:10px 0"><strong style="color:${accent};font-size:17px">${money(m.totalAmount)} ${m.currency}</strong></td></tr>
    </table>

    <p style="margin-top:26px;padding-top:14px;border-top:1px solid #E5E7EB;color:#6B7280;font-size:12px;text-align:center">
      ${isAdmin ? 'Automated notification from your e-commerce system.' : 'If you have any questions about your order, please contact us.<br>Thank you for your business!'}
    </p>
  </div>
</div>
</body></html>`;
}

function renderText(m: EmailModel, isAdmin: boolean): string {
  const lines = [
    isAdmin ? '🔔 NEW ORDER NOTIFICATION' : 'ORDER CONFIRMATION',
    ''.padEnd(45, '─'),
    isAdmin ? '⚡ ACTION REQUIRED: Please process this order promptly.' : `Thank you for your order, ${m.customerName}!`,
    '',
    `Order #${m.orderNumber}`,
    `Date: ${m.orderDate}`,
    '',
    `Customer: ${m.customerName} <${m.customerEmail}>${m.customerPhone ? ` · ${m.customerPhone}` : ''}`,
    `Ship to: ${[m.shipping.line1, m.shipping.line2, `${m.shipping.city}, ${m.shipping.state} ${m.shipping.postalCode}`, m.shipping.country].filter(Boolean).join(', ')}`,
    '',
    ...m.items.map(it => `- ${it.name} × ${it.quantity} @ ${money(it.price)} = ${money(it.total)}`),
    '',
    `Subtotal: ${money(m.subtotal)}`,
    ...(m.discountAmount > 0 ? [`Discount${m.dealCode ? ` (${m.dealCode})` : ''}: -${money(m.discountAmount)}`] : []),
    `Shipping: ${money(m.shippingCost)}`,
    `Tax: ${money(m.taxAmount)}`,
    `TOTAL: ${money(m.totalAmount)} ${m.currency}`,
  ];
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Shared-secret gate (the function runs with verify_jwt disabled).
  const expectedSecret = Deno.env.get('NOTIFICATION_SHARED_SECRET');
  if (!expectedSecret || req.headers.get('x-notification-secret') !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let payload: { orderId?: string; source?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const orderId = payload.orderId;
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'orderId is required' }), { status: 400 });
  }

  console.log(`📧 order-emails: processing order ${orderId} (source: ${payload.source ?? 'unknown'})`);

  try {
    const order = await loadOrder(orderId);
    if (!order) {
      return new Response(JSON.stringify({ error: `Order ${orderId} not found` }), { status: 404 });
    }

    // Staleness guard mirrors the SQL-side predicates.
    const ageDays = (Date.now() - new Date(order.created_at).getTime()) / 86_400_000;
    if (ageDays > MAX_ORDER_AGE_DAYS) {
      return new Response(JSON.stringify({ skipped: `order older than ${MAX_ORDER_AGE_DAYS} days` }));
    }

    const model = buildModel(order);

    const connStr = Deno.env.get('AZURE_COMMUNICATION_CONNECTION_STRING');
    const fromEmail = Deno.env.get('AZURE_FROM_EMAIL');
    const adminEmail = Deno.env.get('AZURE_ADMIN_EMAIL');
    if (!connStr || !fromEmail || !adminEmail) {
      throw new Error('Azure email env vars missing: AZURE_COMMUNICATION_CONNECTION_STRING / AZURE_FROM_EMAIL / AZURE_ADMIN_EMAIL');
    }
    const azureCfg = parseAzureConnectionString(connStr);

    const results: Record<string, string> = {};

    /** Claim → send → stamp, releasing the claim on ANY failure so retries happen. */
    async function deliver(
      target: 'customer' | 'admin',
      column: 'customer_notified_at' | 'admin_notified_at',
      message: OutgoingEmail,
    ): Promise<void> {
      if (!(await claimSlot(order.id, column))) {
        results[target] = 'already handled';
        return;
      }
      try {
        const res = await azureSendEmail(azureCfg, fromEmail, message);
        if (res.ok) {
          results[target] = 'sent';
        } else {
          await releaseSlot(order.id, column);
          results[target] = `FAILED (${res.detail})`;
        }
      } catch (sendError) {
        // Network/DNS errors throw instead of returning { ok:false } — the
        // claim MUST be released or the sweeper would skip this order forever.
        await releaseSlot(order.id, column);
        results[target] = `FAILED (${sendError instanceof Error ? sendError.message : String(sendError)})`;
      }
    }

    // ── Customer confirmation ──
    if (!order.customer_email || order.customer_email === PLACEHOLDER_EMAIL) {
      results.customer = 'skipped (no real recipient email)';
    } else {
      await deliver('customer', 'customer_notified_at', {
        to: [{ address: order.customer_email, displayName: model.customerName }],
        subject: `Order Confirmation - ${model.orderNumber}`,
        html: renderHtml(model, false),
        plainText: renderText(model, false),
      });
    }

    // ── Admin notification ──
    await deliver('admin', 'admin_notified_at', {
      to: [{ address: adminEmail, displayName: 'Admin' }],
      subject: `New Order Received - ${model.orderNumber}`,
      html: renderHtml(model, true),
      plainText: renderText(model, true),
    });

    const failed = Object.values(results).filter(v => v.startsWith('FAILED'));
    console.log(`📧 order-emails: order ${orderId} →`, results);

    return new Response(
      JSON.stringify({ orderId, source: payload.source, results, ok: failed.length === 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error(`📧 order-emails: error processing ${orderId}:`, error);
    // 200 keeps pg_net/cron logs clean; failures are retried by the sweeper's
    // un-notified-order scan regardless of this response.
    return new Response(
      JSON.stringify({ orderId, ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
