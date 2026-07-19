
-- ============ Ola AM: API Keys & Public API ============

CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read:invoices','read:work_orders','read:bookings']::TEXT[],
  rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  usage_count BIGINT NOT NULL DEFAULT 0,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_owner ON public.api_keys(owner_user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash) WHERE revoked_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Owners see/manage their own keys; admins see all
CREATE POLICY "Owners view their api_keys"
  ON public.api_keys FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners insert their api_keys"
  ON public.api_keys FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners update their api_keys"
  ON public.api_keys FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete api_keys"
  ON public.api_keys FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_api_keys_updated
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ API usage log ============
CREATE TABLE public.api_usage_log (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_ms INTEGER,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_usage_key_time ON public.api_usage_log(api_key_id, created_at DESC);

GRANT SELECT ON public.api_usage_log TO authenticated;
GRANT ALL ON public.api_usage_log TO service_role;

ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view their api_usage_log"
  ON public.api_usage_log FOR SELECT
  TO authenticated
  USING (
    api_key_id IN (SELECT id FROM public.api_keys WHERE owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============ Helper RPC: register a new api key (returns full raw key ONCE) ============
CREATE OR REPLACE FUNCTION public.create_api_key(
  _name TEXT,
  _scopes TEXT[] DEFAULT ARRAY['read:invoices','read:work_orders','read:bookings']::TEXT[],
  _rate_limit INTEGER DEFAULT 60,
  _expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(id UUID, raw_key TEXT, key_prefix TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_raw TEXT;
  v_prefix TEXT;
  v_hash TEXT;
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_raw := 'ak_' || encode(extensions.gen_random_bytes(24), 'hex');
  v_prefix := substring(v_raw from 1 for 10);
  v_hash := encode(extensions.digest(v_raw, 'sha256'), 'hex');

  INSERT INTO public.api_keys(name, key_prefix, key_hash, owner_user_id, scopes, rate_limit_per_min, expires_at)
  VALUES (_name, v_prefix, v_hash, auth.uid(), _scopes, _rate_limit, _expires_at)
  RETURNING api_keys.id INTO v_id;

  RETURN QUERY SELECT v_id, v_raw, v_prefix;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_api_key(TEXT, TEXT[], INTEGER, TIMESTAMPTZ) TO authenticated;

-- Verify function used by edge function (service_role only)
CREATE OR REPLACE FUNCTION public.verify_api_key(_raw_key TEXT)
RETURNS TABLE(id UUID, owner_user_id UUID, scopes TEXT[], rate_limit_per_min INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  v_hash := encode(extensions.digest(_raw_key, 'sha256'), 'hex');
  RETURN QUERY
    SELECT k.id, k.owner_user_id, k.scopes, k.rate_limit_per_min
    FROM public.api_keys k
    WHERE k.key_hash = v_hash
      AND k.revoked_at IS NULL
      AND (k.expires_at IS NULL OR k.expires_at > now());
END;
$$;

REVOKE ALL ON FUNCTION public.verify_api_key(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_api_key(TEXT) TO service_role;
