-- Add resume_url column to job_applications
ALTER TABLE public.job_applications 
ADD COLUMN resume_url TEXT;

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- Storage policies for resumes bucket
CREATE POLICY "Anyone can upload resumes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admins can view resumes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resumes' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete resumes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resumes' AND has_role(auth.uid(), 'admin'::app_role));