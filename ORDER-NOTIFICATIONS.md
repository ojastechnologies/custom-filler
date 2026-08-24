# Order Notifications — Architecture & Deploy Checklist

Fixes: "admin not receiving order emails." Email delivery is now owned entirely by
**Supabase** — the website only writes order state; it never sends email.

## Architecture

```
Stripe webhook (website)  ─┐
success page reconcile     ─┴─▶ orders.status = 'processing'
                                   │
            ┌──────────────────────┴───────────────────────┐
            ▼                                              ▼
   Postgres trigger (pg_net)                     pg_cron sweeper (every 5 min)
   fires on INSERT/UPDATE → 'processing'         scans paid-but-unnotified orders
            │                                     ≤7 days old
            └───────────────┬──────────────────────┘
                            ▼
              Edge Function `order-emails`  (supabase/functions/order-emails)
                ├─ loads order + items from Postgres
                ├─ atomically claims customer_notified_at / admin_notified_at
                ├─ sends via Azure Communication Email REST (HMAC-signed)
                └─ releases claim on failure → sweeper retries later
```

- **Exactly-once:** the `*_notified_at` columns on `orders` are claimed with a
  conditional UPDATE shared by every path, so duplicates are impossible.
- **Self-healing:** if Azure is down or a trigger post fails, the cron sweeper
  retries within ≤5 minutes until the order is notified.
- **Website fallback preserved:** `/api/emails/send-order-confirmation` (called
  from the checkout success page) still works and converges on the same claims.

## Components

| Piece | Location |
|---|---|
| Trigger + sweeper + config table + cron | `supabase/migrations/20260215000000_order_notifications_via_supabase.sql` |
| Notification-state columns | `supabase/migrations/20260214000000_order_notification_tracking.sql` |
| Edge Function | `supabase/functions/order-emails/index.ts` |
| Website reconciler (Stripe webhook) | `src/app/api/stripe/webhook/route.ts` |
| Website fallback sender | `src/app/api/emails/send-order-confirmation/route.ts` |

## Deploy steps (in order)

### 1. Apply schema changes

Local: `npm run db:migrate` (or `npm run db:reset`).

Production Supabase → SQL editor:
- Run both migration files' contents (or push via CLI).
- Ensure extensions: `pg_net` (auto) and `pg_cron` — Database → Extensions.
- The migration schedules job `sweep-order-emails`; verify under
  Database → Cron.

### 2. Configure secrets

```bash
supabase link --project-ref vrfpayooyasvetbxkjam

supabase secrets set \
  AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://...;accesskey=..." \
  AZURE_FROM_EMAIL="noreply@yourdomain" \
  AZURE_ADMIN_EMAIL="orders@yourdomain" \
  NOTIFICATION_SHARED_SECRET="$(openssl rand -hex 24)"
```

Then put that same secret into the DB so the trigger can authenticate:

```sql
UPDATE public.notification_settings
SET value = '<NOTIFICATION_SHARED_SECRET you generated>'
WHERE key = 'shared_secret';
```

(Also confirm the website's own env vars in Vercel remain set for the fallback path.)

### 3. Deploy the function

```bash
supabase functions deploy order-emails
```

(`verify_jwt = false` is already set for it in `supabase/config.toml`; auth is the
shared secret header.)

### 4. Test end-to-end

1. Place an order with test card `4242 4242 4242 4242`.
2. Watch logs: `supabase functions logs order-emails` — expect
   `order-emails: processing order ...` then `results { customer: 'sent', admin: 'sent' }`.
3. Check both inboxes.
4. Confirm the row: `SELECT status, customer_notified_at, admin_notified_at FROM orders ORDER BY created_at DESC LIMIT 1;`
5. Refreshing `/checkout/success` must NOT resend (claims already held).
6. Sweeper drill: manually NULL out both columns for the test order → within 5 min
   cron re-sends once and re-stamps them.

## Local development

```bash
supabase start
npm run db:reset        # migrations apply
# IMPORTANT: point the trigger INSIDE the Docker network at the host — plain
# 127.0.0.1 from the database container hits the container itself:
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "UPDATE public.notification_settings SET value='http://host.docker.internal:54321/functions/v1/order-emails' WHERE key='function_url';"
NOTIFICATION_SHARED_SECRET locally must match notification_settings.shared_secret
echo 'NOTIFICATION_SHARED_SECRET=...' > supabase/functions/.env.local   # plus AZURE_* dummies
supabase functions serve order-emails --env-file supabase/functions/.env.local
```

Verified locally (2026-08): trigger → pg_net → function → Azure REST reached the
real ACS endpoint (401 with dummy key, as expected); failed sends released their
claims and the cron sweeper re-attempted automatically.


## Rollback

The website fallback (`send-order-confirmation` route) still sends independently;
reverting the webhook route or deleting the trigger/cron does not break checkout.
