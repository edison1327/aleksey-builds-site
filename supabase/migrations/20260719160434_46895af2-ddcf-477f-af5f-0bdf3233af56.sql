
CREATE TABLE public.pdf_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'ALEKSEY · Ingeniería y Construcción',
  tagline TEXT,
  primary_color TEXT NOT NULL DEFAULT '#1a1a1a',
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  footer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pdf_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pdf_settings TO authenticated;
GRANT ALL ON public.pdf_settings TO service_role;

ALTER TABLE public.pdf_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pdf_settings readable by all" ON public.pdf_settings
  FOR SELECT USING (true);
CREATE POLICY "pdf_settings admin manage" ON public.pdf_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_pdf_settings_updated_at
  BEFORE UPDATE ON public.pdf_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pdf_settings (company_name) VALUES ('ALEKSEY · Ingeniería y Construcción');
