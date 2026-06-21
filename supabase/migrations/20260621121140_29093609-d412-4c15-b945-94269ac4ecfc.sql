
-- 1. Add new enum values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- 2. Text-based role checker (avoids enum cast at policy parse time)
CREATE OR REPLACE FUNCTION public.has_role_text(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  )
$$;

-- 3. Editor write access on content tables
CREATE POLICY "Editors manage about content" ON public.about_content
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage blog posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage benefits" ON public.company_benefits
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage contact info" ON public.contact_info
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage hero content" ON public.hero_content
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage job positions" ON public.job_positions
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage machinery" ON public.machinery
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage navigation links" ON public.navigation_links
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage projects" ON public.projects
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage services" ON public.services
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage social links" ON public.social_links
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage team stats" ON public.team_stats
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage testimonials" ON public.testimonials
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

CREATE POLICY "Editors manage vehicles" ON public.vehicles
  FOR ALL TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'))
  WITH CHECK (public.has_role_text(auth.uid(), 'editor'));

-- 4. Viewer read-only access to sensitive lists
CREATE POLICY "Viewers can read contact messages" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (public.has_role_text(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can read job applications" ON public.job_applications
  FOR SELECT TO authenticated
  USING (public.has_role_text(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can read bookings" ON public.equipment_bookings
  FOR SELECT TO authenticated
  USING (public.has_role_text(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_role_text(auth.uid(), 'viewer'));

-- Editors should also be able to read these to do their job (e.g. see messages context)
CREATE POLICY "Editors can read contact messages" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (public.has_role_text(auth.uid(), 'editor'));
