
-- Ola AX: coordenadas de despacho + asignación de vehículo en OT
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS site_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS site_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS route_order INTEGER,
  ADD COLUMN IF NOT EXISTS route_eta_minutes INTEGER;

CREATE INDEX IF NOT EXISTS idx_work_orders_dispatch
  ON public.work_orders(scheduled_start, assigned_vehicle_id)
  WHERE scheduled_start IS NOT NULL;

-- RPC: OTs sin asignar en un rango con coordenadas
CREATE OR REPLACE FUNCTION public.get_dispatch_board(_from timestamptz, _to timestamptz)
RETURNS TABLE (
  id uuid,
  title text,
  site_address text,
  site_lat numeric,
  site_lng numeric,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  status text,
  priority text,
  assigned_vehicle_id uuid,
  route_order integer,
  route_eta_minutes integer,
  branch_id uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT wo.id, wo.title, wo.site_address, wo.site_lat, wo.site_lng,
         wo.scheduled_start, wo.scheduled_end, wo.status, wo.priority,
         wo.assigned_vehicle_id, wo.route_order, wo.route_eta_minutes, wo.branch_id
  FROM public.work_orders wo
  WHERE wo.scheduled_start >= _from
    AND wo.scheduled_start < _to
    AND wo.status NOT IN ('completed','cancelled')
  ORDER BY wo.assigned_vehicle_id NULLS FIRST, wo.route_order NULLS LAST, wo.scheduled_start;
$$;

GRANT EXECUTE ON FUNCTION public.get_dispatch_board(timestamptz, timestamptz) TO authenticated;

-- RPC: reordenar rutas por vehículo
CREATE OR REPLACE FUNCTION public.assign_dispatch_route(
  _vehicle_id uuid,
  _work_order_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  i integer;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  FOR i IN 1..array_length(_work_order_ids, 1) LOOP
    UPDATE public.work_orders
       SET assigned_vehicle_id = _vehicle_id,
           route_order = i,
           updated_at = now()
     WHERE id = _work_order_ids[i];
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_dispatch_route(uuid, uuid[]) TO authenticated;
