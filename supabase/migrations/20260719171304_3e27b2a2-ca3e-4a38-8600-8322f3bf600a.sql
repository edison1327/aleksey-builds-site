
-- PURCHASE ORDERS
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  requisition_id UUID,
  title TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PEN',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  expected_at DATE,
  delivered_at DATE,
  payment_terms TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage POs" ON public.purchase_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unid',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_qty NUMERIC(12,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage PO items" ON public.purchase_order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- RECEPTIONS
CREATE TABLE public.purchase_receptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  received_at DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_note TEXT,
  received_by TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_receptions TO authenticated;
GRANT ALL ON public.purchase_receptions TO service_role;
ALTER TABLE public.purchase_receptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage receptions" ON public.purchase_receptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.purchase_reception_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_id UUID NOT NULL REFERENCES public.purchase_receptions(id) ON DELETE CASCADE,
  po_item_id UUID NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_reception_items TO authenticated;
GRANT ALL ON public.purchase_reception_items TO service_role;
ALTER TABLE public.purchase_reception_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reception items" ON public.purchase_reception_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- REQUISITIONS
CREATE TABLE public.requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  converted_po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisitions TO authenticated;
GRANT ALL ON public.requisitions TO service_role;
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage requisitions" ON public.requisitions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Requesters view their requisitions" ON public.requisitions FOR SELECT TO authenticated
  USING (requester_id = auth.uid());
CREATE POLICY "Requesters create requisitions" ON public.requisitions FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE TABLE public.requisition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID NOT NULL REFERENCES public.requisitions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unid',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisition_items TO authenticated;
GRANT ALL ON public.requisition_items TO service_role;
ALTER TABLE public.requisition_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage req items" ON public.requisition_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Requesters manage their req items" ON public.requisition_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.requisitions r WHERE r.id = requisition_id AND r.requester_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.requisitions r WHERE r.id = requisition_id AND r.requester_id = auth.uid()));

-- Timestamps
CREATE TRIGGER purchase_orders_updated BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER requisitions_updated BEFORE UPDATE ON public.requisitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recalc PO totals + received status
CREATE OR REPLACE FUNCTION public.recalc_purchase_order()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _po UUID; _sub NUMERIC(12,2); _tax NUMERIC(12,2); _total_qty NUMERIC(12,3); _recv_qty NUMERIC(12,3);
BEGIN
  _po := COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  SELECT COALESCE(SUM(subtotal),0), COALESCE(SUM(quantity),0), COALESCE(SUM(received_qty),0)
    INTO _sub, _total_qty, _recv_qty
    FROM public.purchase_order_items WHERE purchase_order_id = _po;
  SELECT tax INTO _tax FROM public.purchase_orders WHERE id = _po;
  UPDATE public.purchase_orders SET
    subtotal = _sub,
    total = _sub + COALESCE(_tax,0),
    status = CASE
      WHEN status IN ('cancelled','invoiced') THEN status
      WHEN _total_qty > 0 AND _recv_qty >= _total_qty THEN 'received'
      WHEN _recv_qty > 0 THEN 'partial'
      ELSE status
    END,
    delivered_at = CASE WHEN _total_qty > 0 AND _recv_qty >= _total_qty AND delivered_at IS NULL THEN CURRENT_DATE ELSE delivered_at END
  WHERE id = _po;
  RETURN NULL;
END; $$;

CREATE TRIGGER recalc_po_on_items AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_purchase_order();

-- Sync received_qty from reception items
CREATE OR REPLACE FUNCTION public.sync_po_received()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _item UUID; _sum NUMERIC(12,3);
BEGIN
  _item := COALESCE(NEW.po_item_id, OLD.po_item_id);
  SELECT COALESCE(SUM(quantity),0) INTO _sum FROM public.purchase_reception_items WHERE po_item_id = _item;
  UPDATE public.purchase_order_items SET received_qty = _sum WHERE id = _item;
  RETURN NULL;
END; $$;

CREATE TRIGGER sync_po_received_trg AFTER INSERT OR UPDATE OR DELETE ON public.purchase_reception_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_po_received();

-- Notifications
CREATE OR REPLACE FUNCTION public.notify_new_po()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _sname TEXT;
BEGIN
  SELECT name INTO _sname FROM public.suppliers WHERE id = NEW.supplier_id;
  PERFORM public.notify_admins('purchase_order','Nueva OC: '||NEW.code,
    COALESCE(_sname,'Proveedor')||' — '||NEW.total::text||' '||NEW.currency,
    '/admin#purchasing', jsonb_build_object('purchase_order_id',NEW.id));
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_new_po_trg AFTER INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_po();

CREATE OR REPLACE FUNCTION public.notify_new_requisition()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins('requisition','Nueva requisición: '||NEW.code,
    COALESCE(NEW.requester_name,'Solicitante')||' — pendiente de aprobación',
    '/admin#purchasing', jsonb_build_object('requisition_id',NEW.id));
  RETURN NEW;
END; $$;
CREATE TRIGGER notify_new_requisition_trg AFTER INSERT ON public.requisitions
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_requisition();
