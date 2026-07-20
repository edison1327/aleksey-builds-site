
CREATE OR REPLACE VIEW public.dw_monthly_sales AS
SELECT
  date_trunc('month', issue_date)::date AS month,
  count(*) AS invoice_count,
  coalesce(sum(total), 0) AS total_invoiced,
  coalesce(sum(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS total_paid,
  coalesce(sum(CASE WHEN status IN ('sent','overdue') THEN total ELSE 0 END), 0) AS total_pending
FROM public.invoices
WHERE issue_date IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW public.dw_top_clients AS
SELECT
  customer_email,
  customer_name,
  count(*) AS invoice_count,
  coalesce(sum(total), 0) AS total_revenue,
  coalesce(sum(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS total_paid,
  max(issue_date) AS last_invoice_date
FROM public.invoices
WHERE issue_date >= (current_date - interval '12 months')
  AND customer_email IS NOT NULL
GROUP BY customer_email, customer_name
ORDER BY total_revenue DESC;

CREATE OR REPLACE VIEW public.dw_top_equipment AS
SELECT
  eb.equipment_type,
  eb.equipment_id,
  CASE
    WHEN eb.equipment_type = 'machinery' THEN (SELECT name FROM public.machinery WHERE id = eb.equipment_id)
    WHEN eb.equipment_type = 'vehicle' THEN (SELECT name FROM public.vehicles WHERE id = eb.equipment_id)
    ELSE 'N/A'
  END AS equipment_name,
  count(*) AS booking_count
FROM public.equipment_bookings eb
WHERE eb.status IN ('confirmed','completed')
  AND eb.created_at >= (current_date - interval '12 months')
GROUP BY eb.equipment_type, eb.equipment_id
ORDER BY booking_count DESC;

CREATE OR REPLACE FUNCTION public.get_executive_kpis(
  _from date DEFAULT (current_date - interval '30 days')::date,
  _to date DEFAULT current_date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'period', jsonb_build_object('from', _from, 'to', _to),
    'revenue', jsonb_build_object(
      'invoiced', coalesce((SELECT sum(total) FROM invoices WHERE issue_date BETWEEN _from AND _to), 0),
      'paid', coalesce((SELECT sum(total) FROM invoices WHERE issue_date BETWEEN _from AND _to AND status = 'paid'), 0),
      'pending', coalesce((SELECT sum(total) FROM invoices WHERE issue_date BETWEEN _from AND _to AND status IN ('sent','overdue')), 0)
    ),
    'operations', jsonb_build_object(
      'bookings', (SELECT count(*) FROM equipment_bookings WHERE created_at::date BETWEEN _from AND _to),
      'work_orders', (SELECT count(*) FROM work_orders WHERE created_at::date BETWEEN _from AND _to),
      'wo_completed', (SELECT count(*) FROM work_orders WHERE created_at::date BETWEEN _from AND _to AND status = 'completed'),
      'incidents', (SELECT count(*) FROM work_order_incidents WHERE created_at::date BETWEEN _from AND _to)
    ),
    'commercial', jsonb_build_object(
      'contact_messages', (SELECT count(*) FROM contact_messages WHERE created_at::date BETWEEN _from AND _to),
      'new_clients', (SELECT count(DISTINCT customer_email) FROM invoices WHERE issue_date BETWEEN _from AND _to AND customer_email IS NOT NULL),
      'rfqs', (SELECT count(*) FROM rfqs WHERE created_at::date BETWEEN _from AND _to)
    ),
    'purchasing', jsonb_build_object(
      'po_count', (SELECT count(*) FROM purchase_orders WHERE created_at::date BETWEEN _from AND _to),
      'po_total', coalesce((SELECT sum(total) FROM purchase_orders WHERE created_at::date BETWEEN _from AND _to), 0)
    ),
    'hr', jsonb_build_object(
      'active_employees', (SELECT count(*) FROM employees WHERE status = 'active'),
      'hours_worked', coalesce((SELECT sum(hours) FROM time_entries WHERE entry_date BETWEEN _from AND _to), 0)
    )
  ) INTO _result;

  RETURN _result;
END;
$$;

GRANT SELECT ON public.dw_monthly_sales TO authenticated;
GRANT SELECT ON public.dw_top_clients TO authenticated;
GRANT SELECT ON public.dw_top_equipment TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_executive_kpis(date, date) TO authenticated;
