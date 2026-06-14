
ALTER TABLE public.campaign_runs
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS retry_backoff_seconds INTEGER NOT NULL DEFAULT 60;

CREATE INDEX IF NOT EXISTS idx_runs_status_retry ON public.campaign_runs(status, next_retry_at);
