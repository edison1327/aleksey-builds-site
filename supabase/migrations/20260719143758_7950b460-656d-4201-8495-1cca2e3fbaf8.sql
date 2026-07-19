CREATE POLICY "Clients read own files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Clients upload own files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Clients update own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Clients delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins read all client files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins delete all client files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND public.has_role(auth.uid(), 'admin')
  );