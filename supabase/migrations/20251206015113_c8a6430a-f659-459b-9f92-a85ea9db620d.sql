-- Add price column to machinery table
ALTER TABLE public.machinery ADD COLUMN price text;

-- Add price column to vehicles table
ALTER TABLE public.vehicles ADD COLUMN price text;