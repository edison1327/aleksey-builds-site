
-- Signature fields on work_orders
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS client_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS client_signature_name TEXT,
  ADD COLUMN IF NOT EXISTS client_signature_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_lat NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS completion_lng NUMERIC(10,7);

-- Photos table (before/after/other) linked to a WO
CREATE TABLE IF NOT EXISTS public.work_order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'other' CHECK (kind IN ('before','after','other','signature')),
  storage_path TEXT NOT NULL,
  caption TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_order_photos TO authenticated;
GRANT ALL ON public.work_order_photos TO service_role;

ALTER TABLE public.work_order_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage wo photos"
  ON public.work_order_photos FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Assigned operator can view own WO photos"
  ON public.work_order_photos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.id = work_order_id AND wo.assigned_to = auth.uid()));

CREATE POLICY "Assigned operator can insert own WO photos"
  ON public.work_order_photos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.work_orders wo WHERE wo.id = work_order_id AND wo.assigned_to = auth.uid()));

CREATE POLICY "Assigned operator can delete own photos"
  ON public.work_order_photos FOR DELETE
  USING (uploaded_by = auth.uid());

CREATE INDEX IF NOT EXISTS work_order_photos_wo_idx ON public.work_order_photos(work_order_id);

-- Storage policies for the private 'work-order-media' bucket (create bucket via tool)
CREATE POLICY "wo-media admin all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'work-order-media' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'work-order-media' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "wo-media operator upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'work-order-media' AND owner = auth.uid());

CREATE POLICY "wo-media operator read own"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'work-order-media' AND owner = auth.uid());
