
-- Agregar columnas _en faltantes para internacionalización ES/EN
-- Las columnas existentes en español siguen siendo la fuente de verdad / fallback

ALTER TABLE public.about_content
  ADD COLUMN IF NOT EXISTS mission_en text,
  ADD COLUMN IF NOT EXISTS vision_en text,
  ADD COLUMN IF NOT EXISTS values_en text[];

ALTER TABLE public.company_benefits
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_en text;

ALTER TABLE public.contact_info
  ADD COLUMN IF NOT EXISTS address_en text,
  ADD COLUMN IF NOT EXISTS business_hours_en text;

ALTER TABLE public.job_positions
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS department_en text,
  ADD COLUMN IF NOT EXISTS location_en text,
  ADD COLUMN IF NOT EXISTS type_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS requirements_en jsonb;

ALTER TABLE public.navigation_links
  ADD COLUMN IF NOT EXISTS label_en text,
  ADD COLUMN IF NOT EXISTS title_en text;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS category_en text,
  ADD COLUMN IF NOT EXISTS location_en text;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS features_en text[];

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS tagline_en text,
  ADD COLUMN IF NOT EXISTS footer_description_en text,
  ADD COLUMN IF NOT EXISTS footer_copyright_en text;

ALTER TABLE public.team_stats
  ADD COLUMN IF NOT EXISTS label_en text;

ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS role_en text,
  ADD COLUMN IF NOT EXISTS company_en text,
  ADD COLUMN IF NOT EXISTS content_en text;
