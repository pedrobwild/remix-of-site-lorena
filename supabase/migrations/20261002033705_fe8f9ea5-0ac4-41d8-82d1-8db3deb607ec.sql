DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects'
      AND column_name = 'area_m2' AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.projects
      ALTER COLUMN area_m2 TYPE numeric(10,2) USING area_m2::numeric(10,2);
  END IF;
END $$;