
CREATE OR REPLACE FUNCTION public.notify_customer_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_name text;
BEGIN
  IF NEW.author_role = 'customer' AND COALESCE(NEW.is_internal, false) = false THEN
    SELECT COALESCE(name, email) INTO _customer_name
    FROM public.contact_messages WHERE id = NEW.message_id;

    PERFORM public.notify_admins(
      'customer_reply',
      'Nueva respuesta del cliente',
      COALESCE(_customer_name, 'Cliente') || ': ' || COALESCE(LEFT(NEW.body, 80), ''),
      '/admin#messages',
      jsonb_build_object('message_id', NEW.message_id, 'reply_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_customer_reply ON public.message_replies;
CREATE TRIGGER trg_notify_customer_reply
AFTER INSERT ON public.message_replies
FOR EACH ROW EXECUTE FUNCTION public.notify_customer_reply();

REVOKE EXECUTE ON FUNCTION public.notify_customer_reply() FROM PUBLIC, anon, authenticated;
