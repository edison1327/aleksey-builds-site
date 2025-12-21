-- Add footer_description column to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN footer_description TEXT DEFAULT 'Soluciones integrales en construcción, ingeniería y alquiler de maquinaria pesada.';