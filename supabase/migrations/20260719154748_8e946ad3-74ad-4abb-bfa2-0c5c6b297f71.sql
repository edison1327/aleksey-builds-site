
CREATE TABLE public.equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('machinery','vehicle')),
  equipment_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

GRANT SELECT ON public.equipment_maintenance TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_maintenance TO authenticated;
GRANT ALL ON public.equipment_maintenance TO service_role;

ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Maintenance publicly viewable"
  ON public.equipment_maintenance FOR SELECT USING (true);

CREATE POLICY "Admins manage maintenance"
  ON public.equipment_maintenance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors manage maintenance"
  ON public.equipment_maintenance FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE INDEX idx_maint_equipment ON public.equipment_maintenance(equipment_type, equipment_id, start_date, end_date);

CREATE TRIGGER trg_maint_updated
BEFORE UPDATE ON public.equipment_maintenance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
