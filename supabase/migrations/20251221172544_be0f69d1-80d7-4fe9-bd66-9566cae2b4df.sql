-- Add background_type and image_url columns to hero_content
ALTER TABLE public.hero_content 
ADD COLUMN IF NOT EXISTS background_type TEXT DEFAULT 'video',
ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- Create storage bucket for hero images
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view hero images
CREATE POLICY "Anyone can view hero images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-images');

-- Allow admins to upload hero images
CREATE POLICY "Admins can upload hero images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hero-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update hero images
CREATE POLICY "Admins can update hero images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hero-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete hero images
CREATE POLICY "Admins can delete hero images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'hero-images' 
  AND public.has_role(auth.uid(), 'admin')
);