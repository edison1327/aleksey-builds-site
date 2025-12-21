-- Create storage bucket for hero videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-videos', 'hero-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view videos
CREATE POLICY "Anyone can view hero videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-videos');

-- Allow admins to upload videos
CREATE POLICY "Admins can upload hero videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hero-videos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update videos
CREATE POLICY "Admins can update hero videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hero-videos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete videos
CREATE POLICY "Admins can delete hero videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'hero-videos' 
  AND public.has_role(auth.uid(), 'admin')
);