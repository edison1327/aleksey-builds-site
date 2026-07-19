
-- ============ OLA V: FACTURACIÓN ============
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  booking_id UUID REFERENCES public.equipment_bookings(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_tax_id TEXT,
  customer_address TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partial','paid','overdue','cancelled')),
  notes TEXT,
  terms TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoice items" ON public.invoice_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'transfer' CHECK (method IN ('cash','transfer','card','check','other')),
  reference TEXT,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_payments TO authenticated;
GRANT ALL ON public.invoice_payments TO service_role;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage payments" ON public.invoice_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Update invoice totals when payments change
CREATE OR REPLACE FUNCTION public.recalc_invoice_paid() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _inv UUID; _sum NUMERIC(12,2); _total NUMERIC(12,2);
BEGIN
  _inv := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT COALESCE(SUM(amount),0) INTO _sum FROM public.invoice_payments WHERE invoice_id = _inv;
  SELECT total INTO _total FROM public.invoices WHERE id = _inv;
  UPDATE public.invoices SET
    amount_paid = _sum,
    status = CASE
      WHEN _sum >= _total AND _total > 0 THEN 'paid'
      WHEN _sum > 0 THEN 'partial'
      WHEN due_date < CURRENT_DATE AND status IN ('sent','partial') THEN 'overdue'
      ELSE status
    END,
    paid_at = CASE WHEN _sum >= _total AND _total > 0 THEN now() ELSE paid_at END
  WHERE id = _inv;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_invoice_payments_recalc AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_paid();

-- Notify admins on new invoice / payment
CREATE OR REPLACE FUNCTION public.notify_new_invoice() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins('invoice','Nueva factura: '||NEW.code,
    COALESCE(NEW.customer_name,'Cliente')||' — '||NEW.total::text||' '||NEW.currency,
    '/admin#invoices', jsonb_build_object('invoice_id',NEW.id));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_new_invoice AFTER INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_invoice();

CREATE OR REPLACE FUNCTION public.notify_invoice_payment() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _code TEXT;
BEGIN
  SELECT code INTO _code FROM public.invoices WHERE id = NEW.invoice_id;
  PERFORM public.notify_admins('invoice_payment','Pago recibido: '||COALESCE(_code,''),
    NEW.amount::text||' vía '||NEW.method,
    '/admin#invoices', jsonb_build_object('invoice_id',NEW.invoice_id,'payment_id',NEW.id));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_invoice_payment AFTER INSERT ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_invoice_payment();
