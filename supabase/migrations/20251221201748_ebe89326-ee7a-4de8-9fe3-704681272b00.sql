-- Add footer_copyright column to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN footer_copyright TEXT DEFAULT 'Todos los derechos reservados.';