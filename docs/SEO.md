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

**A home não injeta JSON-LD via `useSeo`.** O JSON-LD dela é estático, escrito
direto no `index.html` (`Organization`, `WebSite`, `Service`, `City`) — o
`HomePage.tsx` chama `useSeo` sem a chave `jsonLd`. Corrigido em 22/09/2026;
este documento descrevia o comportamento antigo.

Os blocos dinâmicos ficam nas rotas internas, via os helpers de
`src/lib/useSeo.ts`:

| Rota | Blocos |
|---|---|
| `/diagnostico` | `Organization` (helper `organizationJsonLd`) + `BreadcrumbList` |
| `/portfolio` | `BreadcrumbList` + `ItemList` |
| `/portfolio/:slug` | `CreativeWork` + `BreadcrumbList` |
| `/conteudos/:slug` | `Article` + `BreadcrumbList` |
| `/faq` | `FAQPage` |
| `/contato` | `BreadcrumbList` |

> `organizationJsonLd` e `professionalServiceJsonLd` publicam CNPJ e CAU a
> partir de `site_settings`. Como as colunas `cnpj`/`cau` ainda **não existem**
> no banco de produção (ver `docs/auditoria/rodada-2026-09-22.md`, DB-02), o
> valor que vai ao ar é o de `DEFAULTS` em `src/lib/useSiteSettings.ts`. Esses
> números estão travados por teste em
> `src/lib/__tests__/identidadeOficial.test.ts` — não altere sem atualizar o
> teste.

Valide tudo em: https://search.google.com/test/rich-results

---

## Sitemap

O sitemap oficial do site é o arquivo estático **`public/sitemap.xml`**, servido
em `https://bewild.com.br/sitemap.xml` e declarado no `robots.txt`.

Ele é **regenerado automaticamente no `prebuild`** pelo script
`scripts/generate-sitemap.mjs`, que consulta o banco via REST (chave pública) e
inclui:

- as 6 rotas estáticas indexáveis (`/`, `/portfolio`, `/diagnostico`,
  `/conteudos`, `/faq`, `/privacidade`);
- um `<url>` por projeto com `published = true` e `visible = true` (prioridade 0.7);
- um `<url>` por conteúdo com `published = true` (prioridade 0.6);
- `lastmod` a partir da data mais recente disponível de cada registro.

O script nunca quebra o build: se faltar env, a rede falhar ou vierem menos de 6
projetos, ele imprime um aviso e mantém o arquivo atual.

Rodar manualmente: `npm run sitemap`.

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

> Os valores efetivos de SEO vêm da linha única em `site_settings` e dos
> fallbacks das edge functions — todos já apontando para `bewild.com.br`.

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
