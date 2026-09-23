-- Auditoria de 23/09/2026 — endurecimento de segurança e coerência repo × produção.
--
-- Idempotente: pode rodar mais de uma vez e em banco novo (replay). Objetos
-- que existem só em produção (criados fora do repositório) ficam atrás de
-- guardas `to_regclass`/`to_regprocedure`.
--
-- Verificação depois de aplicar (todas devem voltar como indicado):
--   select to_regprocedure('public.handle_admin_signup()');                         -- null
--   select to_regprocedure('public.analytics_top_paths(timestamptz,integer)');       -- null
--   select has_function_privilege('anon','public.analytics_overview_kpis(timestamptz,timestamptz,text,text,text,text,text,text,text)','EXECUTE'); -- false
--   select public.resolve_404_redirect('/nao-existe');                               -- null
--   select policyname from pg_policies where schemaname='storage' and tablename='objects' and cmd='SELECT'; -- sem leitura pública

-- ---------------------------------------------------------------------------
-- 1) Auto-promoção a admin por e-mail.
--    `handle_admin_signup` colocava em `admin_users` qualquer conta criada com
--    contato@/lorena@lorenaalvesarq.com (domínio do site de origem do remix,
--    de terceiros) ou pedro@bwild.com.br. Em produção o trigger já não está
--    ligado, mas a função sobrou e um replay das migrations o recriaria.
--    Admins passam a ser incluídos só por INSERT explícito.
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_admin_signup();
DELETE FROM public.admin_users
 WHERE lower(email) LIKE '%@lorenaalvesarq.com'
    OR user_id IN (SELECT id FROM auth.users WHERE lower(email) LIKE '%@lorenaalvesarq.com');

-- ---------------------------------------------------------------------------
-- 2) RPCs de analytics v1: SECURITY DEFINER, sem checagem de is_admin() e
--    executáveis pela chave pública — qualquer visitante lia páginas mais
--    vistas, projetos e referenciadores. Nenhum código usa (substituídas
--    pelas _v2). Remoção.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.analytics_top_paths(timestamptz, integer);
DROP FUNCTION IF EXISTS public.analytics_top_projects(timestamptz, integer);
DROP FUNCTION IF EXISTS public.analytics_top_referrers(timestamptz, integer);

-- ---------------------------------------------------------------------------
-- 3) Grants coerentes.
--    a) `is_admin()` é chamada dentro de policies avaliadas também para anon
--       (projects, faq_items, assistant_kb…). A migration 20260524195715 a
--       revogava de anon, o que quebraria toda leitura pública num replay.
--       Produção já tem o grant; aqui ele passa a constar do repositório.
--    b) RPCs de analytics do painel: só `authenticated` (cada uma já checa
--       is_admin() por dentro). Nunca anon.
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

DO $$
DECLARE
  f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.analytics_overview_kpis(timestamptz,timestamptz,text,text,text,text,text,text,text)',
    'public.analytics_top_paths_v2(timestamptz,timestamptz,integer,text,text,text,text,text,text,text)',
    'public.analytics_top_projects_v2(timestamptz,timestamptz,integer,text,text,text,text,text,text,text)',
    'public.analytics_hours_dow(timestamptz,timestamptz,text,text,text,text,text,text,text)',
    'public.analytics_timeseries(timestamptz,timestamptz,text)',
    'public.analytics_breakdown(timestamptz,timestamptz,text,integer)',
    'public.analytics_funnel(timestamptz,timestamptz,text[])',
    'public.analytics_retention(timestamptz,integer)',
    'public.analytics_realtime()'
  ] LOOP
    IF to_regprocedure(f) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Redirecionamentos de 404 para visitantes.
--    `seo_404_log` só tem leitura para admin, então a busca do cliente com a
--    chave anon voltava vazia: os redirects cadastrados em /admin/seo/404 só
--    funcionavam para quem estava logado como admin. Esta função devolve
--    apenas o destino (nunca a tabela) e só aceita caminhos relativos.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_404_redirect(p_path text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT redirect_to
    FROM public.seo_404_log
   WHERE path = left(coalesce(p_path, ''), 500)
     AND status = 'redirect'
     AND left(redirect_to, 1) = '/'
     AND left(redirect_to, 2) NOT IN ('//', '/\')
   LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.resolve_404_redirect(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_404_redirect(text) TO anon, authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seo_404_log_redirect_relative') THEN
    ALTER TABLE public.seo_404_log
      ADD CONSTRAINT seo_404_log_redirect_relative
      CHECK (redirect_to IS NULL OR (left(redirect_to, 1) = '/' AND left(redirect_to, 2) NOT IN ('//', '/\')))
      NOT VALID;
  END IF;
END $$;

-- log_404: (a) `coalesce(p_referrer,'')` fazia o ON CONFLICT apagar o
-- referrer conhecido a cada hit sem referrer; (b) caminhos novos ilimitados
-- permitiam encher a tabela com URLs aleatórias — teto de 300 caminhos novos
-- por hora (hits em caminhos já conhecidos continuam contando).
CREATE OR REPLACE FUNCTION public.log_404(p_path text, p_referrer text DEFAULT NULL, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path text;
  v_reason text;
  v_referrer text;
BEGIN
  v_path := left(split_part(split_part(coalesce(p_path, ''), '?', 1), '#', 1), 500);
  IF v_path IS NULL OR length(trim(v_path)) = 0 THEN
    RETURN;
  END IF;
  v_reason := NULLIF(left(coalesce(p_reason, ''), 80), '');
  v_referrer := NULLIF(left(coalesce(p_referrer, ''), 500), '');

  IF NOT EXISTS (SELECT 1 FROM public.seo_404_log WHERE path = v_path)
     AND (SELECT count(*) FROM public.seo_404_log WHERE first_seen_at > now() - interval '1 hour') >= 300 THEN
    RETURN;
  END IF;

  INSERT INTO public.seo_404_log (path, referrer, source, reason, hits, last_seen_at)
  VALUES (v_path, v_referrer, 'auto', v_reason, 1, now())
  ON CONFLICT (path) DO UPDATE
    SET hits         = public.seo_404_log.hits + 1,
        last_seen_at = now(),
        referrer     = COALESCE(EXCLUDED.referrer, public.seo_404_log.referrer),
        reason       = COALESCE(EXCLUDED.reason, public.seo_404_log.reason);
END;
$$;
REVOKE ALL ON FUNCTION public.log_404(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_404(text, text, text) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5) Storage: listagem pública dos buckets de imagens.
--    "project-images public read" e "public read post-images" davam SELECT a
--    anon, o que permite LISTAR o bucket (inclusive fotos e slugs de projetos
--    em rascunho importados do Drive). Buckets públicos servem as URLs
--    públicas sem policy nenhuma; a leitura via API fica só para o admin
--    (necessária para upsert/remove no painel).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "project-images public read" ON storage.objects;
DROP POLICY IF EXISTS "public read post-images" ON storage.objects;
DROP POLICY IF EXISTS "admin read site images" ON storage.objects;
CREATE POLICY "admin read site images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('project-images', 'post-images', 'project-covers', 'project-gallery', 'blog-images')
    AND public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 6) leads.form_path — qual formulário gerou o lead.
--    `landing_path` passou a ser a página de entrada da sessão (atribuição);
--    o painel filtrava Diagnósticos/Mensagens por ele e perdia leads.
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS form_path text;
COMMENT ON COLUMN public.leads.form_path IS
  'Formulário que gerou o lead (/diagnostico, /contato, /orcamento, /parceiros, /o, /p). landing_path é atribuição, não formulário.';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_form_path_len') THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_form_path_len CHECK (form_path IS NULL OR char_length(form_path) <= 40);
  END IF;
END $$;
-- Backfill: formulários que gravavam o próprio caminho em landing_path…
UPDATE public.leads
   SET form_path = landing_path
 WHERE form_path IS NULL
   AND landing_path IN ('/diagnostico', '/contato', '/orcamento', '/parceiros', '/o', '/p');
-- …e /diagnostico, o único que envia `chaves`/`lives_in_sp`.
UPDATE public.leads
   SET form_path = '/diagnostico'
 WHERE form_path IS NULL
   AND (chaves IS NOT NULL OR lives_in_sp IS NOT NULL);
CREATE INDEX IF NOT EXISTS leads_form_path_created_at_idx ON public.leads (form_path, created_at DESC);

-- ---------------------------------------------------------------------------
-- 7) Rate limit durável para edge functions públicas (notify-lead, IA,
--    track). Contador por chave e janela; só a service role usa. As funções
--    fazem fail-open se a RPC falhar.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  hits         integer     NOT NULL DEFAULT 0
);
ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.edge_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_key text, p_window_s integer, p_max integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hits integer;
  v_window interval := make_interval(secs => GREATEST(p_window_s, 1));
BEGIN
  INSERT INTO public.edge_rate_limits AS r (key, window_start, hits)
  VALUES (left(p_key, 200), now(), 1)
  ON CONFLICT (key) DO UPDATE SET
    hits         = CASE WHEN r.window_start < now() - v_window THEN 1 ELSE r.hits + 1 END,
    window_start = CASE WHEN r.window_start < now() - v_window THEN now() ELSE r.window_start END
  RETURNING hits INTO v_hits;

  -- Limpeza amortizada das chaves velhas.
  IF random() < 0.01 THEN
    DELETE FROM public.edge_rate_limits WHERE window_start < now() - interval '2 days';
  END IF;

  RETURN v_hits <= p_max;
END;
$$;
REVOKE ALL ON FUNCTION public.hit_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(text, integer, integer) TO service_role;

-- ---------------------------------------------------------------------------
-- 8) Tetos de tamanho que valem também para a service role (as edge
--    functions gravam com ela e passam por cima das policies).
--    NOT VALID: não reescreve nem valida linhas antigas.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_value_size') THEN
    ALTER TABLE public.analytics_events
      ADD CONSTRAINT analytics_events_value_size
      CHECK (value IS NULL OR octet_length(value::text) <= 8000) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crash_reports_sizes') THEN
    ALTER TABLE public.crash_reports
      ADD CONSTRAINT crash_reports_sizes
      CHECK (
        coalesce(length(message), 0) <= 4000
        AND coalesce(length(stack), 0) <= 8000
        AND coalesce(length(route), 0) <= 2048
        AND coalesce(length(user_agent), 0) <= 1024
        AND (extra IS NULL OR octet_length(extra::text) <= 16000)
      ) NOT VALID;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 9) top_projects (home): p_days/p_limit sem teto permitiam varrer toda a
--    tabela de eventos a cada chamada anônima.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.top_projects(p_limit integer DEFAULT 3, p_days integer DEFAULT 90)
RETURNS TABLE(id uuid, slug text, title text, cover_url text, project_type text, neighborhood text, location text, area_m2 numeric, duration text, views bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         p.slug,
         p.title,
         p.cover_url,
         p.project_type::text,
         p.neighborhood,
         p.location,
         p.area_m2::numeric,
         p.duration,
         COALESCE(v.views, 0) AS views
  FROM public.projects p
  LEFT JOIN (
    SELECT split_part(path, '/', 3) AS slug, count(*) AS views
    FROM public.analytics_events
    WHERE event_type = 'pageview'
      AND path LIKE '/portfolio/%'
      AND created_at > now() - make_interval(days => LEAST(GREATEST(p_days, 1), 365))
    GROUP BY 1
  ) v ON v.slug = p.slug
  WHERE p.published = true
    AND p.cover_url IS NOT NULL
  ORDER BY COALESCE(v.views, 0) DESC, p.sort_order ASC NULLS LAST, p.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 24);
$$;

-- ---------------------------------------------------------------------------
-- 10) partner_referrals (criada fora do repositório): INSERT anônimo com
--     WITH CHECK (true) deixava qualquer um criar indicação já "confirmada",
--     com comissão e valor de contrato preenchidos. O visitante só pode
--     inserir os campos do formulário, com tamanho limitado.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.partner_referrals') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Qualquer um pode enviar indicacao" ON public.partner_referrals';
    EXECUTE $p$
      CREATE POLICY "Qualquer um pode enviar indicacao"
        ON public.partner_referrals
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (
          status = 'nova'
          AND commission_status = 'pendente'
          AND contract_value IS NULL
          AND commission_amount IS NULL
          AND internal_notes IS NULL
          AND confirmed_at IS NULL
          AND confirmed_by IS NULL
          AND coalesce(length(partner_name), 0) <= 160
          AND coalesce(length(partner_type), 0) <= 80
          AND coalesce(length(company), 0) <= 160
          AND coalesce(length(document), 0) <= 40
          AND coalesce(length(whatsapp), 0) <= 30
          AND coalesce(length(email), 0) <= 254
          AND coalesce(length(region), 0) <= 200
          AND coalesce(length(units), 0) <= 80
          AND coalesce(length(origin), 0) <= 120
          AND coalesce(length(message), 0) <= 4000
          AND coalesce(length(client_name), 0) <= 160
          AND coalesce(length(landing_path), 0) <= 500
          AND coalesce(length(referrer), 0) <= 500
          AND coalesce(length(user_agent), 0) <= 500
        )
    $p$;
  END IF;
END $$;
