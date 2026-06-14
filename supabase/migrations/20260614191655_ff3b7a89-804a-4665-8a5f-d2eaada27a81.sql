
ALTER TYPE public.run_status ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE public.run_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE public.campaign_status ADD VALUE IF NOT EXISTS 'cancelled';
