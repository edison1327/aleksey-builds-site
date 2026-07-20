
-- loyalty_points ledger
CREATE TABLE public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_amount NUMERIC(12,2),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.equipment_bookings(id) ON DELETE SET NULL,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_loyalty_points_email ON public.loyalty_points(customer_email);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage points" ON public.loyalty_points FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users see own points" ON public.loyalty_points FOR SELECT TO authenticated
  USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- loyalty_rewards catalog
CREATE TABLE public.loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  stock INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_rewards TO authenticated;
GRANT SELECT ON public.loyalty_rewards TO anon;
GRANT ALL ON public.loyalty_rewards TO service_role;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active rewards" ON public.loyalty_rewards FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage rewards" ON public.loyalty_rewards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_loyalty_rewards_updated BEFORE UPDATE ON public.loyalty_rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- loyalty_redemptions
CREATE TABLE public.loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id) ON DELETE RESTRICT,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','delivered','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_loyalty_redemptions_email ON public.loyalty_redemptions(customer_email);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_redemptions TO authenticated;
GRANT ALL ON public.loyalty_redemptions TO service_role;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage redemptions" ON public.loyalty_redemptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users see own redemptions" ON public.loyalty_redemptions FOR SELECT TO authenticated
  USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE POLICY "Users create own redemptions" ON public.loyalty_redemptions FOR INSERT TO authenticated
  WITH CHECK (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE TRIGGER trg_loyalty_redemptions_updated BEFORE UPDATE ON public.loyalty_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- balance function
CREATE OR REPLACE FUNCTION public.get_loyalty_balance(_email TEXT)
RETURNS TABLE(earned INTEGER, spent INTEGER, available INTEGER, tier TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH e AS (SELECT COALESCE(SUM(points),0)::int AS earned FROM public.loyalty_points WHERE customer_email = _email),
       s AS (SELECT COALESCE(SUM(points_spent),0)::int AS spent FROM public.loyalty_redemptions
             WHERE customer_email = _email AND status IN ('approved','delivered'))
  SELECT e.earned, s.spent, GREATEST(e.earned - s.spent, 0),
    CASE
      WHEN e.earned >= 10000 THEN 'Platino'
      WHEN e.earned >= 5000 THEN 'Oro'
      WHEN e.earned >= 1500 THEN 'Plata'
      ELSE 'Bronce'
    END
  FROM e, s;
$$;

-- auto-award on invoice paid
CREATE OR REPLACE FUNCTION public.award_loyalty_on_invoice_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') AND NEW.customer_email IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.loyalty_points WHERE invoice_id = NEW.id) THEN
      INSERT INTO public.loyalty_points (customer_email, points, reason, reference_amount, invoice_id)
      VALUES (NEW.customer_email, GREATEST(FLOOR(COALESCE(NEW.total,0))::int, 0),
              'Factura pagada '||NEW.code, NEW.total, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_loyalty_invoice_paid AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_on_invoice_paid();

-- auto-award on referral converted
CREATE OR REPLACE FUNCTION public.award_loyalty_on_referral()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email TEXT;
BEGIN
  IF NEW.status IN ('converted','rewarded') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT email INTO _email FROM auth.users WHERE id = NEW.referrer_user_id;
    IF _email IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.loyalty_points WHERE referral_id = NEW.id) THEN
      INSERT INTO public.loyalty_points (customer_email, points, reason, referral_id)
      VALUES (_email, 500, 'Referido convertido', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_loyalty_referral AFTER UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_on_referral();
