
CREATE TABLE public.supplier_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  subcontract_id UUID REFERENCES public.subcontracts(id) ON DELETE SET NULL,
  project_name TEXT,
  quality_score INT NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
  punctuality_score INT NOT NULL CHECK (punctuality_score BETWEEN 1 AND 5),
  safety_score INT NOT NULL CHECK (safety_score BETWEEN 1 AND 5),
  communication_score INT NOT NULL CHECK (communication_score BETWEEN 1 AND 5),
  overall_score NUMERIC(3,2) GENERATED ALWAYS AS (
    (quality_score + punctuality_score + safety_score + communication_score)::numeric / 4
  ) STORED,
  would_rehire BOOLEAN NOT NULL DEFAULT true,
  comments TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  evaluated_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_evaluations TO authenticated;
GRANT ALL ON public.supplier_evaluations TO service_role;

ALTER TABLE public.supplier_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view evaluations" ON public.supplier_evaluations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'viewer'));

CREATE POLICY "Admin/editor can insert evaluations" ON public.supplier_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "Admin/editor can update evaluations" ON public.supplier_evaluations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

CREATE POLICY "Admin can delete evaluations" ON public.supplier_evaluations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER update_supplier_evaluations_updated_at
  BEFORE UPDATE ON public.supplier_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-recalculate supplier.rating as average of overall_score
CREATE OR REPLACE FUNCTION public.recalc_supplier_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _sid UUID; _avg NUMERIC;
BEGIN
  _sid := COALESCE(NEW.supplier_id, OLD.supplier_id);
  SELECT AVG(overall_score) INTO _avg FROM public.supplier_evaluations WHERE supplier_id = _sid;
  UPDATE public.suppliers SET rating = ROUND(_avg, 2) WHERE id = _sid;
  RETURN NULL;
END; $$;

CREATE TRIGGER supplier_evaluations_recalc_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.recalc_supplier_rating();

CREATE INDEX idx_supplier_evaluations_supplier ON public.supplier_evaluations(supplier_id);
