ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

CREATE TABLE public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  description text,
  uploaded_by_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_documents TO authenticated;
GRANT ALL ON public.client_documents TO service_role;

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own documents"
  ON public.client_documents FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all client documents"
  ON public.client_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete any client document"
  ON public.client_documents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_client_documents_updated
  BEFORE UPDATE ON public.client_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_client_documents_user ON public.client_documents(user_id);

CREATE POLICY "Clients read own contact messages"
  ON public.contact_messages FOR SELECT TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

CREATE POLICY "Clients read own equipment bookings"
  ON public.equipment_bookings FOR SELECT TO authenticated
  USING (customer_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Clients read own job applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (email = (auth.jwt() ->> 'email'));