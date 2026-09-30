ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_range text;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_budget_range_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_budget_range_check CHECK (budget_range IS NULL OR budget_range IN ('ate_40k','40k_60k','60k_80k','acima_80k'));