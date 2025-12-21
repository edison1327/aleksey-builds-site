-- Add overlay color field to hero_content
ALTER TABLE public.hero_content 
ADD COLUMN overlay_color text DEFAULT '#1a1a2e';