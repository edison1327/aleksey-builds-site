-- Add overlay opacity field to hero_content
ALTER TABLE public.hero_content 
ADD COLUMN overlay_opacity numeric DEFAULT 0.7;