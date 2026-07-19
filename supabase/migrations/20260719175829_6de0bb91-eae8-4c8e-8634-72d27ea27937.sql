
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_work_orders_project ON public.work_orders(project_id);

CREATE TABLE IF NOT EXISTS public.project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('labor','materials','machinery','subcontract','other')),
  description TEXT,
  planned_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PEN',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_budgets TO authenticated;
GRANT ALL ON public.project_budgets TO service_role;

ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage project budgets"
  ON public.project_budgets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_project_budgets_updated
  BEFORE UPDATE ON public.project_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_project_budgets_project ON public.project_budgets(project_id);

CREATE OR REPLACE FUNCTION public.get_project_pnl()
RETURNS TABLE(
  project_id UUID, project_title TEXT,
  planned_total NUMERIC, invoiced_total NUMERIC, paid_total NUMERIC,
  labor_cost NUMERIC, materials_cost NUMERIC, subcontract_cost NUMERIC,
  total_cost NUMERIC, margin NUMERIC, margin_pct NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH planned AS (
    SELECT project_id, SUM(planned_amount) AS planned_total
    FROM public.project_budgets GROUP BY project_id
  ),
  inv AS (
    SELECT wo.project_id,
           SUM(i.total) AS invoiced_total,
           SUM(COALESCE(i.amount_paid,0)) AS paid_total
    FROM public.invoices i
    JOIN public.work_orders wo ON wo.id = i.work_order_id
    WHERE wo.project_id IS NOT NULL GROUP BY wo.project_id
  ),
  labor AS (
    SELECT wo.project_id,
           SUM(COALESCE(te.hours,0) * COALESCE(e.hourly_rate,0)) AS labor_cost
    FROM public.time_entries te
    JOIN public.work_orders wo ON wo.id = te.work_order_id
    LEFT JOIN public.employees e ON e.id = te.employee_id
    WHERE te.approved = true AND wo.project_id IS NOT NULL
    GROUP BY wo.project_id
  ),
  mat AS (
    SELECT wo.project_id, SUM(po.total) AS materials_cost
    FROM public.purchase_orders po
    JOIN public.work_orders wo ON wo.id = po.work_order_id
    WHERE po.status NOT IN ('cancelled','draft') AND wo.project_id IS NOT NULL
    GROUP BY wo.project_id
  ),
  sub AS (
    SELECT wo.project_id, SUM(s.amount) AS subcontract_cost
    FROM public.subcontracts s
    JOIN public.work_orders wo ON wo.id = s.work_order_id
    WHERE wo.project_id IS NOT NULL GROUP BY wo.project_id
  )
  SELECT p.id, p.title,
    COALESCE(pl.planned_total,0),
    COALESCE(inv.invoiced_total,0),
    COALESCE(inv.paid_total,0),
    COALESCE(labor.labor_cost,0),
    COALESCE(mat.materials_cost,0),
    COALESCE(sub.subcontract_cost,0),
    COALESCE(labor.labor_cost,0)+COALESCE(mat.materials_cost,0)+COALESCE(sub.subcontract_cost,0),
    COALESCE(inv.invoiced_total,0)-(COALESCE(labor.labor_cost,0)+COALESCE(mat.materials_cost,0)+COALESCE(sub.subcontract_cost,0)),
    CASE WHEN COALESCE(inv.invoiced_total,0)>0
      THEN ROUND(((COALESCE(inv.invoiced_total,0)-(COALESCE(labor.labor_cost,0)+COALESCE(mat.materials_cost,0)+COALESCE(sub.subcontract_cost,0)))/inv.invoiced_total)*100,2)
      ELSE 0 END
  FROM public.projects p
  LEFT JOIN planned pl ON pl.project_id=p.id
  LEFT JOIN inv ON inv.project_id=p.id
  LEFT JOIN labor ON labor.project_id=p.id
  LEFT JOIN mat ON mat.project_id=p.id
  LEFT JOIN sub ON sub.project_id=p.id
  ORDER BY p.title;
$$;
REVOKE ALL ON FUNCTION public.get_project_pnl() FROM public;
GRANT EXECUTE ON FUNCTION public.get_project_pnl() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_monthly_pnl()
RETURNS TABLE(month DATE, invoiced NUMERIC, paid NUMERIC, purchase_cost NUMERIC, labor_cost NUMERIC, net NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH months AS (
    SELECT date_trunc('month', (CURRENT_DATE - (n || ' months')::interval))::date AS month
    FROM generate_series(0,11) n
  ),
  inv AS (
    SELECT date_trunc('month', issue_date)::date AS month,
           SUM(total) AS invoiced, SUM(COALESCE(amount_paid,0)) AS paid
    FROM public.invoices
    WHERE issue_date >= (CURRENT_DATE - INTERVAL '12 months')
    GROUP BY 1
  ),
  po AS (
    SELECT date_trunc('month', created_at)::date AS month, SUM(total) AS purchase_cost
    FROM public.purchase_orders
    WHERE created_at >= (CURRENT_DATE - INTERVAL '12 months')
      AND status NOT IN ('cancelled','draft')
    GROUP BY 1
  ),
  lab AS (
    SELECT date_trunc('month', te.entry_date)::date AS month,
           SUM(COALESCE(te.hours,0) * COALESCE(e.hourly_rate,0)) AS labor_cost
    FROM public.time_entries te
    LEFT JOIN public.employees e ON e.id = te.employee_id
    WHERE te.entry_date >= (CURRENT_DATE - INTERVAL '12 months') AND te.approved = true
    GROUP BY 1
  )
  SELECT m.month,
         COALESCE(inv.invoiced,0), COALESCE(inv.paid,0),
         COALESCE(po.purchase_cost,0), COALESCE(lab.labor_cost,0),
         COALESCE(inv.invoiced,0)-COALESCE(po.purchase_cost,0)-COALESCE(lab.labor_cost,0)
  FROM months m
  LEFT JOIN inv ON inv.month=m.month
  LEFT JOIN po ON po.month=m.month
  LEFT JOIN lab ON lab.month=m.month
  ORDER BY m.month;
$$;
REVOKE ALL ON FUNCTION public.get_monthly_pnl() FROM public;
GRANT EXECUTE ON FUNCTION public.get_monthly_pnl() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_cash_forecast()
RETURNS TABLE(week DATE, inflow NUMERIC, outflow NUMERIC, net NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH weeks AS (
    SELECT (date_trunc('week', CURRENT_DATE) + (n || ' weeks')::interval)::date AS week
    FROM generate_series(0,12) n
  ),
  inflow AS (
    SELECT date_trunc('week', due_date)::date AS week,
           SUM(total - COALESCE(amount_paid,0)) AS inflow
    FROM public.invoices
    WHERE status IN ('sent','partial','overdue')
      AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
    GROUP BY 1
  ),
  outflow AS (
    SELECT date_trunc('week', COALESCE(delivered_at, created_at::date))::date AS week,
           SUM(total - COALESCE(amount_paid,0)) AS outflow
    FROM public.purchase_orders
    WHERE payment_status IN ('unpaid','partial')
      AND status NOT IN ('cancelled','draft')
      AND COALESCE(delivered_at, created_at::date) BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '90 days'
    GROUP BY 1
  )
  SELECT w.week, COALESCE(i.inflow,0), COALESCE(o.outflow,0),
         COALESCE(i.inflow,0)-COALESCE(o.outflow,0)
  FROM weeks w
  LEFT JOIN inflow i ON i.week=w.week
  LEFT JOIN outflow o ON o.week=w.week
  ORDER BY w.week;
$$;
REVOKE ALL ON FUNCTION public.get_cash_forecast() FROM public;
GRANT EXECUTE ON FUNCTION public.get_cash_forecast() TO authenticated;
