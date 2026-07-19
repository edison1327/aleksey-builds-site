
-- Allow admins to upload documents on behalf of any client
CREATE POLICY "Admins upload to any client folder"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'client-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert client documents"
  ON public.client_documents FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update client documents"
  ON public.client_documents FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
