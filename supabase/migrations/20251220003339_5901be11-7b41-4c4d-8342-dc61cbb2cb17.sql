-- Add gallery_images column to projects table for multiple images
ALTER TABLE public.projects 
ADD COLUMN gallery_images text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.projects.gallery_images IS 'Array of additional image URLs for the project gallery';