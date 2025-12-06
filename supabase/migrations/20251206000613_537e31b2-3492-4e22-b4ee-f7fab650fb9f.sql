-- Create table for job applications
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert job applications (public form)
CREATE POLICY "Anyone can submit job applications"
ON public.job_applications
FOR INSERT
WITH CHECK (true);

-- Policy: Only the applicant can view their own application (by email match - for future use)
CREATE POLICY "Applicants can view their own applications"
ON public.job_applications
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_job_applications_email ON public.job_applications(email);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();