create table public.nutricao_envios (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  trilha text not null check (trilha in ('proposta','aguardando','aquecer')),
  teste boolean not null default false,
  template_data jsonb not null,
  idempotency_key text not null unique,
  status text not null default 'pendente'
    check (status in ('pendente','enviando','enviado','suprimido','erro')),
  tentativas int not null default 0,
  erro text,
  enviado_em timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.nutricao_envios to authenticated;
grant all on public.nutricao_envios to service_role;
alter table public.nutricao_envios enable row level security;
create policy "admins leem nutricao_envios" on public.nutricao_envios
  for select to authenticated using (public.is_admin());
create index nutricao_envios_fila_idx on public.nutricao_envios (status, created_at);