
-- Badges catalog
CREATE TABLE public.supplier_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'award',
  color TEXT DEFAULT '#f59e0b',
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  points INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_badges TO authenticated;
GRANT ALL ON public.supplier_badges TO service_role;
ALTER TABLE public.supplier_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage badges" ON public.supplier_badges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_supplier_badges_updated BEFORE UPDATE ON public.supplier_badges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Awards
CREATE TABLE public.supplier_badge_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.supplier_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, badge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_badge_awards TO authenticated;
GRANT ALL ON public.supplier_badge_awards TO service_role;
ALTER TABLE public.supplier_badge_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage awards" ON public.supplier_badge_awards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_sba_supplier ON public.supplier_badge_awards(supplier_id);
CREATE INDEX idx_sba_badge ON public.supplier_badge_awards(badge_id);

-- Seed default badges
INSERT INTO public.supplier_badges (code, name, description, icon, color, criteria, points) VALUES
  ('top_rated', 'Top Rated', 'Rating promedio ≥ 4.5', 'star', '#f59e0b', '{"min_rating":4.5,"min_evals":3}'::jsonb, 30),
  ('reliable', 'Confiable', '≥ 5 evaluaciones registradas', 'shield-check', '#10b981', '{"min_evals":5}'::jsonb, 20),
  ('veteran', 'Veterano', 'Más de 1 año como proveedor activo', 'medal', '#8b5cf6', '{"min_days":365}'::jsonb, 15),
  ('repeat_business', 'Recontratado', '≥ 80% de clientes lo recontratarían', 'repeat', '#3b82f6', '{"min_rehire_pct":80,"min_evals":3}'::jsonb, 25),
  ('fast_responder', 'Respuesta Rápida', 'Responde RFQs dentro de 48 h', 'zap', '#ef4444', '{"max_response_hours":48,"min_responses":3}'::jsonb, 20),
  ('certified', 'Certificado', 'Al menos 1 certificación vigente', 'badge-check', '#06b6d4', '{"needs_active_cert":true}'::jsonb, 10)
ON CONFLICT (code) DO NOTHING;

-- Gamification summary
CREATE OR REPLACE FUNCTION public.get_supplier_gamification(_supplier_id UUID DEFAULT NULL)
RETURNS TABLE (
  supplier_id UUID,
  supplier_name TEXT,
  category TEXT,
  rating NUMERIC,
  evaluations_count BIGINT,
  points INT,
  badges_count BIGINT,
  badge_codes TEXT[],
  tier TEXT,
  rank BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH awards AS (
    SELECT a.supplier_id,
           COALESCE(SUM(b.points),0)::int AS points,
           count(*)::bigint AS badges_count,
           array_agg(b.code ORDER BY b.code) AS badge_codes
    FROM public.supplier_badge_awards a
    JOIN public.supplier_badges b ON b.id = a.badge_id
    GROUP BY a.supplier_id
  ),
  evs AS (
    SELECT supplier_id, count(*)::bigint AS cnt FROM public.supplier_evaluations GROUP BY supplier_id
  ),
  base AS (
    SELECT s.id, s.name, s.category, COALESCE(s.rating,0) AS rating,
           COALESCE(e.cnt,0) AS evaluations_count,
           COALESCE(a.points,0) AS points,
           COALESCE(a.badges_count,0) AS badges_count,
           COALESCE(a.badge_codes, ARRAY[]::text[]) AS badge_codes
    FROM public.suppliers s
    LEFT JOIN awards a ON a.supplier_id = s.id
    LEFT JOIN evs e ON e.supplier_id = s.id
    WHERE s.status = 'active'
      AND (_supplier_id IS NULL OR s.id = _supplier_id)
  )
  SELECT id, name, category, rating, evaluations_count, points, badges_count, badge_codes,
    CASE
      WHEN points >= 80 THEN 'Platino'
      WHEN points >= 50 THEN 'Oro'
      WHEN points >= 25 THEN 'Plata'
      ELSE 'Bronce'
    END AS tier,
    rank() OVER (ORDER BY points DESC, rating DESC) AS rank
  FROM base
  ORDER BY points DESC, rating DESC;
$$;

-- Auto-award engine
CREATE OR REPLACE FUNCTION public.award_supplier_badges()
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _awarded INT := 0; _s RECORD; _b RECORD; _match BOOLEAN;
  _evals BIGINT; _rehire NUMERIC; _days INT; _has_cert BOOLEAN;
BEGIN
  FOR _s IN SELECT * FROM public.suppliers WHERE status='active' LOOP
    SELECT count(*), COALESCE(AVG(CASE WHEN would_rehire THEN 100 ELSE 0 END),0)
      INTO _evals, _rehire
      FROM public.supplier_evaluations WHERE supplier_id = _s.id;
    _days := GREATEST(0, (CURRENT_DATE - _s.created_at::date));
    SELECT EXISTS(
      SELECT 1 FROM public.supplier_certifications
      WHERE supplier_id=_s.id AND (expires_at IS NULL OR expires_at > CURRENT_DATE)
    ) INTO _has_cert;

    FOR _b IN SELECT * FROM public.supplier_badges WHERE is_active = true LOOP
      _match := true;
      IF (_b.criteria ? 'min_rating') AND COALESCE(_s.rating,0) < (_b.criteria->>'min_rating')::numeric THEN _match := false; END IF;
      IF (_b.criteria ? 'min_evals') AND _evals < (_b.criteria->>'min_evals')::bigint THEN _match := false; END IF;
      IF (_b.criteria ? 'min_rehire_pct') AND _rehire < (_b.criteria->>'min_rehire_pct')::numeric THEN _match := false; END IF;
      IF (_b.criteria ? 'min_days') AND _days < (_b.criteria->>'min_days')::int THEN _match := false; END IF;
      IF (_b.criteria ? 'needs_active_cert') AND (_b.criteria->>'needs_active_cert')::boolean AND NOT _has_cert THEN _match := false; END IF;

      IF _match THEN
        INSERT INTO public.supplier_badge_awards (supplier_id, badge_id, notes)
        VALUES (_s.id, _b.id, 'Auto-otorgada')
        ON CONFLICT (supplier_id, badge_id) DO NOTHING;
        IF FOUND THEN _awarded := _awarded + 1; END IF;
      END IF;
    END LOOP;
  END LOOP;
  RETURN _awarded;
END; $$;
