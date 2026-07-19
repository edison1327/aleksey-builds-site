
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role inserts notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Function: notify all admins
CREATE OR REPLACE FUNCTION public.notify_admins(_type TEXT, _title TEXT, _message TEXT, _link TEXT, _metadata JSONB DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  SELECT ur.user_id, _type, _title, _message, _link, _metadata
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
END;
$$;

-- Trigger: new contact message
CREATE OR REPLACE FUNCTION public.notify_new_contact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_admins(
    'contact_message',
    'Nuevo mensaje de contacto',
    COALESCE(NEW.name, 'Anónimo') || ': ' || COALESCE(LEFT(NEW.message, 80), ''),
    '/admin#messages',
    jsonb_build_object('message_id', NEW.id)
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_new_contact_message
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_contact_message();

-- Trigger: new booking
CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_admins(
    'booking',
    'Nueva reserva de equipo',
    COALESCE(NEW.customer_name, 'Cliente') || ' solicitó una reserva',
    '/admin#bookings',
    jsonb_build_object('booking_id', NEW.id)
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_new_booking
AFTER INSERT ON public.equipment_bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_new_booking();

-- Trigger: new job application
CREATE OR REPLACE FUNCTION public.notify_new_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_admins(
    'application',
    'Nueva postulación',
    COALESCE(NEW.full_name, 'Candidato') || ' aplicó a un puesto',
    '/admin#careers',
    jsonb_build_object('application_id', NEW.id)
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_new_application
AFTER INSERT ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_new_application();

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
