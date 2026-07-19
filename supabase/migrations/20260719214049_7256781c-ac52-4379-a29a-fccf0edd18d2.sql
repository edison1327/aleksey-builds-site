
REVOKE EXECUTE ON FUNCTION public.get_top_suppliers(text, int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_invite_top_suppliers(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_top_suppliers(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_invite_top_suppliers(uuid, int) TO authenticated;
