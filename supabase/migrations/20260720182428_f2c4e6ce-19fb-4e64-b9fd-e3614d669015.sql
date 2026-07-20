
-- Ola AV: Pool de compras consolidadas
CREATE TABLE public.purchase_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE DEFAULT ('POOL-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  title TEXT NOT NULL,
  category TEXT,
  currency TEXT NOT NULL DEFAULT 'PEN',
  status TEXT NOT NULL DEFAULT 'collecting', -- collecting | rfq_sent | awarded | closed | cancelled
  deadline DATE,
  notes TEXT,
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_pools TO authenticated;
GRANT ALL ON public.purchase_pools TO service_role;
ALTER TABLE public.purchase_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage pools" ON public.purchase_pools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_pools_updated BEFORE UPDATE ON public.purchase_pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.purchase_pool_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id UUID NOT NULL REFERENCES public.purchase_pools(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unidad',
  total_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  target_price NUMERIC(12,2),
  specifications TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_pool_items TO authenticated;
GRANT ALL ON public.purchase_pool_items TO service_role;
ALTER TABLE public.purchase_pool_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage pool items" ON public.purchase_pool_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.purchase_pool_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id UUID NOT NULL REFERENCES public.purchase_pools(id) ON DELETE CASCADE,
  pool_item_id UUID NOT NULL REFERENCES public.purchase_pool_items(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  requisition_id UUID REFERENCES public.requisitions(id) ON DELETE SET NULL,
  quantity NUMERIC(12,3) NOT NULL,
  requested_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_pool_contributions TO authenticated;
GRANT ALL ON public.purchase_pool_contributions TO service_role;
ALTER TABLE public.purchase_pool_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage pool contributions" ON public.purchase_pool_contributions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Recalculate pool item total_quantity from contributions
CREATE OR REPLACE FUNCTION public.recalc_pool_item_qty()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _item UUID; _sum NUMERIC(12,3);
BEGIN
  _item := COALESCE(NEW.pool_item_id, OLD.pool_item_id);
  SELECT COALESCE(SUM(quantity),0) INTO _sum FROM public.purchase_pool_contributions WHERE pool_item_id = _item;
  UPDATE public.purchase_pool_items SET total_quantity = _sum WHERE id = _item;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_pool_contrib_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_pool_contributions
  FOR EACH ROW EXECUTE FUNCTION public.recalc_pool_item_qty();

-- Convert pool to RFQ
CREATE OR REPLACE FUNCTION public.convert_pool_to_rfq(_pool_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pool RECORD; _rfq_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _pool FROM public.purchase_pools WHERE id = _pool_id;
  IF _pool IS NULL THEN RAISE EXCEPTION 'pool_not_found'; END IF;
  IF _pool.rfq_id IS NOT NULL THEN RAISE EXCEPTION 'pool_already_has_rfq'; END IF;

  INSERT INTO public.rfqs (title, description, category, currency, deadline, notes)
  VALUES (
    'Pool: ' || _pool.title,
    'Consolidación de demanda multi-sucursal (' || _pool.code || ')',
    _pool.category, _pool.currency, _pool.deadline, _pool.notes
  ) RETURNING id INTO _rfq_id;

  INSERT INTO public.rfq_items (rfq_id, description, quantity, unit, specifications, sort_order)
  SELECT _rfq_id, description, total_quantity, unit, specifications, sort_order
    FROM public.purchase_pool_items WHERE pool_id = _pool_id ORDER BY sort_order;

  UPDATE public.purchase_pools SET rfq_id = _rfq_id, status = 'rfq_sent' WHERE id = _pool_id;
  RETURN _rfq_id;
END; $$;

-- Summary view helper
CREATE OR REPLACE FUNCTION public.get_pool_summary(_pool_id UUID)
RETURNS TABLE(
  pool_item_id UUID, description TEXT, unit TEXT, total_quantity NUMERIC,
  contributions_count BIGINT, branches_count BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, i.description, i.unit, i.total_quantity,
    (SELECT count(*) FROM public.purchase_pool_contributions c WHERE c.pool_item_id = i.id),
    (SELECT count(DISTINCT c.branch_id) FROM public.purchase_pool_contributions c WHERE c.pool_item_id = i.id)
  FROM public.purchase_pool_items i WHERE i.pool_id = _pool_id ORDER BY i.sort_order;
$$;
