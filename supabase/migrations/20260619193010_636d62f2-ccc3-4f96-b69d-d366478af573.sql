ALTER TABLE public.navigation_links ADD COLUMN IF NOT EXISTS title text;

-- Backfill títulos por defecto para los grupos existentes del footer
UPDATE public.navigation_links SET title = 'Servicios' WHERE location = 'footer_services' AND title IS NULL;
UPDATE public.navigation_links SET title = 'Empresa' WHERE location = 'footer_company' AND title IS NULL;
UPDATE public.navigation_links SET title = 'Menú Principal' WHERE location = 'navbar' AND title IS NULL;