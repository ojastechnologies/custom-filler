-- Persist the payment state Stripe reported, separate from fulfillment status.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text;

-- Backfill from the pipeline invariant: 'pending' means payment has not
-- settled yet; anything further along was reconciled from a paid session.
UPDATE public.orders
SET payment_status = CASE WHEN status = 'pending' THEN 'unpaid' ELSE 'paid' END
WHERE payment_status IS NULL;
