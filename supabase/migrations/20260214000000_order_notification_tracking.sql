-- Track transactional email notifications per order so that both the Stripe
-- webhook and the checkout success page can attempt delivery idempotently.
-- A NULL timestamp means "not yet sent"; the sending path claims the slot with
-- an atomic UPDATE ... WHERE <col> IS NULL, and releases it if the send fails
-- so a later retry (e.g. a Stripe webhook redelivery) can try again.

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS customer_notified_at timestamptz;

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS admin_notified_at timestamptz;

COMMENT ON COLUMN public.orders.customer_notified_at IS 'When the order confirmation email was successfully sent to the customer';
COMMENT ON COLUMN public.orders.admin_notified_at IS 'When the new-order notification email was successfully sent to the admin';
