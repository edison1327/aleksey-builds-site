
-- Trigger: on subcontract completion → notify admins to evaluate
CREATE OR REPLACE FUNCTION public.notify_subcontract_evaluation_needed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _sname TEXT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    IF NOT EXISTS (SELECT 1 FROM public.supplier_evaluations WHERE subcontract_id = NEW.id) THEN
      SELECT name INTO _sname FROM public.suppliers WHERE id = NEW.supplier_id;
      PERFORM public.notify_admins(
        'evaluation_pending',
        'Evaluar proveedor: ' || COALESCE(_sname, ''),
        'El subcontrato ' || NEW.code || ' se completó. Registra tu evaluación.',
        '/admin#suppliers',
        jsonb_build_object('subcontract_id', NEW.id, 'supplier_id', NEW.supplier_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_subcontract_evaluation_needed ON public.subcontracts;
CREATE TRIGGER trg_subcontract_evaluation_needed
AFTER UPDATE ON public.subcontracts
FOR EACH ROW EXECUTE FUNCTION public.notify_subcontract_evaluation_needed();

-- Daily reminder job function (call from cron / edge function)
CREATE OR REPLACE FUNCTION public.notify_pending_supplier_evaluations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row RECORD; _sname TEXT; _cnt INT := 0;
BEGIN
  FOR _row IN
    SELECT s.id, s.code, s.supplier_id, s.end_date
    FROM public.subcontracts s
    WHERE s.status = 'completed'
      AND COALESCE(s.end_date, s.updated_at::date) <= CURRENT_DATE - 3
      AND NOT EXISTS (SELECT 1 FROM public.supplier_evaluations e WHERE e.subcontract_id = s.id)
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'evaluation_reminder'
          AND n.metadata->>'subcontract_id' = s.id::text
          AND n.created_at > now() - interval '5 days'
      )
  LOOP
    SELECT name INTO _sname FROM public.suppliers WHERE id = _row.supplier_id;
    PERFORM public.notify_admins(
      'evaluation_reminder',
      'Recordatorio: evaluar ' || COALESCE(_sname, 'proveedor'),
      'Subcontrato ' || _row.code || ' finalizado sin evaluación.',
      '/admin#suppliers',
      jsonb_build_object('subcontract_id', _row.id, 'supplier_id', _row.supplier_id)
    );
    _cnt := _cnt + 1;
  END LOOP;
  RETURN _cnt;
END; $$;

-- List helper for admin UI
CREATE OR REPLACE FUNCTION public.get_pending_supplier_evaluations()
RETURNS TABLE(
  subcontract_id UUID,
  subcontract_code TEXT,
  subcontract_title TEXT,
  supplier_id UUID,
  supplier_name TEXT,
  end_date DATE,
  days_overdue INT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.code, s.title, s.supplier_id, sup.name,
         s.end_date,
         GREATEST(0, (CURRENT_DATE - COALESCE(s.end_date, s.updated_at::date))::int) AS days_overdue
  FROM public.subcontracts s
  LEFT JOIN public.suppliers sup ON sup.id = s.supplier_id
  WHERE s.status = 'completed'
    AND NOT EXISTS (SELECT 1 FROM public.supplier_evaluations e WHERE e.subcontract_id = s.id)
  ORDER BY COALESCE(s.end_date, s.updated_at::date) ASC;
$$;

REVOKE ALL ON FUNCTION public.notify_pending_supplier_evaluations() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_pending_supplier_evaluations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_supplier_evaluations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_pending_supplier_evaluations() TO service_role;
