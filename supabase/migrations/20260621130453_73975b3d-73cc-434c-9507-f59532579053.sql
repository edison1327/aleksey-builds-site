
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client text,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS duration_en text,
  ADD COLUMN IF NOT EXISTS challenge text,
  ADD COLUMN IF NOT EXISTS challenge_en text,
  ADD COLUMN IF NOT EXISTS solution text,
  ADD COLUMN IF NOT EXISTS solution_en text,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS outcome_en text,
  ADD COLUMN IF NOT EXISTS services_used text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_case_study boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.projects.metrics IS 'Array of {label, value, unit?} objects shown as KPI cards on the case study page.';
COMMENT ON COLUMN public.projects.services_used IS 'List of service names/tags used in the project.';
COMMENT ON COLUMN public.projects.is_case_study IS 'When true, the project shows the long-form case study layout.';
