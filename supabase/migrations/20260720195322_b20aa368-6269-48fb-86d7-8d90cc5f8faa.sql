-- Saved reports (BG)
CREATE TABLE public.saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_reports TO authenticated;
GRANT ALL ON public.saved_reports TO service_role;
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own or shared reports"
  ON public.saved_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_shared = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own reports"
  ON public.saved_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own reports or admin"
  ON public.saved_reports FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own reports or admin"
  ON public.saved_reports FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_saved_reports_updated_at
  BEFORE UPDATE ON public.saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Approval requests (BI)
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_label TEXT,
  amount NUMERIC(14,2),
  currency TEXT DEFAULT 'COP',
  notes TEXT,
  approver_role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  signature_data TEXT,
  delegated_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_requests TO authenticated;
GRANT ALL ON public.approval_requests TO service_role;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approvals visible to admin/requester/delegate"
  ON public.approval_requests FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR requested_by = auth.uid()
    OR delegated_to = auth.uid()
  );
CREATE POLICY "Admin can insert approvals"
  ON public.approval_requests FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR requested_by = auth.uid());
CREATE POLICY "Admin or delegate can update approvals"
  ON public.approval_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR delegated_to = auth.uid());
CREATE POLICY "Admin can delete approvals"
  ON public.approval_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_entity ON public.approval_requests(entity_type, entity_id);