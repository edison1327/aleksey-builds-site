
CREATE TABLE public.sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  target_type text NOT NULL CHECK (target_type IN ('work_order','contact_message')),
  priority text,
  first_response_minutes integer NOT NULL DEFAULT 60,
  resolution_minutes integer NOT NULL DEFAULT 1440,
  business_hours_only boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sla_policies TO authenticated;
GRANT ALL ON public.sla_policies TO service_role;
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read sla_policies" ON public.sla_policies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage sla_policies" ON public.sla_policies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER update_sla_policies_updated_at BEFORE UPDATE ON public.sla_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add SLA tracking columns
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS sla_policy_id uuid REFERENCES public.sla_policies(id),
  ADD COLUMN IF NOT EXISTS sla_first_response_due timestamptz,
  ADD COLUMN IF NOT EXISTS sla_resolution_due timestamptz,
  ADD COLUMN IF NOT EXISTS sla_first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_breached boolean NOT NULL DEFAULT false;

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS sla_policy_id uuid REFERENCES public.sla_policies(id),
  ADD COLUMN IF NOT EXISTS sla_first_response_due timestamptz,
  ADD COLUMN IF NOT EXISTS sla_resolution_due timestamptz,
  ADD COLUMN IF NOT EXISTS sla_first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_breached boolean NOT NULL DEFAULT false;

-- Helper to pick policy
CREATE OR REPLACE FUNCTION public.pick_sla_policy(_type text, _priority text)
RETURNS public.sla_policies LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.sla_policies
  WHERE is_active = true AND target_type = _type
    AND (priority IS NULL OR priority = _priority)
  ORDER BY (priority = _priority) DESC NULLS LAST, sort_order ASC
  LIMIT 1;
$$;

-- Assign SLA on new work order
CREATE OR REPLACE FUNCTION public.apply_wo_sla()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.sla_policies;
BEGIN
  IF TG_OP='INSERT' AND NEW.sla_policy_id IS NULL THEN
    _p := public.pick_sla_policy('work_order', NEW.priority);
    IF _p.id IS NOT NULL THEN
      NEW.sla_policy_id := _p.id;
      NEW.sla_first_response_due := NEW.created_at + (_p.first_response_minutes || ' minutes')::interval;
      NEW.sla_resolution_due := NEW.created_at + (_p.resolution_minutes || ' minutes')::interval;
    END IF;
  END IF;
  -- Mark breach on update
  IF NEW.status IN ('completed','cancelled') AND OLD.status NOT IN ('completed','cancelled') THEN
    IF NEW.sla_resolution_due IS NOT NULL AND now() > NEW.sla_resolution_due THEN
      NEW.sla_breached := true;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_apply_wo_sla ON public.work_orders;
CREATE TRIGGER trg_apply_wo_sla BEFORE INSERT OR UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.apply_wo_sla();

-- Assign SLA on new contact message
CREATE OR REPLACE FUNCTION public.apply_msg_sla()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.sla_policies;
BEGIN
  IF TG_OP='INSERT' AND NEW.sla_policy_id IS NULL THEN
    _p := public.pick_sla_policy('contact_message', NULL);
    IF _p.id IS NOT NULL THEN
      NEW.sla_policy_id := _p.id;
      NEW.sla_first_response_due := NEW.created_at + (_p.first_response_minutes || ' minutes')::interval;
      NEW.sla_resolution_due := NEW.created_at + (_p.resolution_minutes || ' minutes')::interval;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_apply_msg_sla ON public.contact_messages;
CREATE TRIGGER trg_apply_msg_sla BEFORE INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.apply_msg_sla();

-- Track first response from message_replies
CREATE OR REPLACE FUNCTION public.track_msg_first_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.author_role IN ('admin','staff') AND COALESCE(NEW.is_internal,false) = false THEN
    UPDATE public.contact_messages
      SET sla_first_response_at = COALESCE(sla_first_response_at, NEW.created_at),
          sla_breached = CASE
            WHEN sla_first_response_at IS NULL AND sla_first_response_due IS NOT NULL AND NEW.created_at > sla_first_response_due THEN true
            ELSE sla_breached
          END
      WHERE id = NEW.message_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_track_msg_first_response ON public.message_replies;
CREATE TRIGGER trg_track_msg_first_response AFTER INSERT ON public.message_replies
  FOR EACH ROW EXECUTE FUNCTION public.track_msg_first_response();

-- Dashboard function
CREATE OR REPLACE FUNCTION public.get_sla_metrics(_days integer DEFAULT 30)
RETURNS TABLE(
  scope text,
  total bigint,
  breached bigint,
  on_time bigint,
  compliance_pct numeric,
  avg_first_response_min numeric,
  avg_resolution_min numeric
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH wo AS (
    SELECT
      count(*)::bigint total,
      count(*) FILTER (WHERE sla_breached)::bigint breached,
      count(*) FILTER (WHERE NOT sla_breached)::bigint on_time,
      AVG(EXTRACT(EPOCH FROM (sla_first_response_at - created_at))/60) avg_fr,
      AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) FILTER (WHERE completed_at IS NOT NULL) avg_res
    FROM public.work_orders
    WHERE created_at >= now() - (_days||' days')::interval
      AND sla_policy_id IS NOT NULL
  ),
  msg AS (
    SELECT
      count(*)::bigint total,
      count(*) FILTER (WHERE sla_breached)::bigint breached,
      count(*) FILTER (WHERE NOT sla_breached)::bigint on_time,
      AVG(EXTRACT(EPOCH FROM (sla_first_response_at - created_at))/60) avg_fr,
      NULL::numeric avg_res
    FROM public.contact_messages
    WHERE created_at >= now() - (_days||' days')::interval
      AND sla_policy_id IS NOT NULL
  )
  SELECT 'work_orders'::text, total, breached, on_time,
    CASE WHEN total>0 THEN ROUND((on_time::numeric/total)*100,1) ELSE 0 END,
    ROUND(COALESCE(avg_fr,0),1), ROUND(COALESCE(avg_res,0),1)
  FROM wo
  UNION ALL
  SELECT 'messages'::text, total, breached, on_time,
    CASE WHEN total>0 THEN ROUND((on_time::numeric/total)*100,1) ELSE 0 END,
    ROUND(COALESCE(avg_fr,0),1), NULL
  FROM msg;
$$;

CREATE INDEX IF NOT EXISTS idx_wo_sla_due ON public.work_orders(sla_resolution_due) WHERE sla_resolution_due IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_msg_sla_due ON public.contact_messages(sla_first_response_due) WHERE sla_first_response_due IS NOT NULL;
