
-- Approval workflow + payment tracking for POs
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_notes text,
  ADD COLUMN IF NOT EXISTS amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

-- Payments per PO
CREATE TABLE IF NOT EXISTS public.po_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(12,2) NOT NULL,
  method text NOT NULL DEFAULT 'transfer',
  reference text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.po_payments TO authenticated;
GRANT ALL ON public.po_payments TO service_role;
ALTER TABLE public.po_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage PO payments" ON public.po_payments
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Recalc payment status on PO
CREATE OR REPLACE FUNCTION public.recalc_po_paid() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE _po uuid; _sum numeric(12,2); _total numeric(12,2);
BEGIN
  _po := COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  SELECT COALESCE(SUM(amount),0) INTO _sum FROM public.po_payments WHERE purchase_order_id=_po;
  SELECT total INTO _total FROM public.purchase_orders WHERE id=_po;
  UPDATE public.purchase_orders SET
    amount_paid=_sum,
    payment_status = CASE
      WHEN _sum >= _total AND _total > 0 THEN 'paid'
      WHEN _sum > 0 THEN 'partial'
      ELSE 'unpaid' END
  WHERE id=_po;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS recalc_po_paid_trg ON public.po_payments;
CREATE TRIGGER recalc_po_paid_trg AFTER INSERT OR UPDATE OR DELETE ON public.po_payments
  FOR EACH ROW EXECUTE FUNCTION public.recalc_po_paid();

-- Stock items + movements
CREATE TABLE IF NOT EXISTS public.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'unid',
  current_qty numeric(12,3) NOT NULL DEFAULT 0,
  min_qty numeric(12,3) NOT NULL DEFAULT 0,
  location text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_items TO authenticated;
GRANT ALL ON public.stock_items TO service_role;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock items" ON public.stock_items
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER stock_items_updated BEFORE UPDATE ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id uuid NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity numeric(12,3) NOT NULL,
  reference text,
  work_order_id uuid REFERENCES public.work_orders(id) ON DELETE SET NULL,
  po_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock movements" ON public.stock_movements
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.apply_stock_movement() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE _delta numeric(12,3);
BEGIN
  IF TG_OP='INSERT' THEN
    _delta := CASE WHEN NEW.movement_type IN ('in','return') THEN NEW.quantity
                   WHEN NEW.movement_type IN ('out','consume') THEN -NEW.quantity
                   ELSE 0 END;
    UPDATE public.stock_items SET current_qty = current_qty + _delta WHERE id = NEW.stock_item_id;
  ELSIF TG_OP='DELETE' THEN
    _delta := CASE WHEN OLD.movement_type IN ('in','return') THEN -OLD.quantity
                   WHEN OLD.movement_type IN ('out','consume') THEN OLD.quantity
                   ELSE 0 END;
    UPDATE public.stock_items SET current_qty = current_qty + _delta WHERE id = OLD.stock_item_id;
  END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS apply_stock_movement_trg ON public.stock_movements;
CREATE TRIGGER apply_stock_movement_trg AFTER INSERT OR DELETE ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();
