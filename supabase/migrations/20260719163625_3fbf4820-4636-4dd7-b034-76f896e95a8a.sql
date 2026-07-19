
-- SUPPLIERS
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ruc TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  category TEXT,
  address TEXT,
  rating NUMERIC(2,1) CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','blacklisted')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER suppliers_updated BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SUPPLIER CERTIFICATIONS
CREATE TABLE public.supplier_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  cert_type TEXT NOT NULL,
  cert_number TEXT,
  issuer TEXT,
  issued_at DATE,
  expires_at DATE,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_certifications TO authenticated;
GRANT ALL ON public.supplier_certifications TO service_role;
ALTER TABLE public.supplier_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage certifications" ON public.supplier_certifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER certs_updated BEFORE UPDATE ON public.supplier_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX supplier_certs_supplier_idx ON public.supplier_certifications(supplier_id);
CREATE INDEX supplier_certs_expires_idx ON public.supplier_certifications(expires_at);

-- SUBCONTRACTS
CREATE TABLE public.subcontracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scope TEXT,
  amount NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'PEN',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','in_progress','completed','cancelled')),
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcontracts TO authenticated;
GRANT ALL ON public.subcontracts TO service_role;
ALTER TABLE public.subcontracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage subcontracts" ON public.subcontracts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER subcontracts_updated BEFORE UPDATE ON public.subcontracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX subcontracts_supplier_idx ON public.subcontracts(supplier_id);

-- Cert expiring notification
CREATE OR REPLACE FUNCTION public.notify_cert_expiring()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _name TEXT;
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= CURRENT_DATE + 30 THEN
    SELECT name INTO _name FROM public.suppliers WHERE id = NEW.supplier_id;
    PERFORM public.notify_admins('cert_expiring','Certificación por vencer: '||NEW.cert_type,
      COALESCE(_name,'Proveedor')||' — vence '||NEW.expires_at::text,
      '/admin#suppliers', jsonb_build_object('supplier_id',NEW.supplier_id,'cert_id',NEW.id));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER cert_expiring_trg AFTER INSERT OR UPDATE ON public.supplier_certifications
  FOR EACH ROW EXECUTE FUNCTION public.notify_cert_expiring();

-- Subcontract notification
CREATE OR REPLACE FUNCTION public.notify_subcontract_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _name TEXT;
BEGIN
  SELECT name INTO _name FROM public.suppliers WHERE id = NEW.supplier_id;
  IF TG_OP='INSERT' THEN
    PERFORM public.notify_admins('subcontract','Nuevo subcontrato: '||NEW.code,
      COALESCE(_name,'Proveedor')||' — '||NEW.title,
      '/admin#suppliers', jsonb_build_object('subcontract_id',NEW.id));
  ELSIF TG_OP='UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify_admins('subcontract_status','Subcontrato '||NEW.code||': '||NEW.status,
      COALESCE(_name,'Proveedor')||' — '||NEW.title,
      '/admin#suppliers', jsonb_build_object('subcontract_id',NEW.id,'old_status',OLD.status,'new_status',NEW.status));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER subcontract_change_trg AFTER INSERT OR UPDATE ON public.subcontracts
  FOR EACH ROW EXECUTE FUNCTION public.notify_subcontract_change();

-- Seed contract templates by service
INSERT INTO public.contract_templates (name, service_slug, body, is_active) VALUES
('Alquiler de Maquinaria', 'maquinaria',
'CONTRATO DE ALQUILER DE MAQUINARIA

Entre las partes:
- ARRENDADOR: [Empresa]
- ARRENDATARIO: {{cliente}}, con documento {{documento}}, domicilio {{direccion}}.

Objeto: {{titulo}}
Monto acordado: {{moneda}} {{monto}}
Fecha: {{fecha}}

CLÁUSULAS:
1. Entrega del equipo operativo con revisión conjunta al inicio y fin del alquiler.
2. El arrendatario asume combustible, operador (salvo pacto en contrario) y daños por mal uso.
3. Pago 50% al inicio, 50% al finalizar el servicio.
4. Seguro contra terceros a cargo del arrendatario durante la vigencia.
5. Cancelación con 48 h de anticipación sin penalidad.
6. Jurisdicción: tribunales de Lima, Perú.

Firmado electrónicamente el {{fecha}}.', true),

('Servicio de Construcción', 'construccion',
'CONTRATO DE SERVICIO DE CONSTRUCCIÓN

Cliente: {{cliente}} — {{documento}}
Dirección de obra: {{direccion}}
Servicio: {{titulo}}
Monto total: {{moneda}} {{monto}}
Fecha: {{fecha}}

CLÁUSULAS:
1. El contratista ejecutará la obra conforme a planos y especificaciones anexas.
2. Cronograma pactado en anexo; retrasos imputables al cliente extienden plazos.
3. Pagos por hitos: 30% inicio, 40% avance 50%, 30% entrega final.
4. Garantía de obra de 12 meses por vicios ocultos.
5. Seguridad industrial y SCTR a cargo del contratista.
6. Cualquier adicional debe pactarse por escrito.

Firmado electrónicamente el {{fecha}}.', true),

('Servicio de Ingeniería', 'ingenieria',
'CONTRATO DE SERVICIOS DE INGENIERÍA

Cliente: {{cliente}} — {{documento}} — {{email}}
Servicio: {{titulo}}
Honorarios: {{moneda}} {{monto}}
Fecha: {{fecha}}

CLÁUSULAS:
1. Alcance: elaboración de estudios, planos y memoria descriptiva según términos de referencia.
2. Plazo de entrega según cronograma pactado.
3. Propiedad intelectual del entregable se transfiere al cliente tras pago total.
4. Confidencialidad de la información técnica del cliente por 5 años.
5. Pago 50% a la firma, 50% contra entrega aprobada.
6. Modificaciones al alcance generan honorarios adicionales.

Firmado electrónicamente el {{fecha}}.', true),

('Subcontrato con Proveedor', 'subcontrato',
'CONTRATO DE SUBCONTRATACIÓN

Entre el contratista principal y el SUBCONTRATISTA {{cliente}} ({{documento}}), domicilio {{direccion}}.
Trabajo subcontratado: {{titulo}}
Monto: {{moneda}} {{monto}}
Fecha: {{fecha}}

CLÁUSULAS:
1. El subcontratista ejecuta los trabajos bajo su propio riesgo laboral, con SCTR vigente.
2. Debe presentar certificaciones (RUC habido, SCTR, homologación) antes del inicio.
3. Cumplirá procedimientos de seguridad y calidad del contratista principal.
4. Pagos contra valorización aprobada, previa presentación de factura y comprobantes de pago a su personal.
5. Retención del 10% liberada tras período de garantía (60 días).
6. Incumplimiento faculta a rescindir el subcontrato sin indemnización.

Firmado electrónicamente el {{fecha}}.', true)
ON CONFLICT DO NOTHING;
