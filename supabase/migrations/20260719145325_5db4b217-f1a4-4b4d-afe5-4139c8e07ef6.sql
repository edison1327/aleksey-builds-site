
DO $$ BEGIN
  CREATE TYPE public.crm_stage AS ENUM ('new','contacted','quoted','negotiation','won','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS crm_stage public.crm_stage NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS crm_value_pen NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS crm_next_action TEXT,
  ADD COLUMN IF NOT EXISTS crm_next_action_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS crm_notes TEXT,
  ADD COLUMN IF NOT EXISTS crm_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crm_stage_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS contact_messages_crm_stage_idx ON public.contact_messages(crm_stage, crm_order);

CREATE OR REPLACE FUNCTION public.contact_messages_track_stage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.crm_stage IS DISTINCT FROM OLD.crm_stage THEN
    NEW.crm_stage_updated_at = now();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS contact_messages_track_stage_trg ON public.contact_messages;
CREATE TRIGGER contact_messages_track_stage_trg
BEFORE INSERT OR UPDATE OF crm_stage ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.contact_messages_track_stage();
