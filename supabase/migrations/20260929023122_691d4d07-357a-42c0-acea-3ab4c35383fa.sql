-- Leitura direta das três tabelas passa a ser só de administradores.
drop policy if exists "public read site settings" on public.site_settings;
create policy "admin read site settings" on public.site_settings for select to authenticated using (public.is_admin());

drop policy if exists alt_public_read on public.image_alt_texts;
create policy alt_admin_read on public.image_alt_texts for select to authenticated using (public.is_admin());

drop policy if exists "partner_cases leitura publica" on public.partner_cases;
create policy "partner_cases leitura admin" on public.partner_cases for select to authenticated using (public.is_admin());

revoke select on public.site_settings, public.image_alt_texts, public.partner_cases from anon;

-- Site público lê pelas funções abaixo, que devolvem só o necessário.
create or replace function public.get_public_site_settings()
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(s) - 'meta_capi_test_event_code'
  from public.site_settings s where s.id = 1;
$$;

create or replace function public.get_image_alts(p_urls text[])
returns table(url text, alt text) language sql stable security definer set search_path = public as $$
  select a.url, a.alt from public.image_alt_texts a
  where a.url = any(p_urls[1:300]);
$$;

create or replace function public.get_partner_case(p_slug text)
returns table(slug text, partner_name text, stats jsonb, timeline jsonb, project_slugs text[],
  quote_text text, quote_author text, quote_role text, updated_on date, published boolean)
language sql stable security definer set search_path = public as $$
  select c.slug, c.partner_name, c.stats, c.timeline, c.project_slugs, c.quote_text,
         c.quote_author, c.quote_role, c.updated_on, c.published
  from public.partner_cases c where c.slug = p_slug and c.published = true;
$$;

grant execute on function public.get_public_site_settings() to anon, authenticated;
grant execute on function public.get_image_alts(text[]) to anon, authenticated;
grant execute on function public.get_partner_case(text) to anon, authenticated;