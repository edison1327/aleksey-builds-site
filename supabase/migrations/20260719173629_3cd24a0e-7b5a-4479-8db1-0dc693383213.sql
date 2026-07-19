
-- ============== EMPLOYEES ==============
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  document TEXT,
  role TEXT NOT NULL DEFAULT 'operario',
  phone TEXT,
  email TEXT,
  address TEXT,
  birth_date DATE,
  hire_date DATE,
  termination_date DATE,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  monthly_base NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'PEN',
  photo_url TEXT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  emergency_contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage employees" ON public.employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Employees see own record" ON public.employees FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== EMPLOYEE CERTIFICATIONS ==============
CREATE TABLE public.employee_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  cert_type TEXT NOT NULL,
  cert_number TEXT,
  issuer TEXT,
  issued_at DATE,
  expires_at DATE,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_certifications TO authenticated;
GRANT ALL ON public.employee_certifications TO service_role;
ALTER TABLE public.employee_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage employee certs" ON public.employee_certifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Employees see own certs" ON public.employee_certifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE TRIGGER trg_employee_certs_updated_at BEFORE UPDATE ON public.employee_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_employee_cert_expiring()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
DECLARE _name TEXT;
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= CURRENT_DATE + 30 THEN
    SELECT full_name INTO _name FROM public.employees WHERE id = NEW.employee_id;
    PERFORM public.notify_admins('employee_cert_expiring','Certificación de empleado por vencer: '||NEW.cert_type,
      COALESCE(_name,'Empleado')||' — vence '||NEW.expires_at::text,
      '/admin#hr', jsonb_build_object('employee_id',NEW.employee_id,'cert_id',NEW.id));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_emp_cert AFTER INSERT OR UPDATE ON public.employee_certifications
  FOR EACH ROW EXECUTE FUNCTION public.notify_employee_cert_expiring();

-- ============== TIME ENTRIES ==============
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  hours NUMERIC(6,2),
  check_in_lat NUMERIC(10,6),
  check_in_lng NUMERIC(10,6),
  check_out_lat NUMERIC(10,6),
  check_out_lng NUMERIC(10,6),
  notes TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage time entries" ON public.time_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Employees see own time" ON public.time_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "Employees insert own time" ON public.time_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "Employees update own unapproved" ON public.time_entries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()) AND approved = false);
CREATE TRIGGER trg_time_entries_updated_at BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.calc_time_entry_hours()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN
  IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
    NEW.hours := ROUND(EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in))/3600.0, 2);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_calc_time_hours BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.calc_time_entry_hours();

-- ============== LEAVE REQUESTS ==============
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT 'vacation',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(5,2),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage leave" ON public.leave_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Employees see own leave" ON public.leave_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE POLICY "Employees request own leave" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()) AND status = 'pending');
CREATE TRIGGER trg_leave_updated_at BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.calc_leave_days()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN
  IF NEW.end_date IS NOT NULL AND NEW.start_date IS NOT NULL THEN
    NEW.days := (NEW.end_date - NEW.start_date) + 1;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_calc_leave_days BEFORE INSERT OR UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.calc_leave_days();

CREATE OR REPLACE FUNCTION public.notify_new_leave_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
DECLARE _name TEXT;
BEGIN
  SELECT full_name INTO _name FROM public.employees WHERE id = NEW.employee_id;
  PERFORM public.notify_admins('leave_request','Nueva solicitud: '||NEW.leave_type,
    COALESCE(_name,'Empleado')||' — '||NEW.start_date::text||' → '||NEW.end_date::text,
    '/admin#hr', jsonb_build_object('leave_id',NEW.id));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_leave AFTER INSERT ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_leave_request();

-- ============== PAYROLL ==============
CREATE TABLE public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  currency TEXT DEFAULT 'PEN',
  total_gross NUMERIC(14,2) DEFAULT 0,
  total_net NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(period_year, period_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_runs TO authenticated;
GRANT ALL ON public.payroll_runs TO service_role;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage payroll runs" ON public.payroll_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE TRIGGER trg_payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  hours_worked NUMERIC(8,2) DEFAULT 0,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  base_pay NUMERIC(12,2) DEFAULT 0,
  bonuses NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  net_pay NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_items TO authenticated;
GRANT ALL ON public.payroll_items TO service_role;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage payroll items" ON public.payroll_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "Employees see own payslips" ON public.payroll_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.user_id = auth.uid()));
CREATE TRIGGER trg_payroll_items_updated_at BEFORE UPDATE ON public.payroll_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.calc_payroll_item()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN
  NEW.base_pay := COALESCE(NEW.hours_worked,0) * COALESCE(NEW.hourly_rate,0);
  NEW.net_pay := NEW.base_pay + COALESCE(NEW.bonuses,0) - COALESCE(NEW.deductions,0);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_calc_payroll_item BEFORE INSERT OR UPDATE ON public.payroll_items
  FOR EACH ROW EXECUTE FUNCTION public.calc_payroll_item();

CREATE OR REPLACE FUNCTION public.recalc_payroll_run_totals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path='public' AS $$
DECLARE _run UUID; _gross NUMERIC(14,2); _net NUMERIC(14,2);
BEGIN
  _run := COALESCE(NEW.payroll_run_id, OLD.payroll_run_id);
  SELECT COALESCE(SUM(base_pay + bonuses),0), COALESCE(SUM(net_pay),0)
    INTO _gross, _net FROM public.payroll_items WHERE payroll_run_id = _run;
  UPDATE public.payroll_runs SET total_gross = _gross, total_net = _net WHERE id = _run;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_recalc_payroll_totals AFTER INSERT OR UPDATE OR DELETE ON public.payroll_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_payroll_run_totals();

CREATE INDEX idx_time_entries_employee ON public.time_entries(employee_id);
CREATE INDEX idx_time_entries_date ON public.time_entries(entry_date);
CREATE INDEX idx_time_entries_wo ON public.time_entries(work_order_id);
CREATE INDEX idx_leave_employee ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_dates ON public.leave_requests(start_date, end_date);
CREATE INDEX idx_emp_certs_employee ON public.employee_certifications(employee_id);
CREATE INDEX idx_payroll_items_run ON public.payroll_items(payroll_run_id);
