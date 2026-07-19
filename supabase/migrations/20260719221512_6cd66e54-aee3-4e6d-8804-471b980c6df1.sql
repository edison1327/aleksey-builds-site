
CREATE TABLE public.framework_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  category TEXT,
  currency TEXT NOT NULL DEFAULT 'PEN',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_amount NUMERIC(14,2),
  min_amount NUMERIC(14,2),
  consumed_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_terms TEXT,
  delivery_terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.framework_agreements TO authenticated;
GRANT ALL ON public.framework_agreements TO service_role;
ALTER TABLE public.framework_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage framework agreements"
  ON public.framework_agreements FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_framework_agreements_supplier ON public.framework_agreements(supplier_id);
CREATE INDEX idx_framework_agreements_status ON public.framework_agreements(status);
CREATE INDEX idx_framework_agreements_end_date ON public.framework_agreements(end_date);

CREATE TRIGGER update_framework_agreements_updated_at
  BEFORE UPDATE ON public.framework_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_framework_agreement()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date must be >= start_date';
  END IF;
  IF NEW.max_amount IS NOT NULL AND NEW.max_amount < 0 THEN
    RAISE EXCEPTION 'max_amount must be >= 0';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_validate_framework_agreement
  BEFORE INSERT OR UPDATE ON public.framework_agreements
  FOR EACH ROW EXECUTE FUNCTION public.validate_framework_agreement();

CREATE TABLE public.framework_agreement_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_id UUID NOT NULL REFERENCES public.framework_agreements(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  sku TEXT,
  unit TEXT NOT NULL DEFAULT 'und',
  unit_price NUMERIC(12,4) NOT NULL DEFAULT 0,
  min_quantity NUMERIC(12,3),
  max_quantity NUMERIC(12,3),
  consumed_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  lead_time_days INT,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.framework_agreement_items TO authenticated;
GRANT ALL ON public.framework_agreement_items TO service_role;
ALTER TABLE public.framework_agreement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage framework agreement items"
  ON public.framework_agreement_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_framework_agreement_items_agreement ON public.framework_agreement_items(agreement_id);

CREATE TRIGGER update_framework_agreement_items_updated_at
  BEFORE UPDATE ON public.framework_agreement_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS framework_agreement_id UUID REFERENCES public.framework_agreements(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS framework_agreement_item_id UUID REFERENCES public.framework_agreement_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_po_items_fa ON public.purchase_order_items(framework_agreement_id);
CREATE INDEX IF NOT EXISTS idx_po_items_fa_item ON public.purchase_order_items(framework_agreement_item_id);

CREATE OR REPLACE FUNCTION public.recalc_framework_agreement_consumption()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _aids UUID[] := ARRAY[]::UUID[];
  _iids UUID[] := ARRAY[]::UUID[];
  _aid UUID;
  _iid UUID;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    IF NEW.framework_agreement_id IS NOT NULL THEN _aids := array_append(_aids, NEW.framework_agreement_id); END IF;
    IF NEW.framework_agreement_item_id IS NOT NULL THEN _iids := array_append(_iids, NEW.framework_agreement_item_id); END IF;
  END IF;
  IF TG_OP IN ('UPDATE','DELETE') THEN
    IF OLD.framework_agreement_id IS NOT NULL THEN _aids := array_append(_aids, OLD.framework_agreement_id); END IF;
    IF OLD.framework_agreement_item_id IS NOT NULL THEN _iids := array_append(_iids, OLD.framework_agreement_item_id); END IF;
  END IF;

  FOREACH _iid IN ARRAY (SELECT ARRAY(SELECT DISTINCT x FROM unnest(_iids) x)) LOOP
    UPDATE public.framework_agreement_items i
      SET consumed_quantity = COALESCE((
        SELECT SUM(poi.quantity)
        FROM public.purchase_order_items poi
        JOIN public.purchase_orders po ON po.id = poi.purchase_order_id
        WHERE poi.framework_agreement_item_id = i.id
          AND po.status NOT IN ('cancelled','draft')
      ), 0)
      WHERE i.id = _iid;
  END LOOP;

  FOREACH _aid IN ARRAY (SELECT ARRAY(SELECT DISTINCT x FROM unnest(_aids) x)) LOOP
    UPDATE public.framework_agreements a
      SET consumed_amount = COALESCE((
        SELECT SUM(poi.subtotal)
        FROM public.purchase_order_items poi
        JOIN public.purchase_orders po ON po.id = poi.purchase_order_id
        WHERE poi.framework_agreement_id = a.id
          AND po.status NOT IN ('cancelled','draft')
      ), 0)
      WHERE a.id = _aid;

    UPDATE public.framework_agreements a
      SET status = CASE
        WHEN a.status = 'cancelled' THEN 'cancelled'
        WHEN a.end_date < CURRENT_DATE THEN 'expired'
        WHEN a.max_amount IS NOT NULL AND a.consumed_amount >= a.max_amount THEN 'exhausted'
        ELSE a.status
      END
      WHERE a.id = _aid;
  END LOOP;

  RETURN NULL;
END; $$;

CREATE TRIGGER trg_recalc_fa_consumption
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_framework_agreement_consumption();

CREATE OR REPLACE FUNCTION public.notify_expiring_framework_agreements()
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row RECORD; _cnt INT := 0; _sname TEXT;
BEGIN
  FOR _row IN
    SELECT a.id, a.code, a.title, a.end_date, a.supplier_id
    FROM public.framework_agreements a
    WHERE a.status = 'active'
      AND a.end_date <= CURRENT_DATE + 30
      AND a.end_date >= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'framework_expiring'
          AND n.metadata->>'agreement_id' = a.id::text
          AND n.created_at > now() - interval '7 days'
      )
  LOOP
    SELECT name INTO _sname FROM public.suppliers WHERE id = _row.supplier_id;
    PERFORM public.notify_admins(
      'framework_expiring',
      'Contrato marco por vencer: ' || _row.code,
      COALESCE(_sname,'Proveedor') || ' — vence ' || _row.end_date::text,
      '/admin#framework',
      jsonb_build_object('agreement_id', _row.id)
    );
    _cnt := _cnt + 1;
  END LOOP;
  RETURN _cnt;
END; $$;

CREATE OR REPLACE FUNCTION public.get_active_framework_agreements(_supplier_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID, code TEXT, title TEXT, supplier_id UUID, supplier_name TEXT,
  currency TEXT, end_date DATE, max_amount NUMERIC, consumed_amount NUMERIC,
  usage_pct NUMERIC, items_count BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.code, a.title, a.supplier_id, s.name,
         a.currency, a.end_date, a.max_amount, a.consumed_amount,
         CASE WHEN COALESCE(a.max_amount,0) > 0
              THEN ROUND((a.consumed_amount / a.max_amount) * 100, 2)
              ELSE 0 END,
         (SELECT count(*) FROM public.framework_agreement_items i WHERE i.agreement_id = a.id)
  FROM public.framework_agreements a
  JOIN public.suppliers s ON s.id = a.supplier_id
  WHERE a.status = 'active'
    AND a.end_date >= CURRENT_DATE
    AND (_supplier_id IS NULL OR a.supplier_id = _supplier_id)
  ORDER BY a.end_date ASC;
$$;
