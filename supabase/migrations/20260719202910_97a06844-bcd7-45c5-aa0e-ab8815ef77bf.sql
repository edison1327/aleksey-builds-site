
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  country TEXT DEFAULT 'CO',
  currency TEXT DEFAULT 'COP',
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view organizations" ON public.organizations FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'viewer'));
CREATE POLICY "Admins manage organizations" ON public.organizations FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view branches" ON public.branches FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'viewer'));
CREATE POLICY "Admins manage branches" ON public.branches FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.user_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  role_in_branch TEXT DEFAULT 'member',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, branch_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_branches TO authenticated;
GRANT ALL ON public.user_branches TO service_role;
ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own memberships" ON public.user_branches FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage memberships" ON public.user_branches FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.user_has_branch_access(_user_id UUID, _branch_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT has_role(_user_id,'admin')
      OR _branch_id IS NULL
      OR EXISTS (SELECT 1 FROM public.user_branches WHERE user_id=_user_id AND branch_id=_branch_id);
$$;

ALTER TABLE public.work_orders        ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.invoices           ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.purchase_orders    ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.equipment_bookings ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.employees          ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.projects           ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.machinery          ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.vehicles           ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);
ALTER TABLE public.stock_items        ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

CREATE INDEX IF NOT EXISTS idx_wo_branch  ON public.work_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_inv_branch ON public.invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_po_branch  ON public.purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_eb_branch  ON public.equipment_bookings(branch_id);
CREATE INDEX IF NOT EXISTS idx_emp_branch ON public.employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_prj_branch ON public.projects(branch_id);

CREATE OR REPLACE FUNCTION public.get_consolidated_pnl(_from DATE DEFAULT (CURRENT_DATE - INTERVAL '12 months')::date,
                                                       _to   DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  organization_id UUID, organization_name TEXT,
  branch_id UUID, branch_name TEXT,
  invoiced NUMERIC, paid NUMERIC,
  purchase_cost NUMERIC, labor_cost NUMERIC,
  net NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH inv AS (
    SELECT branch_id, SUM(total) AS invoiced, SUM(COALESCE(amount_paid,0)) AS paid
    FROM public.invoices WHERE issue_date BETWEEN _from AND _to GROUP BY branch_id
  ),
  po AS (
    SELECT branch_id, SUM(total) AS purchase_cost
    FROM public.purchase_orders
    WHERE created_at::date BETWEEN _from AND _to AND status NOT IN ('cancelled','draft')
    GROUP BY branch_id
  ),
  lab AS (
    SELECT e.branch_id, SUM(COALESCE(te.hours,0) * COALESCE(e.hourly_rate,0)) AS labor_cost
    FROM public.time_entries te LEFT JOIN public.employees e ON e.id = te.employee_id
    WHERE te.entry_date BETWEEN _from AND _to AND te.approved = true
    GROUP BY e.branch_id
  )
  SELECT o.id, o.name, b.id, b.name,
         COALESCE(inv.invoiced,0), COALESCE(inv.paid,0),
         COALESCE(po.purchase_cost,0), COALESCE(lab.labor_cost,0),
         COALESCE(inv.invoiced,0)-COALESCE(po.purchase_cost,0)-COALESCE(lab.labor_cost,0)
  FROM public.branches b
  JOIN public.organizations o ON o.id = b.organization_id
  LEFT JOIN inv ON inv.branch_id = b.id
  LEFT JOIN po  ON po.branch_id  = b.id
  LEFT JOIN lab ON lab.branch_id = b.id
  ORDER BY o.name, b.name;
$$;

CREATE TRIGGER trg_orgs_updated   BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_branch_updated BEFORE UPDATE ON public.branches      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
