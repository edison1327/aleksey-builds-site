-- 1) Bind admin-uploaded client documents to a real user and matching path
CREATE OR REPLACE FUNCTION public.auth_user_exists(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id)
$$;

REVOKE ALL ON FUNCTION public.auth_user_exists(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_exists(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins insert client documents" ON public.client_documents;
CREATE POLICY "Admins insert client documents"
ON public.client_documents
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND public.auth_user_exists(user_id)
  AND split_part(file_path, '/', 1) = user_id::text
);

DROP POLICY IF EXISTS "Admins update client documents" ON public.client_documents;
CREATE POLICY "Admins update client documents"
ON public.client_documents
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND public.auth_user_exists(user_id)
  AND split_part(file_path, '/', 1) = user_id::text
);

-- 2) Restrict public resume uploads
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
CREATE POLICY "Public can upload valid resumes"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND array_length(storage.foldername(name), 1) IS NULL
  AND lower(storage.extension(name)) IN ('pdf', 'doc', 'docx')
);

-- 3) Remove internal gmail address from publicly readable contact info
UPDATE public.contact_info
SET email = 'edison@aleksey.pe'
WHERE email ILIKE '%admin@gmail.com%';