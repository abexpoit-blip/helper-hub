
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.account_status AS ENUM ('active', 'flagged', 'disconnected');
CREATE TYPE public.campaign_type AS ENUM ('post', 'comment', 'reaction');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed');
CREATE TYPE public.run_status AS ENUM ('queued', 'running', 'success', 'failed', 'skipped');
CREATE TYPE public.log_level AS ENUM ('info', 'success', 'warning', 'error');
CREATE TYPE public.metric_type AS ENUM ('post', 'video_rendered', 'click', 'success', 'fail');

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  license_tier TEXT NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile upsert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- AUTO-CREATE profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROXIES (password is encrypted client-side in server fn)
CREATE TABLE public.proxies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,
  ip TEXT NOT NULL,
  port INTEGER NOT NULL,
  username TEXT,
  password_ciphertext TEXT,
  password_iv TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proxies TO authenticated;
GRANT ALL ON public.proxies TO service_role;
ALTER TABLE public.proxies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own proxies" ON public.proxies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER proxies_updated_at BEFORE UPDATE ON public.proxies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- FB ACCOUNTS (cookies + tokens encrypted by server fn before insert)
CREATE TABLE public.fb_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  region TEXT,
  user_agent TEXT,
  cookies_ciphertext TEXT,
  cookies_iv TEXT,
  token_ciphertext TEXT,
  token_iv TEXT,
  status public.account_status NOT NULL DEFAULT 'active',
  imax_profile_id TEXT,
  proxy_id UUID REFERENCES public.proxies(id) ON DELETE SET NULL,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_accounts TO authenticated;
GRANT ALL ON public.fb_accounts TO service_role;
ALTER TABLE public.fb_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own fb accounts" ON public.fb_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_fb_accounts_user_status ON public.fb_accounts(user_id, status);
CREATE TRIGGER fb_accounts_updated_at BEFORE UPDATE ON public.fb_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- iMax CONFIG (per user)
CREATE TABLE public.imax_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_endpoint TEXT NOT NULL DEFAULT 'http://127.0.0.1:54345',
  api_token_ciphertext TEXT,
  api_token_iv TEXT,
  sync_interval_seconds INTEGER NOT NULL DEFAULT 30,
  max_concurrent_profiles INTEGER NOT NULL DEFAULT 24,
  footprint JSONB NOT NULL DEFAULT '{"canvas":true,"webgl":true,"audio":false,"timezone":true,"user_agent":true}'::jsonb,
  last_test_at TIMESTAMPTZ,
  last_test_ok BOOLEAN,
  last_test_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imax_config TO authenticated;
GRANT ALL ON public.imax_config TO service_role;
ALTER TABLE public.imax_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own imax config" ON public.imax_config FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER imax_config_updated_at BEFORE UPDATE ON public.imax_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LINKER CONFIG (shortener + spintax)
CREATE TABLE public.linker_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_ciphertext TEXT,
  api_key_iv TEXT,
  base_endpoint TEXT,
  default_tag TEXT,
  domains TEXT[] NOT NULL DEFAULT '{}',
  spintax_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linker_config TO authenticated;
GRANT ALL ON public.linker_config TO service_role;
ALTER TABLE public.linker_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own linker" ON public.linker_config FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER linker_config_updated_at BEFORE UPDATE ON public.linker_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CAMPAIGNS
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.campaign_type NOT NULL,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  posts_per_hour INTEGER NOT NULL DEFAULT 30,
  randomize_seconds INTEGER NOT NULL DEFAULT 90,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_targets INTEGER NOT NULL DEFAULT 0,
  total_done INTEGER NOT NULL DEFAULT 0,
  total_failed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaigns_due ON public.campaigns(status, scheduled_at);
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CAMPAIGN RUNS (one row per account-per-campaign-job)
CREATE TABLE public.campaign_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.fb_accounts(id) ON DELETE SET NULL,
  status public.run_status NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.campaign_runs TO authenticated;
GRANT ALL ON public.campaign_runs TO service_role;
ALTER TABLE public.campaign_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own runs" ON public.campaign_runs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_runs_campaign ON public.campaign_runs(campaign_id, created_at DESC);

-- RUN LOGS
CREATE TABLE public.run_logs (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID REFERENCES public.campaign_runs(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.fb_accounts(id) ON DELETE SET NULL,
  level public.log_level NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.run_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.run_logs_id_seq TO authenticated;
GRANT ALL ON public.run_logs TO service_role;
GRANT ALL ON SEQUENCE public.run_logs_id_seq TO service_role;
ALTER TABLE public.run_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs" ON public.run_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_logs_user_time ON public.run_logs(user_id, created_at DESC);

-- METRIC EVENTS (powers dashboard)
CREATE TABLE public.metric_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.metric_type NOT NULL,
  account_id UUID REFERENCES public.fb_accounts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  value INTEGER NOT NULL DEFAULT 1,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.metric_events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.metric_events_id_seq TO authenticated;
GRANT ALL ON public.metric_events TO service_role;
GRANT ALL ON SEQUENCE public.metric_events_id_seq TO service_role;
ALTER TABLE public.metric_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own metrics" ON public.metric_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_metrics_user_time_type ON public.metric_events(user_id, type, created_at DESC);

-- Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.run_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fb_accounts;
