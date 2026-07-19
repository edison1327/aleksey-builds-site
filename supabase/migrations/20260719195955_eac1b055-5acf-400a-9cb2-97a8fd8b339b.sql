
CREATE OR REPLACE FUNCTION public.get_demand_forecast()
RETURNS TABLE(service text, month date, bookings bigint, forecast_next numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH base AS (
    SELECT COALESCE(equipment_type,'general') AS service,
           date_trunc('month', start_date)::date AS month,
           count(*)::bigint AS bookings
    FROM public.equipment_bookings
    WHERE status IN ('confirmed','completed')
      AND start_date >= (CURRENT_DATE - INTERVAL '12 months')
    GROUP BY 1,2
  ),
  avg3 AS (
    SELECT service, AVG(bookings) AS forecast_next
    FROM (
      SELECT service, bookings,
             row_number() OVER (PARTITION BY service ORDER BY month DESC) rn
      FROM base
    ) x WHERE rn <= 3 GROUP BY service
  )
  SELECT b.service, b.month, b.bookings, ROUND(COALESCE(a.forecast_next,0),1)
  FROM base b LEFT JOIN avg3 a ON a.service=b.service
  ORDER BY b.service, b.month;
$$;

CREATE OR REPLACE FUNCTION public.get_maintenance_predictions()
RETURNS TABLE(machinery_id uuid, name text, usage_hours numeric, next_service_hours numeric, hours_remaining numeric, risk text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT m.id, m.name,
    COALESCE(m.usage_hours,0),
    COALESCE(m.next_service_hours,0),
    COALESCE(m.next_service_hours,0) - COALESCE(m.usage_hours,0),
    CASE
      WHEN COALESCE(m.next_service_hours,0) - COALESCE(m.usage_hours,0) <= 0 THEN 'critical'
      WHEN COALESCE(m.next_service_hours,0) - COALESCE(m.usage_hours,0) <= 20 THEN 'high'
      WHEN COALESCE(m.next_service_hours,0) - COALESCE(m.usage_hours,0) <= 50 THEN 'medium'
      ELSE 'low'
    END
  FROM public.machinery m
  WHERE m.is_active = true AND m.service_interval_hours IS NOT NULL
  ORDER BY (COALESCE(m.next_service_hours,0) - COALESCE(m.usage_hours,0)) ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_customer_churn()
RETURNS TABLE(customer_email text, customer_name text, last_activity timestamp with time zone, days_inactive integer, total_orders bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH activity AS (
    SELECT customer_email, MAX(customer_name) AS customer_name,
           MAX(created_at) AS last_activity, count(*)::bigint AS total_orders
    FROM public.work_orders WHERE customer_email IS NOT NULL GROUP BY customer_email
    UNION ALL
    SELECT customer_email, MAX(customer_name), MAX(created_at), count(*)::bigint
    FROM public.equipment_bookings WHERE customer_email IS NOT NULL GROUP BY customer_email
  ),
  agg AS (
    SELECT customer_email,
           MAX(customer_name) AS customer_name,
           MAX(last_activity) AS last_activity,
           SUM(total_orders) AS total_orders
    FROM activity GROUP BY customer_email
  )
  SELECT customer_email, customer_name, last_activity,
         EXTRACT(DAY FROM (now() - last_activity))::int AS days_inactive,
         total_orders
  FROM agg
  WHERE last_activity < now() - INTERVAL '90 days' AND total_orders >= 1
  ORDER BY last_activity ASC LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.get_cross_sell()
RETURNS TABLE(service_a text, service_b text, pair_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  WITH cust AS (
    SELECT customer_email, equipment_type
    FROM public.equipment_bookings
    WHERE customer_email IS NOT NULL AND equipment_type IS NOT NULL
    GROUP BY customer_email, equipment_type
  )
  SELECT a.equipment_type, b.equipment_type, count(*)::bigint
  FROM cust a JOIN cust b
    ON a.customer_email=b.customer_email AND a.equipment_type < b.equipment_type
  GROUP BY 1,2 ORDER BY 3 DESC LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.get_demand_forecast() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_maintenance_predictions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_churn() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cross_sell() TO authenticated;
