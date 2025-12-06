
-- Create storage bucket for site images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-images', 
  'site-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Policy: Anyone can view images (public bucket)
CREATE POLICY "Anyone can view site images"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-images');

-- Policy: Only admins can upload images
CREATE POLICY "Admins can upload site images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Only admins can update images
CREATE POLICY "Admins can update site images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Only admins can delete images
CREATE POLICY "Admins can delete site images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site-images' 
  AND public.has_role(auth.uid(), 'admin')
);
