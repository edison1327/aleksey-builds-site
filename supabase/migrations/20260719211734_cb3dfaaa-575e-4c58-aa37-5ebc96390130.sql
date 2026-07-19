
ALTER TABLE public.machinery
  ADD COLUMN IF NOT EXISTS is_marketplace boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_rental_days integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS rental_terms text,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS is_marketplace boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_rental_days integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS rental_terms text,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Public RPC to check availability of a piece of equipment for a date range
CREATE OR REPLACE FUNCTION public.check_equipment_availability(
  _equipment_type text,
  _equipment_id uuid,
  _start_date date,
  _end_date date
) RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.equipment_bookings
    WHERE equipment_type = _equipment_type
      AND equipment_id = _equipment_id
      AND status IN ('pending','confirmed','in_progress')
      AND daterange(start_date, end_date, '[]') && daterange(_start_date, _end_date, '[]')
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_equipment_availability(text,uuid,date,date) TO anon, authenticated;

-- Marketplace listing view (public, safe subset)
CREATE OR REPLACE VIEW public.marketplace_listings AS
  SELECT id, 'machinery'::text AS equipment_type, name, name_en, description, description_en,
         category, brand, model, image_url, price, daily_rate, min_rental_days,
         deposit_amount, rental_terms, is_featured, location_id, branch_id, sort_order
  FROM public.machinery
  WHERE is_active = true AND is_available = true AND is_marketplace = true
  UNION ALL
  SELECT id, 'vehicle'::text, name, name_en, description, description_en,
         category, brand, model, image_url, price, daily_rate, min_rental_days,
         deposit_amount, rental_terms, is_featured, location_id, branch_id, sort_order
  FROM public.vehicles
  WHERE is_active = true AND is_available = true AND is_marketplace = true;

GRANT SELECT ON public.marketplace_listings TO anon, authenticated;
