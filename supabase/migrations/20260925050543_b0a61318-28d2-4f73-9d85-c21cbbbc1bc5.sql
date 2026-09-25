-- Fase 1 — conversões (Meta Pixel + API de Conversões, Google Ads) e
-- atribuição completa dos leads.

-- 1) leads: primeiro e último toque, ids de clique de anúncio, identificadores
--    do navegador do Meta (_fbp/_fbc — só existem com aceite de cookies), o
--    aceite em si e o event_id compartilhado entre o Pixel (navegador) e a API
--    de Conversões (servidor): é ele que faz o Meta contar o lead uma vez só.
alter table public.leads
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists first_utm_source text,
  add column if not exists first_utm_medium text,
  add column if not exists first_utm_campaign text,
  add column if not exists gclid text,
  add column if not exists fbclid text,
  add column if not exists fbp text,
  add column if not exists fbc text,
  add column if not exists consent_marketing boolean,
  add column if not exists event_id text;

-- 2) site_settings: rótulos das conversões do Google Ads e código de teste da
--    API de Conversões do Meta. A tabela é de leitura pública (o site lê as
--    configurações sem login), então nada aqui é segredo: o token do Meta fica
--    nos segredos das edge functions (META_CAPI_ACCESS_TOKEN).
alter table public.site_settings
  add column if not exists google_ads_lead_label text,
  add column if not exists google_ads_contact_label text,
  add column if not exists meta_capi_test_event_code text;

-- 3) integration_log: resultado de cada envio para plataformas externas (hoje,
--    a API de Conversões do Meta). Sem dados pessoais: só ids, status e códigos
--    de erro. Gravado pelas edge functions (service role); lido só por admin.
create table if not exists public.integration_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  integration text not null,
  event_name text,
  lead_id uuid references public.leads(id) on delete set null,
  status text not null check (status in ('sent', 'skipped', 'error')),
  http_status integer,
  detail jsonb
);

create index if not exists integration_log_created_at_idx
  on public.integration_log (created_at desc);
create index if not exists integration_log_integration_idx
  on public.integration_log (integration, created_at desc);
create index if not exists integration_log_lead_id_idx
  on public.integration_log (lead_id);

alter table public.integration_log enable row level security;

drop policy if exists "Admins can view integration log" on public.integration_log;
create policy "Admins can view integration log"
  on public.integration_log for select
  to authenticated
  using (public.is_admin());

revoke all on table public.integration_log from anon;
revoke insert, update, delete on table public.integration_log from authenticated;
grant select on table public.integration_log to authenticated;
grant all on table public.integration_log to service_role;