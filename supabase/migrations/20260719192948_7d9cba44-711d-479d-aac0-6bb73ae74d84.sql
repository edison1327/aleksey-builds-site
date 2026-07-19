
-- Add tracking + scoring columns to leads
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS lead_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS segment TEXT;

CREATE INDEX IF NOT EXISTS idx_contact_messages_utm_source ON public.contact_messages(utm_source);
CREATE INDEX IF NOT EXISTS idx_contact_messages_segment ON public.contact_messages(segment);
CREATE INDEX IF NOT EXISTS idx_contact_messages_lead_score ON public.contact_messages(lead_score DESC);

-- Marketing campaigns (drip)
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  segment_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  channel TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage campaigns" ON public.marketing_campaigns FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.marketing_campaign_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  step_order INT NOT NULL DEFAULT 1,
  delay_hours INT NOT NULL DEFAULT 24,
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaign_steps TO authenticated;
GRANT ALL ON public.marketing_campaign_steps TO service_role;
ALTER TABLE public.marketing_campaign_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage steps" ON public.marketing_campaign_steps FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.marketing_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  current_step INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, lead_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_enrollments TO authenticated;
GRANT ALL ON public.marketing_enrollments TO service_role;
ALTER TABLE public.marketing_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage enrollments" ON public.marketing_enrollments FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Lead scoring rules
CREATE TABLE IF NOT EXISTS public.lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  points INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_scoring_rules TO authenticated;
GRANT ALL ON public.lead_scoring_rules TO service_role;
ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scoring rules" ON public.lead_scoring_rules FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto-score on lead creation based on UTM presence and phone
CREATE OR REPLACE FUNCTION public.auto_score_lead()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _s INT := 0;
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN _s := _s + 10; END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN _s := _s + 15; END IF;
  IF NEW.utm_source IS NOT NULL THEN _s := _s + 5; END IF;
  IF NEW.utm_campaign IS NOT NULL THEN _s := _s + 5; END IF;
  IF NEW.message IS NOT NULL AND length(NEW.message) > 80 THEN _s := _s + 10; END IF;
  NEW.lead_score := COALESCE(NEW.lead_score,0) + _s;
  -- default segment
  IF NEW.segment IS NULL THEN
    NEW.segment := CASE
      WHEN NEW.utm_source IS NOT NULL THEN 'campaña'
      WHEN NEW.referral_code IS NOT NULL THEN 'referido'
      ELSE 'orgánico'
    END;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_auto_score_lead ON public.contact_messages;
CREATE TRIGGER trg_auto_score_lead
BEFORE INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.auto_score_lead();

-- Seed default scoring rules
INSERT INTO public.lead_scoring_rules (name, event_type, points) VALUES
  ('Email proporcionado', 'has_email', 10),
  ('Teléfono proporcionado', 'has_phone', 15),
  ('Origen campaña UTM', 'utm_source', 5),
  ('Mensaje detallado (>80 chars)', 'long_message', 10),
  ('Referido por código', 'referral', 20)
ON CONFLICT DO NOTHING;
