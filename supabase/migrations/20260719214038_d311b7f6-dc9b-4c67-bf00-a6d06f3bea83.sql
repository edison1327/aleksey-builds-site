
CREATE OR REPLACE FUNCTION public.get_top_suppliers(_category text DEFAULT NULL, _limit int DEFAULT 10)
RETURNS TABLE(
  supplier_id uuid, name text, category text, email text,
  rating numeric, evaluations_count bigint, last_evaluated_at date, would_rehire_pct numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT s.id, s.name, s.category, s.email,
         COALESCE(s.rating, 0),
         COALESCE(ev.cnt, 0),
         ev.last_at,
         COALESCE(ev.rehire_pct, 0)
  FROM public.suppliers s
  LEFT JOIN (
    SELECT supplier_id,
           count(*)::bigint AS cnt,
           MAX(evaluated_at) AS last_at,
           ROUND(AVG(CASE WHEN would_rehire THEN 100 ELSE 0 END), 1) AS rehire_pct
    FROM public.supplier_evaluations
    GROUP BY supplier_id
  ) ev ON ev.supplier_id = s.id
  WHERE s.status = 'active'
    AND (_category IS NULL OR _category = '' OR s.category ILIKE '%'||_category||'%')
  ORDER BY COALESCE(s.rating,0) DESC NULLS LAST, COALESCE(ev.cnt,0) DESC
  LIMIT _limit;
$$;

CREATE OR REPLACE FUNCTION public.auto_invite_top_suppliers(_rfq_id uuid, _limit int DEFAULT 5)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _cat text; _cnt int := 0;
BEGIN
  SELECT category INTO _cat FROM public.rfqs WHERE id = _rfq_id;

  WITH top AS (
    SELECT supplier_id FROM public.get_top_suppliers(_cat, _limit)
  ),
  ins AS (
    INSERT INTO public.rfq_invitations (rfq_id, supplier_id)
    SELECT _rfq_id, t.supplier_id
    FROM top t
    WHERE NOT EXISTS (
      SELECT 1 FROM public.rfq_invitations i
      WHERE i.rfq_id = _rfq_id AND i.supplier_id = t.supplier_id
    )
    RETURNING 1
  )
  SELECT count(*) INTO _cnt FROM ins;

  RETURN _cnt;
END;
$$;
