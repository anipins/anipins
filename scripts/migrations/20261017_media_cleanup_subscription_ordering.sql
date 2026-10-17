-- Additive, idempotent schema required by the media cleanup queue and
-- out-of-order billing webhook protection.

CREATE TABLE IF NOT EXISTS public.media_cleanup_queue (
  object_key TEXT NOT NULL,
  premium INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (object_key, premium)
);

ALTER TABLE public.media_cleanup_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.media_cleanup_queue FROM anon, authenticated;

ALTER TABLE public.billing_subscriptions
  ADD COLUMN IF NOT EXISTS provider_event_at BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.billing_subscriptions FROM anon, authenticated;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.sessions FROM anon, authenticated;
