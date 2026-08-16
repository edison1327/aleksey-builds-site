-- 1) equipment_bookings: remove public read of PII
DROP POLICY IF EXISTS "Bookings are publicly viewable for availability" ON public.equipment_bookings;

CREATE OR REPLACE FUNCTION public.get_equipment_availability(_equipment_type text, _equipment_id uuid)
RETURNS TABLE (id uuid, start_date date, end_date date, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.start_date::date, b.end_date::date, b.status::text
  FROM public.equipment_bookings b
  WHERE b.equipment_type = _equipment_type
    AND b.equipment_id = _equipment_id
    AND b.end_date >= current_date
    AND b.status IN ('reserved','blocked')
  ORDER BY b.start_date
$$;

REVOKE ALL ON FUNCTION public.get_equipment_availability(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_equipment_availability(text, uuid) TO anon, authenticated, service_role;

-- 2) equipment_maintenance: staff-only reads
DROP POLICY IF EXISTS "Maintenance publicly viewable" ON public.equipment_maintenance;
CREATE POLICY "Staff can read maintenance"
ON public.equipment_maintenance
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role_text(auth.uid(), 'manager')
  OR public.has_role_text(auth.uid(), 'editor')
  OR public.has_role_text(auth.uid(), 'operator')
  OR public.has_role_text(auth.uid(), 'viewer')
);

-- 3) Preview tokens validated server-side
DROP POLICY IF EXISTS "Public preview by token" ON public.blog_posts;
DROP POLICY IF EXISTS "Public preview by token" ON public.projects;

CREATE OR REPLACE FUNCTION public.get_preview_blog_post(_slug text, _token uuid)
RETURNS SETOF public.blog_posts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.blog_posts
  WHERE slug = _slug
    AND deleted_at IS NULL
    AND preview_token IS NOT NULL
    AND preview_token = _token
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_preview_project(_slug text, _token uuid)
RETURNS SETOF public.projects
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.projects
  WHERE slug = _slug
    AND preview_token IS NOT NULL
    AND preview_token = _token
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_preview_blog_post(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_preview_project(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_preview_blog_post(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_preview_project(text, uuid) TO anon, authenticated, service_role;