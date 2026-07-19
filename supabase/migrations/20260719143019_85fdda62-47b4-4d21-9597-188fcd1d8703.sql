
CREATE TABLE public.error_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('info','warning','error','fatal')),
  context JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_log_created_at ON public.error_log (created_at DESC);
CREATE INDEX idx_error_log_resolved ON public.error_log (resolved) WHERE resolved = false;

GRANT INSERT ON public.error_log TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.error_log TO authenticated;
GRANT ALL ON public.error_log TO service_role;

ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log errors"
ON public.error_log FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all errors"
ON public.error_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update errors"
ON public.error_log FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete errors"
ON public.error_log FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
