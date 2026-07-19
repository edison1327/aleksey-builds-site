
-- Incidents reported by operator on a work order
CREATE TABLE IF NOT EXISTS public.work_order_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  category text,
  title text NOT NULL,
  description text,
  photo_url text,
  lat numeric,
  lng numeric,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','dismissed')),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_order_incidents TO authenticated;
GRANT ALL ON public.work_order_incidents TO service_role;
ALTER TABLE public.work_order_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage incidents" ON public.work_order_incidents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Assigned operator reads own incidents" ON public.work_order_incidents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.id = work_order_id AND wo.assigned_to = auth.uid()));

CREATE POLICY "Assigned operator creates incidents" ON public.work_order_incidents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.id = work_order_id AND wo.assigned_to = auth.uid()));

CREATE POLICY "Assigned operator updates own incidents" ON public.work_order_incidents
  FOR UPDATE TO authenticated
  USING (reported_by = auth.uid())
  WITH CHECK (reported_by = auth.uid());

CREATE TRIGGER work_order_incidents_updated
  BEFORE UPDATE ON public.work_order_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify admins on new incidents
CREATE OR REPLACE FUNCTION public.notify_new_incident()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _code text;
BEGIN
  SELECT code INTO _code FROM public.work_orders WHERE id = NEW.work_order_id;
  PERFORM public.notify_admins(
    'incident',
    'Incidencia ('||NEW.severity||'): '||NEW.title,
    'OT '||COALESCE(_code,'')||' — '||COALESCE(NEW.category,''),
    '/admin#workorders',
    jsonb_build_object('work_order_id',NEW.work_order_id,'incident_id',NEW.id,'severity',NEW.severity)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER work_order_incidents_notify
  AFTER INSERT ON public.work_order_incidents
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_incident();

-- Material reservations linked to a work order + stock item
CREATE TABLE IF NOT EXISTS public.work_order_material_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  stock_item_id uuid NOT NULL REFERENCES public.stock_items(id) ON DELETE RESTRICT,
  quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','consumed','released')),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_order_material_reservations TO authenticated;
GRANT ALL ON public.work_order_material_reservations TO service_role;
ALTER TABLE public.work_order_material_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reservations" ON public.work_order_material_reservations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Assigned operator reads reservations" ON public.work_order_material_reservations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.id = work_order_id AND wo.assigned_to = auth.uid()));

CREATE POLICY "Assigned operator creates reservations" ON public.work_order_material_reservations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.id = work_order_id AND wo.assigned_to = auth.uid()));

CREATE POLICY "Assigned operator updates own reservations" ON public.work_order_material_reservations
  FOR UPDATE TO authenticated
  USING (requested_by = auth.uid())
  WITH CHECK (requested_by = auth.uid());

CREATE TRIGGER work_order_reservations_updated
  BEFORE UPDATE ON public.work_order_material_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- On consume: register a stock_movements 'consume' to decrement inventory
CREATE OR REPLACE FUNCTION public.reservation_apply_consume()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'consumed' AND (OLD.status IS DISTINCT FROM 'consumed') THEN
    INSERT INTO public.stock_movements (stock_item_id, movement_type, quantity, reason, work_order_id, created_by)
    VALUES (NEW.stock_item_id, 'consume', NEW.quantity, 'OT reservation consumed', NEW.work_order_id, NEW.requested_by);
    NEW.consumed_at := now();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER work_order_reservations_consume
  BEFORE UPDATE ON public.work_order_material_reservations
  FOR EACH ROW EXECUTE FUNCTION public.reservation_apply_consume();
