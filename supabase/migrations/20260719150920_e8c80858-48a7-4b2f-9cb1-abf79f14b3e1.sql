
-- Sedes / Multi-location system
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  city TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  hours TEXT,
  lat NUMERIC,
  lng NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are publicly readable when active"
  ON public.locations FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage locations"
  ON public.locations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add location_id to relevant tables (nullable so existing rows work)
ALTER TABLE public.machinery ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.vehicles ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.equipment_bookings ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.contact_messages ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.job_positions ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX idx_machinery_location ON public.machinery(location_id);
CREATE INDEX idx_vehicles_location ON public.vehicles(location_id);
CREATE INDEX idx_bookings_location ON public.equipment_bookings(location_id);
CREATE INDEX idx_messages_location ON public.contact_messages(location_id);

-- Seed primary location
INSERT INTO public.locations (name, slug, city, is_primary, sort_order)
VALUES ('Sede Principal', 'principal', 'Lima', true, 0);
