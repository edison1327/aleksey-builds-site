
-- Documents center table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  doc_type TEXT NOT NULL DEFAULT 'other', -- contract, invoice, certification, manual, permit, insurance, photo, other
  entity_type TEXT, -- client, supplier, employee, project, work_order, machinery
  entity_id UUID,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  checksum TEXT,
  version INT NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  is_current BOOLEAN NOT NULL DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  issued_at DATE,
  expires_at DATE,
  visibility TEXT NOT NULL DEFAULT 'internal', -- internal, client, supplier, public
  client_email TEXT, -- when visibility='client', match by email
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_entity ON public.documents(entity_type, entity_id);
CREATE INDEX idx_documents_type ON public.documents(doc_type);
CREATE INDEX idx_documents_expires ON public.documents(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_documents_client ON public.documents(client_email) WHERE client_email IS NOT NULL;
CREATE INDEX idx_documents_current ON public.documents(parent_id, is_current);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Staff (admin/editor/viewer) can read all
CREATE POLICY "Staff read all documents"
ON public.documents FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'editor') OR
  public.has_role(auth.uid(), 'viewer') OR
  (visibility = 'client' AND client_email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
  visibility = 'public'
);

CREATE POLICY "Admin/editor manage documents"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admin/editor update documents"
ON public.documents FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admin delete documents"
ON public.documents FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_documents_updated
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- When new version inserted (parent_id set), mark siblings as not current
CREATE OR REPLACE FUNCTION public.documents_version_flip()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL AND NEW.is_current = true THEN
    UPDATE public.documents SET is_current = false
      WHERE (id = NEW.parent_id OR parent_id = NEW.parent_id) AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_documents_version
AFTER INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.documents_version_flip();

-- Expiration notification helper (called by cron scanner)
CREATE OR REPLACE FUNCTION public.get_expiring_documents(_days INT DEFAULT 30)
RETURNS TABLE(id UUID, title TEXT, doc_type TEXT, expires_at DATE, days_left INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, title, doc_type, expires_at,
         (expires_at - CURRENT_DATE)::INT AS days_left
  FROM public.documents
  WHERE is_current = true
    AND expires_at IS NOT NULL
    AND expires_at <= CURRENT_DATE + _days
  ORDER BY expires_at ASC;
$$;

-- Storage RLS for 'documents' bucket
CREATE POLICY "Staff read documents storage"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'editor') OR
    public.has_role(auth.uid(), 'viewer')
  )
);

CREATE POLICY "Admin/editor upload documents storage"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')
  )
);

CREATE POLICY "Admin delete documents storage"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin')
);
