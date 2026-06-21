-- Add slug column to projects for SEO-friendly URLs
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug TEXT;

-- Helper to generate URL-safe slug from text
CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from
    regexp_replace(
      regexp_replace(
        lower(
          translate(
            coalesce(input, ''),
            'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
            'aaaaaeeeeiiiioooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
          )
        ),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-{2,}', '-', 'g'
    )
  );
$$;

-- Backfill slugs from title (append short id when duplicates exist)
WITH s AS (
  SELECT id, title,
    public.slugify(title) AS base,
    row_number() OVER (PARTITION BY public.slugify(title) ORDER BY created_at) AS rn
  FROM public.projects
  WHERE slug IS NULL OR slug = ''
)
UPDATE public.projects p
SET slug = CASE WHEN s.rn = 1 THEN s.base ELSE s.base || '-' || substr(p.id::text, 1, 6) END
FROM s WHERE p.id = s.id;

-- Enforce unique non-null slugs
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique ON public.projects (slug) WHERE slug IS NOT NULL;

-- Auto-generate slug on insert when not provided
CREATE OR REPLACE FUNCTION public.projects_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
  suffix INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    candidate := public.slugify(NEW.title);
    WHILE EXISTS (SELECT 1 FROM public.projects WHERE slug = candidate AND id <> NEW.id) LOOP
      suffix := suffix + 1;
      candidate := public.slugify(NEW.title) || '-' || suffix::text;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_set_slug_trigger ON public.projects;
CREATE TRIGGER projects_set_slug_trigger
BEFORE INSERT OR UPDATE OF title, slug ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_set_slug();