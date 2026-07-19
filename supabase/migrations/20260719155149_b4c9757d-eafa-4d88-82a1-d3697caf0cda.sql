
-- WAVE T: machinery/vehicles service tracking
ALTER TABLE public.machinery
  ADD COLUMN IF NOT EXISTS usage_hours NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_interval_hours NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS next_service_hours NUMERIC(10,2);

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS usage_hours NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_interval_hours NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS next_service_hours NUMERIC(10,2);

CREATE TABLE IF NOT EXISTS public.equipment_service_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('machinery','vehicle')),
  equipment_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  hours_at_service NUMERIC(10,2),
  hours_added NUMERIC(10,2) DEFAULT 0,
  cost NUMERIC(12,2),
  notes TEXT,
  performed_by TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_service_log TO authenticated;
GRANT ALL ON public.equipment_service_log TO service_role;

ALTER TABLE public.equipment_service_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage service log"
  ON public.equipment_service_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors manage service log"
  ON public.equipment_service_log FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE INDEX IF NOT EXISTS idx_service_log_equipment
  ON public.equipment_service_log(equipment_type, equipment_id, performed_at DESC);

-- WAVE U: work orders
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL DEFAULT ('WO-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  source_type TEXT DEFAULT 'quote' CHECK (source_type IN ('quote','booking','manual')),
  source_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  site_address TEXT,
  equipment_type TEXT CHECK (equipment_type IN ('machinery','vehicle')),
  equipment_id UUID,
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','on_hold','completed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_orders TO authenticated;
GRANT ALL ON public.work_orders TO service_role;

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage work orders"
  ON public.work_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors manage work orders"
  ON public.work_orders FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Assignee can view own work orders"
  ON public.work_orders FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Assignee can update own work orders"
  ON public.work_orders FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON public.work_orders(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status, priority);

CREATE TRIGGER trg_work_orders_updated
BEFORE UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
