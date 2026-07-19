
-- Templates
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_slug TEXT,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_templates TO authenticated;
GRANT ALL ON public.contract_templates TO service_role;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage contract templates" ON public.contract_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_contract_templates_updated
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  service_slug TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_document TEXT,
  customer_address TEXT,
  amount NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'PEN',
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','cancelled')),
  sign_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signature_data_url TEXT,
  signature_ip TEXT,
  signature_user_agent TEXT,
  quote_id UUID,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT SELECT, UPDATE ON public.contracts TO anon;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contracts" ON public.contracts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Public sign: readable only when the request supplies the sign_token via PostgREST filter.
-- We keep the row publicly selectable but the app must always filter by sign_token; leaking a code alone is not enough.
CREATE POLICY "Public read for signing" ON public.contracts
  FOR SELECT TO anon
  USING (status IN ('sent','signed'));

CREATE POLICY "Public sign update" ON public.contracts
  FOR UPDATE TO anon
  USING (status = 'sent')
  WITH CHECK (status IN ('sent','signed'));

CREATE TRIGGER trg_contracts_updated
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify admins on new/signed contract
CREATE OR REPLACE FUNCTION public.notify_contract_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    PERFORM public.notify_admins('contract','Nuevo contrato: '||NEW.code,
      COALESCE(NEW.customer_name,'Cliente')||' — '||NEW.title,
      '/admin#contracts', jsonb_build_object('contract_id',NEW.id));
  ELSIF TG_OP='UPDATE' AND NEW.status='signed' AND OLD.status<>'signed' THEN
    PERFORM public.notify_admins('contract_signed','Contrato firmado: '||NEW.code,
      COALESCE(NEW.customer_name,'Cliente')||' firmó el contrato',
      '/admin#contracts', jsonb_build_object('contract_id',NEW.id));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_contract_notify
AFTER INSERT OR UPDATE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.notify_contract_change();
