
-- Templates
CREATE TABLE public.inspection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('machinery','vehicle','both')),
  moment TEXT NOT NULL CHECK (moment IN ('pre_use','post_use','both')),
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_templates TO authenticated;
GRANT ALL ON public.inspection_templates TO service_role;
ALTER TABLE public.inspection_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read templates" ON public.inspection_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage templates" ON public.inspection_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.inspection_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.inspection_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'ok_fail' CHECK (item_type IN ('ok_fail','text','number','photo')),
  critical BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_template_items TO authenticated;
GRANT ALL ON public.inspection_template_items TO service_role;
ALTER TABLE public.inspection_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read tpl items" ON public.inspection_template_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage tpl items" ON public.inspection_template_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Inspections
CREATE TABLE public.equipment_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.inspection_templates(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  machinery_id UUID REFERENCES public.machinery(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operator_name TEXT,
  moment TEXT NOT NULL CHECK (moment IN ('pre_use','post_use')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','with_observations','rejected')),
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  signature_url TEXT,
  photo_url TEXT,
  notes TEXT,
  hours_meter NUMERIC,
  odometer NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_inspections TO authenticated;
GRANT ALL ON public.equipment_inspections TO service_role;
ALTER TABLE public.equipment_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operator insert own" ON public.equipment_inspections FOR INSERT TO authenticated
  WITH CHECK (operator_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "operator read own or admin" ON public.equipment_inspections FOR SELECT TO authenticated
  USING (operator_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage inspections" ON public.equipment_inspections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.inspection_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.equipment_inspections(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.inspection_template_items(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  critical BOOLEAN NOT NULL DEFAULT false,
  value TEXT,
  is_fail BOOLEAN NOT NULL DEFAULT false,
  observation TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_responses TO authenticated;
GRANT ALL ON public.inspection_responses TO service_role;
ALTER TABLE public.inspection_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read responses if can read insp" ON public.inspection_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.equipment_inspections i WHERE i.id = inspection_id
    AND (i.operator_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "insert responses if can write insp" ON public.inspection_responses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.equipment_inspections i WHERE i.id = inspection_id
    AND (i.operator_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "admin manage responses" ON public.inspection_responses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Updated_at triggers (reuse existing update_updated_at_column if present)
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_inspection_templates_updated BEFORE UPDATE ON public.inspection_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER trg_equipment_inspections_updated BEFORE UPDATE ON public.equipment_inspections
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Auto-incident on rejected inspection linked to WO
CREATE OR REPLACE FUNCTION public.tg_inspection_create_incident()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'rejected' AND NEW.work_order_id IS NOT NULL THEN
    INSERT INTO public.work_order_incidents (work_order_id, reported_by, severity, description, created_at)
    VALUES (NEW.work_order_id, NEW.operator_id, 'high',
      'Inspección '||NEW.moment||' RECHAZADA. '||COALESCE(NEW.notes,''), now());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_inspection_incident AFTER INSERT OR UPDATE OF status ON public.equipment_inspections
  FOR EACH ROW EXECUTE FUNCTION public.tg_inspection_create_incident();

CREATE INDEX idx_inspections_wo ON public.equipment_inspections(work_order_id);
CREATE INDEX idx_inspections_operator ON public.equipment_inspections(operator_id);
CREATE INDEX idx_inspections_created ON public.equipment_inspections(created_at DESC);
CREATE INDEX idx_inspection_responses_insp ON public.inspection_responses(inspection_id);
CREATE INDEX idx_tpl_items_tpl ON public.inspection_template_items(template_id, sort_order);
