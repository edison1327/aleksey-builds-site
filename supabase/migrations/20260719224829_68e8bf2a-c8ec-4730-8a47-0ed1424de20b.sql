
-- Extend rfqs with auction fields
ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS auction_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auction_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auction_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auction_min_decrement NUMERIC(12,2) NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS auction_starting_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS auction_closed_at TIMESTAMPTZ;

-- Bids table
CREATE TABLE IF NOT EXISTS public.rfq_auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  invitation_id UUID NOT NULL REFERENCES public.rfq_invitations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  delivery_days INTEGER,
  notes TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_rfq ON public.rfq_auction_bids(rfq_id, amount);
CREATE INDEX IF NOT EXISTS idx_auction_bids_supplier ON public.rfq_auction_bids(supplier_id);

GRANT SELECT ON public.rfq_auction_bids TO authenticated;
GRANT ALL ON public.rfq_auction_bids TO service_role;

ALTER TABLE public.rfq_auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/editor read auction bids"
  ON public.rfq_auction_bids FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'viewer'));

-- No direct INSERT policy: bids are only inserted via SECURITY DEFINER RPC below.

ALTER PUBLICATION supabase_realtime ADD TABLE public.rfq_auction_bids;
ALTER TABLE public.rfq_auction_bids REPLICA IDENTITY FULL;

-- Place bid via token
CREATE OR REPLACE FUNCTION public.place_auction_bid(
  _token TEXT,
  _amount NUMERIC,
  _delivery_days INTEGER,
  _notes TEXT,
  _ip TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv RECORD;
  _rfq RECORD;
  _best NUMERIC;
  _bid_id UUID;
BEGIN
  SELECT inv.id AS invitation_id, inv.rfq_id, inv.supplier_id
    INTO _inv
    FROM public.rfq_invitations inv
    WHERE inv.access_token = _token;
  IF _inv IS NULL THEN RAISE EXCEPTION 'invalid_token'; END IF;

  SELECT * INTO _rfq FROM public.rfqs WHERE id = _inv.rfq_id;
  IF _rfq IS NULL THEN RAISE EXCEPTION 'rfq_not_found'; END IF;
  IF NOT _rfq.auction_enabled THEN RAISE EXCEPTION 'auction_disabled'; END IF;
  IF _rfq.auction_start_at IS NOT NULL AND now() < _rfq.auction_start_at THEN
    RAISE EXCEPTION 'auction_not_started';
  END IF;
  IF _rfq.auction_end_at IS NOT NULL AND now() > _rfq.auction_end_at THEN
    RAISE EXCEPTION 'auction_ended';
  END IF;
  IF _rfq.auction_closed_at IS NOT NULL THEN
    RAISE EXCEPTION 'auction_closed';
  END IF;

  SELECT MIN(amount) INTO _best FROM public.rfq_auction_bids WHERE rfq_id = _inv.rfq_id;

  IF _best IS NULL THEN
    IF _rfq.auction_starting_price IS NOT NULL AND _amount > _rfq.auction_starting_price THEN
      RAISE EXCEPTION 'bid_above_starting_price';
    END IF;
  ELSE
    IF _amount > _best - COALESCE(_rfq.auction_min_decrement, 0) THEN
      RAISE EXCEPTION 'bid_must_improve_by_min_decrement';
    END IF;
  END IF;

  INSERT INTO public.rfq_auction_bids (rfq_id, invitation_id, supplier_id, amount, delivery_days, notes, ip)
  VALUES (_inv.rfq_id, _inv.invitation_id, _inv.supplier_id, _amount, _delivery_days, _notes, _ip)
  RETURNING id INTO _bid_id;

  -- Auto-extend last 2 minutes: if bid arrives within 2 min of end, extend by 2 min
  IF _rfq.auction_end_at IS NOT NULL AND _rfq.auction_end_at - now() < interval '2 minutes' THEN
    UPDATE public.rfqs SET auction_end_at = now() + interval '2 minutes' WHERE id = _inv.rfq_id;
  END IF;

  RETURN _bid_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.place_auction_bid(TEXT, NUMERIC, INTEGER, TEXT, TEXT) TO anon, authenticated;

-- Read state by token (anonymized ranking)
CREATE OR REPLACE FUNCTION public.get_auction_state(_token TEXT)
RETURNS TABLE(
  rfq_id UUID, code TEXT, title TEXT, currency TEXT,
  auction_enabled BOOLEAN, auction_start_at TIMESTAMPTZ, auction_end_at TIMESTAMPTZ,
  auction_closed_at TIMESTAMPTZ, auction_min_decrement NUMERIC, auction_starting_price NUMERIC,
  my_best NUMERIC, best_overall NUMERIC, my_rank BIGINT, total_bidders BIGINT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _inv RECORD;
BEGIN
  SELECT inv.id AS invitation_id, inv.rfq_id, inv.supplier_id
    INTO _inv FROM public.rfq_invitations inv WHERE inv.access_token = _token;
  IF _inv IS NULL THEN RAISE EXCEPTION 'invalid_token'; END IF;

  RETURN QUERY
  WITH bests AS (
    SELECT supplier_id, MIN(amount) AS best_amount
    FROM public.rfq_auction_bids WHERE rfq_id = _inv.rfq_id GROUP BY supplier_id
  ),
  ranked AS (
    SELECT supplier_id, best_amount,
           rank() OVER (ORDER BY best_amount ASC) AS r
    FROM bests
  )
  SELECT r.id, r.code, r.title, r.currency,
         r.auction_enabled, r.auction_start_at, r.auction_end_at,
         r.auction_closed_at, r.auction_min_decrement, r.auction_starting_price,
         (SELECT best_amount FROM bests WHERE supplier_id = _inv.supplier_id),
         (SELECT MIN(best_amount) FROM bests),
         (SELECT r2.r FROM ranked r2 WHERE r2.supplier_id = _inv.supplier_id),
         (SELECT count(*) FROM bests)
  FROM public.rfqs r WHERE r.id = _inv.rfq_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_auction_state(TEXT) TO anon, authenticated;

-- Close expired auctions (called by cron / manually)
CREATE OR REPLACE FUNCTION public.close_expired_auctions()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row RECORD; _cnt INT := 0; _winner UUID; _winning_amount NUMERIC;
BEGIN
  FOR _row IN
    SELECT id, code, title FROM public.rfqs
    WHERE auction_enabled = true
      AND auction_closed_at IS NULL
      AND auction_end_at IS NOT NULL
      AND auction_end_at < now()
  LOOP
    SELECT supplier_id, MIN(amount)
      INTO _winner, _winning_amount
      FROM public.rfq_auction_bids
      WHERE rfq_id = _row.id
      GROUP BY supplier_id
      ORDER BY MIN(amount) ASC LIMIT 1;

    UPDATE public.rfqs SET auction_closed_at = now() WHERE id = _row.id;

    IF _winner IS NOT NULL THEN
      PERFORM public.notify_admins(
        'auction_closed',
        'Subasta cerrada: ' || _row.code,
        'Ganador definido con oferta ' || _winning_amount::text,
        '/admin#rfqs',
        jsonb_build_object('rfq_id', _row.id, 'winner_supplier_id', _winner, 'amount', _winning_amount)
      );
    ELSE
      PERFORM public.notify_admins(
        'auction_closed_no_bids',
        'Subasta cerrada sin pujas: ' || _row.code,
        _row.title,
        '/admin#rfqs',
        jsonb_build_object('rfq_id', _row.id)
      );
    END IF;
    _cnt := _cnt + 1;
  END LOOP;
  RETURN _cnt;
END; $$;
