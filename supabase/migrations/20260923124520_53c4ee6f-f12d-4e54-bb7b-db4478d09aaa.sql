create table public.partner_cases (
  slug text primary key,
  partner_name text not null,
  stats jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  project_slugs text[] not null default '{}',
  quote_text text,
  quote_author text,
  quote_role text,
  updated_on date,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.partner_cases to anon;
grant select, insert, update, delete on public.partner_cases to authenticated;
grant all on public.partner_cases to service_role;

alter table public.partner_cases enable row level security;
create policy "partner_cases leitura publica" on public.partner_cases for select using (true);
create policy "partner_cases escrita admin" on public.partner_cases for all using (public.is_admin()) with check (public.is_admin());

create trigger partner_cases_set_updated_at
  before update on public.partner_cases
  for each row execute function public.set_updated_at();