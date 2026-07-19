
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp templates"
  ON public.whatsapp_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.whatsapp_templates (key, label, body, sort_order) VALUES
  ('cobro', 'Recordatorio de cobro', 'Hola {nombre}, te recordamos que la factura {codigo} por {monto} vence el {vencimiento}. Puedes pagarla aquí: {enlace}. ¡Gracias!', 1),
  ('reserva', 'Confirmación de reserva', 'Hola {nombre}, tu reserva del {fecha} está confirmada. Cualquier duda contáctanos por este medio.', 2),
  ('ot', 'OT en camino', 'Hola {nombre}, tu OT {codigo} fue asignada y nuestro equipo se comunicará en breve.', 3)
ON CONFLICT (key) DO NOTHING;
