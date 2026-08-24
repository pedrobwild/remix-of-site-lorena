CREATE OR REPLACE FUNCTION public.projects_set_sort_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1 INTO NEW.sort_order FROM public.projects;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_set_sort_order ON public.projects;
CREATE TRIGGER projects_set_sort_order
BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_set_sort_order();