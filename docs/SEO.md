# Gestão de SEO — Bewild

Este documento explica todas as ferramentas de SEO disponíveis no ambiente admin
e como registrar oficialmente o site no Google.

Acesse o painel em **[/admin/seo](/admin/seo)**.

Domínio canônico do site: **https://bewild.com.br**
Negócio: reforma turn-key de studios para short stay em São Paulo.

---

## Estrutura do admin de SEO

A tela `Admin › SEO` é dividida em 7 abas:

| Aba | Função |
|---|---|
| **Global** | Título padrão, descrição, OG image, canonical, keywords, autor, geo |
| **Verificações** | Google Search Console, Bing, Yandex, Facebook, Pinterest |
| **Analytics & Pixels** | GA4, Google Tag Manager, Google Ads, Meta Pixel, Clarity, Hotjar |
| **Negócio local** | Schema LocalBusiness (horário, preço, CEP, mapa, GBP) |
| **Sitemap & Robots** | URLs dinâmicas, copiar, enviar ao Search Console |
| **Auditoria** | Análise automática on-page com score de 0–100 |
| **Guia Google** | 10 passos para registrar e ranquear oficialmente |

Todos os valores são persistidos na tabela `site_settings` do banco e aplicados
no `<head>` do site em tempo real via `src/lib/useSeo.ts`.

---

## Registro oficial no Google — resumo rápido

1. **Search Console** — https://search.google.com/search-console/welcome
   - Adicione `bewild.com.br` como propriedade
   - Escolha método "HTML tag" e copie apenas o `content=` do código
   - Cole em **Admin › SEO › Verificações › Google Search Console**, salve
   - Volte ao Search Console e clique em "Verificar"

2. **Sitemap** — envie `https://bewild.com.br/sitemap.xml` em Search Console › Sitemaps

3. **Google Analytics 4** — https://analytics.google.com/
   - Crie propriedade, copie o ID `G-XXXXXXX`
   - Cole em **Admin › SEO › Analytics › Google Analytics 4**

4. **Google Business Profile** — https://business.google.com/create
   - Fundamental para buscas locais em São Paulo
   - Adicione foto, endereço completo, horário, telefone e link

Tudo explicado passo-a-passo na aba **Guia Google** do admin.

---

## Schema.org emitido automaticamente

A home injeta blocos JSON-LD:

- `Organization` / `LocalBusiness` — dados da Bewild, endereço, horário, geo, serviços
- `WebSite` — nome, URL, idioma, publisher
- `FAQPage` — perguntas frequentes da home (reuso do helper `faqJsonLd`)

Cada projeto/post individual adiciona também:

- `CreativeWork` ou `Article` — ficha do conteúdo
- `BreadcrumbList` — trilha de navegação

Valide tudo em: https://search.google.com/test/rich-results

---

## Sitemap dinâmico

A edge function `supabase/functions/sitemap/index.ts` gera o XML a partir dos
projetos visíveis no banco. Inclui:

- Namespace de imagens (`xmlns:image`) para Google Images
- Hreflang `pt-BR`
- `lastmod` baseado em `updated_at` de cada projeto
- Cache de 1 hora

A função `robots/index.ts` gera o robots.txt dinâmico, bloqueando `/admin`
e incluindo regras para Googlebot, Bingbot, GPTBot e Google-Extended (LLMs).

O `public/sitemap.xml` estático também é servido como fallback indexável.

---

## Auditoria

A aba Auditoria analisa o DOM atual e produz um score de 0–100, verificando:

- Título (comprimento 40–60)
- Meta description (120–160)
- H1 único e presença de H2
- Imagens com atributo alt
- Links com texto ou aria-label
- Canonical URL
- Open Graph image
- Dados estruturados JSON-LD
- Viewport, idioma, HTTPS
- IDs de Search Console e Analytics configurados

Cada execução é registrada na tabela `seo_audit_log`.

---

## Migrations

- `20260420020800` — cria `site_settings`
- `20260420030718` — adiciona campos SEO básicos
- `20260421203500_seo_advanced_fields.sql` — adiciona verificações, analytics,
  pixels, local business e tabela `seo_audit_log`

> Migrations antigas ainda carregam defaults do template original
> (`lorenaalvesarq.com`, "Lorena Alves"). Os valores efetivos vêm da linha
> única em `site_settings` e dos fallbacks das edge functions, ambos já
> apontando para `bewild.com.br`.

---

## Links rápidos

| Ferramenta | URL |
|---|---|
| Google Search Console | https://search.google.com/search-console |
| Google Analytics | https://analytics.google.com |
| Google Business Profile | https://business.google.com |
| PageSpeed Insights | https://pagespeed.web.dev/?url=https://bewild.com.br |
| Teste Rich Results | https://search.google.com/test/rich-results?url=https://bewild.com.br |
| Bing Webmaster | https://www.bing.com/webmasters |
| Meta Business Suite | https://business.facebook.com |
