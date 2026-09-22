-- Assistente de dúvidas do site (sem IA generativa)
create table if not exists public.assistant_kb (
  id text primary key,
  tema text not null,
  status text not null default 'pronto' check (status in ('pronto', 'whatsapp')),
  pergunta text not null,
  resposta text not null,
  gatilhos text[] not null default '{}',
  palavras_fortes text[] not null default '{}',
  palavras text[] not null default '{}',
  exemplos text[] not null default '{}',
  acoes jsonb not null default '[]'::jsonb,
  relacionadas text[] not null default '{}',
  sugerir_em text[] not null default '{}',
  ordem integer not null default 100,
  ativo boolean not null default true,
  updated_at timestamptz not null default now()
);

grant select on public.assistant_kb to anon, authenticated;
grant all on public.assistant_kb to service_role;

alter table public.assistant_kb enable row level security;

create policy "public read active assistant_kb"
  on public.assistant_kb for select
  using (ativo = true);

create policy "admin all assistant_kb"
  on public.assistant_kb for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.assistant_unanswered (
  id uuid primary key default gen_random_uuid(),
  pergunta text not null check (char_length(pergunta) between 1 and 300),
  path text check (path is null or char_length(path) <= 200),
  created_at timestamptz not null default now()
);

grant insert on public.assistant_unanswered to anon, authenticated;
grant select, update, delete on public.assistant_unanswered to authenticated;
grant all on public.assistant_unanswered to service_role;

alter table public.assistant_unanswered enable row level security;

create policy "public insert assistant_unanswered"
  on public.assistant_unanswered for insert
  to anon, authenticated
  with check (char_length(pergunta) between 1 and 300 and (path is null or char_length(path) <= 200));

create policy "admin all assistant_unanswered"
  on public.assistant_unanswered for all
  using (public.is_admin())
  with check (public.is_admin());