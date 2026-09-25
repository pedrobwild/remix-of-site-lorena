create table if not exists public.meta_leads (
  id uuid primary key default gen_random_uuid(),
  meta_lead_id text not null unique,
  created_time timestamptz not null,
  synced_at timestamptz not null default now(),
  page_id text,
  form_id text,
  form_name text,
  ad_id text,
  ad_name text,
  adset_id text,
  adset_name text,
  campaign_id text,
  campaign_name text,
  platform text,
  is_organic boolean,
  is_test boolean not null default false,
  name text,
  email text,
  phone text,
  city text,
  answers jsonb not null default '[]'::jsonb,
  status text not null default 'novo'
    check (status in ('novo', 'contatado', 'qualificado', 'descartado')),
  notify jsonb,
  notified_at timestamptz,
  deleted_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.meta_leads is
  'Leads dos formulários instantâneos da Meta (Lead Ads), trazidos pela edge function meta-sync.';
comment on column public.meta_leads.meta_lead_id is 'Id do lead na Meta (leadgen_id). Chave de deduplicação — também no CRM.';
comment on column public.meta_leads.phone is 'Telefone em E.164 (+55DDDNÚMERO para o Brasil).';
comment on column public.meta_leads.answers is 'Respostas além de nome/e-mail/telefone/cidade: [{key, label, value}].';
comment on column public.meta_leads.notify is
  'Aviso ao time: {slack, email, crm} enviado; {skipped: backfill|old} sem aviso; {state: sending} em envio; nulo = pendente.';
comment on column public.meta_leads.deleted_at is 'Excluído no painel: dados pessoais apagados; a linha fica para a sincronização não reimportar.';

create index if not exists meta_leads_created_time_idx on public.meta_leads (created_time desc);
create index if not exists meta_leads_campaign_idx on public.meta_leads (campaign_id, created_time desc);
create index if not exists meta_leads_pending_idx on public.meta_leads (created_time) where notify is null and deleted_at is null;

drop trigger if exists meta_leads_set_updated_at on public.meta_leads;
create trigger meta_leads_set_updated_at
  before update on public.meta_leads
  for each row execute function public.set_updated_at();

alter table public.meta_leads enable row level security;

drop policy if exists "Admins can view meta leads" on public.meta_leads;
create policy "Admins can view meta leads"
  on public.meta_leads for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update meta leads" on public.meta_leads;
create policy "Admins can update meta leads"
  on public.meta_leads for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.meta_leads from anon;
revoke all on public.meta_leads from authenticated;
grant select on public.meta_leads to authenticated;
grant update (status, name, email, phone, city, answers, deleted_at) on public.meta_leads to authenticated;
grant all on public.meta_leads to service_role;

create table if not exists public.meta_ads_daily (
  account_id text not null,
  date date not null,
  campaign_id text not null,
  campaign_name text,
  objective text,
  currency text,
  spend numeric(14, 2) not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  link_clicks bigint not null default 0,
  leads integer not null default 0,
  form_leads integer not null default 0,
  site_leads integer not null default 0,
  conversations integer not null default 0,
  synced_at timestamptz not null default now(),
  primary key (account_id, date, campaign_id)
);

comment on table public.meta_ads_daily is
  'Métricas diárias por campanha da conta de anúncios da Meta (Insights), gravadas pela edge function meta-sync.';
comment on column public.meta_ads_daily.date is 'Dia no fuso da conta de anúncios.';
comment on column public.meta_ads_daily.leads is 'Ação "lead" da Meta: total (formulário + site). Não somar com form_leads/site_leads.';
comment on column public.meta_ads_daily.form_leads is 'Leads de formulário instantâneo (onsite_conversion.lead_grouped).';
comment on column public.meta_ads_daily.site_leads is 'Leads do site pelo Pixel/CAPI (offsite_conversion.fb_pixel_lead).';
comment on column public.meta_ads_daily.conversations is 'Conversas iniciadas por mensagem (onsite_conversion.messaging_conversation_started_7d).';

create index if not exists meta_ads_daily_date_idx on public.meta_ads_daily (date desc);

alter table public.meta_ads_daily enable row level security;

drop policy if exists "Admins can view meta ads daily" on public.meta_ads_daily;
create policy "Admins can view meta ads daily"
  on public.meta_ads_daily for select to authenticated
  using (public.is_admin());

revoke all on public.meta_ads_daily from anon;
revoke all on public.meta_ads_daily from authenticated;
grant select on public.meta_ads_daily to authenticated;
grant all on public.meta_ads_daily to service_role;

create table if not exists public.meta_sync_state (
  key text primary key check (key in ('ads', 'leads')),
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  cursor jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.meta_sync_state is
  'Estado da sincronização com a Meta (meta-sync): última rodada, último sucesso, último erro e cursor de cada parte.';

drop trigger if exists meta_sync_state_set_updated_at on public.meta_sync_state;
create trigger meta_sync_state_set_updated_at
  before update on public.meta_sync_state
  for each row execute function public.set_updated_at();

alter table public.meta_sync_state enable row level security;

drop policy if exists "Admins can view meta sync state" on public.meta_sync_state;
create policy "Admins can view meta sync state"
  on public.meta_sync_state for select to authenticated
  using (public.is_admin());

revoke all on public.meta_sync_state from anon;
revoke all on public.meta_sync_state from authenticated;
grant select on public.meta_sync_state to authenticated;
grant all on public.meta_sync_state to service_role;