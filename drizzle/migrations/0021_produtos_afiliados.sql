-- Catálogo de produtos afiliados do Mercado Livre (26/11/2026, pedido do Pedro).
-- Uma lista única, editada em /admin/afiliados, alimenta o cartão de produto
-- dentro dos artigos e a página /produtos-recomendados.
CREATE TABLE IF NOT EXISTS public.produtos_afiliados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nome text NOT NULL CHECK (length(btrim(nome)) > 0),
  motivo text NOT NULL DEFAULT '',
  categoria text NOT NULL CHECK (length(btrim(categoria)) > 0),
  perfil text NOT NULL DEFAULT 'ambos' CHECK (perfil IN ('investidor', 'moradia', 'ambos')),
  -- Só https e só os domínios do Mercado Livre (meli.la é o encurtador da Central de Afiliados).
  link_afiliado text NOT NULL CHECK (link_afiliado ~ '^https://(meli\.la|(www\.)?mercadolivre\.com(\.br)?)/'),
  imagem_url text,
  imagem_alt text,
  projeto_slug text,
  ativo boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_produtos_afiliados_ativo_ordem ON public.produtos_afiliados (ativo, sort_order);
ALTER TABLE public.produtos_afiliados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read produtos afiliados ativos" ON public.produtos_afiliados;
CREATE POLICY "public read produtos afiliados ativos" ON public.produtos_afiliados FOR SELECT USING (ativo = true);
DROP POLICY IF EXISTS "admin all produtos afiliados" ON public.produtos_afiliados;
CREATE POLICY "admin all produtos afiliados" ON public.produtos_afiliados FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS set_produtos_afiliados_updated_at ON public.produtos_afiliados;
CREATE TRIGGER set_produtos_afiliados_updated_at BEFORE UPDATE ON public.produtos_afiliados FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
REVOKE ALL ON public.produtos_afiliados FROM anon, authenticated;
GRANT SELECT ON public.produtos_afiliados TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos_afiliados TO authenticated;
GRANT ALL ON public.produtos_afiliados TO service_role;
