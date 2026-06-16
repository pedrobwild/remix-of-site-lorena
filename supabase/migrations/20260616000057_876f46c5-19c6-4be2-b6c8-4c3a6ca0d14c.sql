GRANT DELETE ON public.leads TO authenticated;
CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.is_admin());