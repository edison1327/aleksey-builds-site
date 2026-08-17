ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS site_url TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT;

UPDATE site_settings SET site_url = 'https://aleksey.com.pe' WHERE site_url IS NULL;