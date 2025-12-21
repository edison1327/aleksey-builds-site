-- Add accident_free_hours column to hero_content
ALTER TABLE public.hero_content
ADD COLUMN accident_free_hours integer DEFAULT 10000;