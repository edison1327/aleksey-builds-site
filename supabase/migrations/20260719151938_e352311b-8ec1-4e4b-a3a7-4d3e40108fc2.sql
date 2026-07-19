
CREATE TABLE public.reminder_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  offset_hours INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_templates TO authenticated;
GRANT ALL ON public.reminder_templates TO service_role;

ALTER TABLE public.reminder_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reminder templates"
ON public.reminder_templates FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reminder_templates_updated_at
BEFORE UPDATE ON public.reminder_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.reminder_templates (key, name, title, message, offset_hours, is_active) VALUES
('pipeline_overdue', 'Acción del pipeline vencida', 'Acción pendiente vencida', '{name}: {action} (etapa {stage})', 0, true),
('pipeline_upcoming', 'Acción del pipeline próxima', 'Acción próxima a vencer', '{name}: {action} vence en menos de 24h', -24, false);
