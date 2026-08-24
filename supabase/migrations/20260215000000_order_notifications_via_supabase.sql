-- ============================================================================
-- Order notifications managed entirely inside Supabase.
--
-- Flow:
--   1. Any writer (Stripe webhook, success page) sets orders.status='processing'
--   2. Trigger fires -> pg_net posts the orderId to the `order-emails` Edge
--      Function (fire-and-forget, never blocks the transaction)
--   3. The Edge Function sends customer + admin emails via Azure Communication
--      Email and stamps customer_notified_at / admin_notified_at (claimed
--      atomically; released on failure)
--   4. pg_cron sweeps every 5 minutes for paid-but-unnotified orders (<=7 days
--      old) so a missed trigger or a transient Azure outage self-heals
--
-- Exactly-once semantics live in the notified_at columns shared with the
-- website's fallback path (/api/emails/send-order-confirmation).
-- ============================================================================

-- pg_net: async HTTP from SQL. Bundled on hosted Supabase and in local dev.
-- (Its objects land in whichever schema the platform chooses; the enqueue
-- helper below resolves that dynamically.)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ---------------------------------------------------------------------------
-- Configuration consumed by the trigger/sweeper. RLS is enabled with NO
-- policies: only postgres/service_role can read it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_settings (
    key        text PRIMARY KEY,
    value      text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.notification_settings (key, value) VALUES
    ('function_url', 'https://vrfpayooyasvetbxkjam.supabase.co/functions/v1/order-emails'),
    ('shared_secret', 'CHANGE-ME-before-deploy')
ON CONFLICT (key) DO NOTHING;

-- LOCAL DEV OVERRIDE (run after `supabase db reset`):
--   UPDATE public.notification_settings SET value = 'http://127.0.0.1:54321/functions/v1/order-emails'
--   WHERE key = 'function_url';

-- ---------------------------------------------------------------------------
-- Shared enqueue helper.
--
-- pg_net's objects live in different schemas depending on environment
-- (`net` on most installations incl. hosted Supabase, sometimes `extensions`),
-- so we resolve the schema from the extension itself instead of hardcoding it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_notification_http(p_url text, p_headers jsonb, p_body jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_schema text;
    v_id     bigint;
BEGIN
    -- Find where http_post(url text, ...) ACTUALLY lives. Neither a hardcoded
    -- schema nor the extension's declared namespace is reliable across
    -- environments (hosted Supabase and the local dev image disagree).
    SELECT n.nspname INTO v_schema
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'http_post'
      AND p.proargtypes[0] = 'text'::regtype
    ORDER BY 1
    LIMIT 1;

    IF v_schema IS NULL THEN
        RAISE WARNING 'order emails: pg_net http_post() not found';
        RETURN NULL;
    END IF;

    EXECUTE format(
        'SELECT %I.http_post(url := $1, headers := $2, body := $3, timeout_milliseconds := 5000)',
        v_schema
    )
    USING p_url, p_headers, p_body
    INTO v_id;

    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Trigger: enqueue notification work whenever an order becomes 'processing'.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enqueue_order_notification_emails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_url    text;
    v_secret text;
BEGIN
    -- Only when an order actually enters the paid/processing state...
    IF NEW.status IS DISTINCT FROM 'processing' THEN
        RETURN NEW;
    END IF;

    -- ...and never for ancient orders (protects against event replays).
    IF NEW.created_at < now() - interval '7 days' THEN
        RETURN NEW;
    END IF;

    SELECT value INTO v_url    FROM public.notification_settings WHERE key = 'function_url';
    SELECT value INTO v_secret FROM public.notification_settings WHERE key = 'shared_secret';

    IF v_url IS NULL OR v_url = '' THEN
        RAISE WARNING 'order emails: notification_settings.function_url is not configured';
        RETURN NEW;
    END IF;

    PERFORM public.enqueue_notification_http(
        v_url,
        jsonb_build_object(
            'Content-Type',          'application/json',
            'x-notification-secret', coalesce(v_secret, '')
        ),
        jsonb_build_object(
            'orderId',     NEW.id,
            'orderNumber', NEW.order_number,
            'source',      'db-trigger'
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_enqueue_emails ON public.orders;
CREATE TRIGGER orders_enqueue_emails
    AFTER INSERT OR UPDATE OF status ON public.orders
    FOR EACH ROW
    WHEN (NEW.status = 'processing')
    EXECUTE FUNCTION public.enqueue_order_notification_emails();

-- ---------------------------------------------------------------------------
-- Sweeper: catch anything the trigger missed (failed HTTP post, Azure outage,
-- function not yet deployed, etc.). Idempotent — the Edge Function's claims
-- make duplicate invocations harmless.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sweep_order_notification_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_url    text;
    v_secret text;
    r        record;
BEGIN
    SELECT value INTO v_url    FROM public.notification_settings WHERE key = 'function_url';
    SELECT value INTO v_secret FROM public.notification_settings WHERE key = 'shared_secret';

    IF v_url IS NULL OR v_url = '' THEN
        RAISE WARNING 'order emails sweep: function_url is not configured';
        RETURN;
    END IF;

    FOR r IN
        SELECT id, order_number
        FROM public.orders
        WHERE status = 'processing'
          AND created_at > now() - interval '7 days'
          AND (admin_notified_at IS NULL OR customer_notified_at IS NULL)
        ORDER BY created_at ASC
        LIMIT 100
    LOOP
        PERFORM public.enqueue_notification_http(
            v_url,
            jsonb_build_object(
                'Content-Type',          'application/json',
                'x-notification-secret', coalesce(v_secret, '')
            ),
            jsonb_build_object(
                'orderId',     r.id,
                'orderNumber', r.order_number,
                'source',      'cron-sweep'
            )
        );
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Cron: run the sweeper every 5 minutes (pg_cron).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
        CREATE EXTENSION IF NOT EXISTS pg_cron;

        BEGIN
            PERFORM cron.unschedule('sweep-order-emails');
        EXCEPTION WHEN OTHERS THEN
            NULL; -- job didn't exist yet
        END;

        PERFORM cron.schedule(
            'sweep-order-emails',
            '*/5 * * * *',
            $job$ SELECT public.sweep_order_notification_emails(); $job$
        );
    ELSE
        RAISE NOTICE 'pg_cron unavailable: enable it (Database > Extensions) and re-run this migration to get the sweeper';
    END IF;
END;
$$;
