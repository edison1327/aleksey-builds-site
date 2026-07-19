
-- RFQ (Request for Quotation) system
CREATE TABLE public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT ('RFQ-' || to_char(now(),'YYMMDD') || '-' || substring(gen_random_uuid()::text,1,6)),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'PEN',
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, closed, awarded, cancelled
  awarded_response_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfqs TO authenticated;
GRANT ALL ON public.rfqs TO service_role;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage rfqs" ON public.rfqs FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));
CREATE TRIGGER trg_rfqs_updated BEFORE UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rfq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unidad',
  specifications TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_items TO authenticated;
GRANT ALL ON public.rfq_items TO service_role;
ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage rfq_items" ON public.rfq_items FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));

-- Invitations sent to suppliers (with unique access token for portal)
CREATE TABLE public.rfq_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24),'hex'),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, viewed, responded, declined
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rfq_id, supplier_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_invitations TO authenticated;
GRANT ALL ON public.rfq_invitations TO service_role;
ALTER TABLE public.rfq_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage rfq_invitations" ON public.rfq_invitations FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));

-- Supplier responses (quotes)
CREATE TABLE public.rfq_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES public.rfq_invitations(id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PEN',
  delivery_days INT,
  payment_terms TEXT,
  validity_days INT DEFAULT 30,
  notes TEXT,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{rfq_item_id, unit_price, subtotal, notes}]
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, awarded, rejected
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_responses TO authenticated;
GRANT ALL ON public.rfq_responses TO service_role;
ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage rfq_responses" ON public.rfq_responses FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));
CREATE TRIGGER trg_rfq_responses_updated BEFORE UPDATE ON public.rfq_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public supplier portal accessors (security definer, token-based)
CREATE OR REPLACE FUNCTION public.get_rfq_by_token(_token TEXT)
RETURNS TABLE (
  invitation_id UUID, rfq_id UUID, code TEXT, title TEXT, description TEXT,
  category TEXT, currency TEXT, deadline DATE, status TEXT,
  supplier_id UUID, supplier_name TEXT, items JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.rfq_invitations
    SET viewed_at = COALESCE(viewed_at, now()),
        status = CASE WHEN status='pending' THEN 'viewed' ELSE status END
    WHERE access_token = _token;

  RETURN QUERY
  SELECT inv.id, r.id, r.code, r.title, r.description, r.category, r.currency, r.deadline, r.status,
         s.id, s.name,
         COALESCE((SELECT jsonb_agg(jsonb_build_object(
           'id', i.id, 'description', i.description, 'quantity', i.quantity,
           'unit', i.unit, 'specifications', i.specifications, 'sort_order', i.sort_order
         ) ORDER BY i.sort_order) FROM public.rfq_items i WHERE i.rfq_id=r.id), '[]'::jsonb)
  FROM public.rfq_invitations inv
  JOIN public.rfqs r ON r.id = inv.rfq_id
  JOIN public.suppliers s ON s.id = inv.supplier_id
  WHERE inv.access_token = _token
    AND r.status IN ('sent','closed');
END; $$;
GRANT EXECUTE ON FUNCTION public.get_rfq_by_token(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_rfq_response(
  _token TEXT, _total NUMERIC, _currency TEXT, _delivery_days INT,
  _payment_terms TEXT, _validity_days INT, _notes TEXT, _items JSONB, _ip TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _inv RECORD; _resp_id UUID;
BEGIN
  SELECT inv.id AS invitation_id, inv.rfq_id, inv.supplier_id
    INTO _inv
    FROM public.rfq_invitations inv
    JOIN public.rfqs r ON r.id = inv.rfq_id
    WHERE inv.access_token = _token AND r.status = 'sent';
  IF _inv IS NULL THEN RAISE EXCEPTION 'invalid_token_or_closed'; END IF;

  INSERT INTO public.rfq_responses (
    rfq_id, invitation_id, supplier_id, total_amount, currency,
    delivery_days, payment_terms, validity_days, notes, items_json, submitted_ip
  ) VALUES (
    _inv.rfq_id, _inv.invitation_id, _inv.supplier_id, _total, COALESCE(_currency,'PEN'),
    _delivery_days, _payment_terms, _validity_days, _notes, COALESCE(_items,'[]'::jsonb), _ip
  ) RETURNING id INTO _resp_id;

  UPDATE public.rfq_invitations
    SET status='responded'
    WHERE id = _inv.invitation_id;

  PERFORM public.notify_admins('rfq_response',
    'Nueva cotización recibida',
    'Un proveedor respondió a la RFQ',
    '/admin#rfqs',
    jsonb_build_object('rfq_id',_inv.rfq_id,'response_id',_resp_id));

  RETURN _resp_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.submit_rfq_response(TEXT,NUMERIC,TEXT,INT,TEXT,INT,TEXT,JSONB,TEXT) TO anon, authenticated;

-- Notify admins on new RFQ creation (optional)
CREATE OR REPLACE FUNCTION public.notify_rfq_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='UPDATE' AND NEW.status='awarded' AND OLD.status<>'awarded' THEN
    PERFORM public.notify_admins('rfq_awarded','RFQ adjudicada: '||NEW.code, NEW.title, '/admin#rfqs',
      jsonb_build_object('rfq_id',NEW.id));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_rfqs_notify AFTER UPDATE ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION public.notify_rfq_change();
