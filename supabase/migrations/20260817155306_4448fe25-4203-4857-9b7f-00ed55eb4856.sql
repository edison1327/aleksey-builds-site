-- Add new columns for independent logo management
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS logo_url_dark TEXT,
ADD COLUMN IF NOT EXISTS footer_logo_url TEXT,
ADD COLUMN IF NOT EXISTS footer_logo_url_dark TEXT;

-- Refresh schema cache
COMMENT ON TABLE public.site_settings IS 'Table for global site settings including independent logos for header and footer.';
