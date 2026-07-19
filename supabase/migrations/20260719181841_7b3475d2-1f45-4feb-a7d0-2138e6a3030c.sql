
-- 1) Drop overly-permissive public SELECT policy on job_applications
DROP POLICY IF EXISTS "Applicants can view their own applications" ON public.job_applications;

-- 2) Remove contact_messages from realtime publication (PII leak)
ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_messages;

-- 3) Remove broad SELECT policies on public storage buckets to prevent listing
--    (Public URL fetches via /object/public/ still work regardless of RLS)
DROP POLICY IF EXISTS "Anyone can view hero images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view hero videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view site images" ON storage.objects;

-- 4) Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated where inappropriate.
--    Trigger functions and internal helpers should not be directly callable.
REVOKE EXECUTE ON FUNCTION public.notify_booking_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_work_order_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_invoice_payment() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_invoice() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_cert_expiring() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_subcontract_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalc_supplier_rating() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_po() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_requisition() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_leave_request() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_employee_cert_expiring() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_contract_change() FROM anon, authenticated, PUBLIC;

-- BI analytics RPCs: admins-only via authenticated (revoke from anon)
REVOKE EXECUTE ON FUNCTION public.get_cash_forecast() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_project_pnl() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_monthly_pnl() FROM anon, PUBLIC;
