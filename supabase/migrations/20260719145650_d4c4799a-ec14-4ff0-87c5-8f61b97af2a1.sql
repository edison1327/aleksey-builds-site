
REVOKE EXECUTE ON FUNCTION public.notify_admins(TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_contact_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_booking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_application() FROM PUBLIC, anon, authenticated;
