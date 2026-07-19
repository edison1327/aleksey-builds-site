
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.equipment_bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_by_email TEXT;

-- Constrain status values (drop first if re-run)
DO $$ BEGIN
  ALTER TABLE public.testimonials
    ADD CONSTRAINT testimonials_status_check
    CHECK (status IN ('pending','approved','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Public view: approved + active only
DROP POLICY IF EXISTS "Anyone can view active testimonials" ON public.testimonials;
CREATE POLICY "Public views approved testimonials"
ON public.testimonials FOR SELECT
TO public
USING (is_active = true AND status = 'approved');

-- Users can view their own submissions (any status)
CREATE POLICY "Users view own testimonials"
ON public.testimonials FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert a testimonial only if they have a completed booking
CREATE POLICY "Users insert own verified testimonial"
ON public.testimonials FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND is_active = false
  AND EXISTS (
    SELECT 1 FROM public.equipment_bookings b
    WHERE b.created_by = auth.uid()
      AND b.status IN ('completed','approved','confirmed')
  )
);

-- Users can update/delete their own while still pending
CREATE POLICY "Users update own pending testimonial"
ON public.testimonials FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users delete own pending testimonial"
ON public.testimonials FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Trigger: when a review is approved by admin, mark it active + verified if linked to booking
CREATE OR REPLACE FUNCTION public.testimonials_on_approve()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    NEW.is_active := true;
    IF NEW.booking_id IS NOT NULL THEN
      NEW.verified := true;
    END IF;
  END IF;
  IF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.is_active := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_testimonials_on_approve ON public.testimonials;
CREATE TRIGGER trg_testimonials_on_approve
BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.testimonials_on_approve();

-- Notify admins when a new user review is submitted
CREATE OR REPLACE FUNCTION public.notify_new_testimonial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.status = 'pending' THEN
    PERFORM public.notify_admins(
      'testimonial',
      'Nueva reseña por moderar',
      COALESCE(NEW.name, 'Cliente') || ' envió una reseña',
      '/admin#testimonials',
      jsonb_build_object('testimonial_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_new_testimonial() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_new_testimonial ON public.testimonials;
CREATE TRIGGER trg_notify_new_testimonial
AFTER INSERT ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.notify_new_testimonial();
