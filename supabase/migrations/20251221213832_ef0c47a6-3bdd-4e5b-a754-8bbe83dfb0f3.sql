-- Add individual count fields for engineers, technicians, and helpers
ALTER TABLE hero_content 
ADD COLUMN engineers_count integer DEFAULT 3,
ADD COLUMN technicians_count integer DEFAULT 2,
ADD COLUMN helpers_count integer DEFAULT 5;

-- Update employees_count to be the sum of the three (for existing rows)
UPDATE hero_content 
SET employees_count = COALESCE(engineers_count, 0) + COALESCE(technicians_count, 0) + COALESCE(helpers_count, 0);

-- Create a trigger to automatically calculate employees_count
CREATE OR REPLACE FUNCTION public.calculate_employees_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.employees_count = COALESCE(NEW.engineers_count, 0) + COALESCE(NEW.technicians_count, 0) + COALESCE(NEW.helpers_count, 0);
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_calculate_employees_count
BEFORE INSERT OR UPDATE ON hero_content
FOR EACH ROW
EXECUTE FUNCTION public.calculate_employees_count();