
-- 1. Referral codes: one per user
CREATE TABLE public.referral_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own referral code"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all referral codes"
  ON public.referral_codes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Referrals log
CREATE TYPE public.referral_status AS ENUM ('pending', 'registered', 'converted', 'rewarded');

CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_used TEXT NOT NULL,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT,
  status public.referral_status NOT NULL DEFAULT 'pending',
  reward_note TEXT,
  contact_message_id UUID REFERENCES public.contact_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referrals_code ON public.referrals(code_used);
CREATE INDEX idx_referrals_status ON public.referrals(status);

GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT INSERT ON public.referrals TO anon;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Anyone (even anon) can create a referral entry via the public site (?ref=CODE)
CREATE POLICY "Public can register a referral"
  ON public.referrals FOR INSERT
  WITH CHECK (true);

-- Referrer can view their own referrals
CREATE POLICY "Referrer reads own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- Admins can manage all
CREATE POLICY "Admins read all referrals"
  ON public.referrals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update referrals"
  ON public.referrals FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete referrals"
  ON public.referrals FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Link contact messages to their referral code
ALTER TABLE public.contact_messages ADD COLUMN referral_code TEXT;
CREATE INDEX idx_contact_messages_referral ON public.contact_messages(referral_code) WHERE referral_code IS NOT NULL;

-- 4. Helper function: generate a random 8-char code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$;
