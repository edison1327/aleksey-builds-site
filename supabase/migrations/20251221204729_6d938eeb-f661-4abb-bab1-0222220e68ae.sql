-- Add new statistics columns to hero_content
ALTER TABLE public.hero_content 
ADD COLUMN IF NOT EXISTS active_projects_count integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS employees_count integer DEFAULT 50;