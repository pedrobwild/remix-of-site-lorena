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
| `/conteudos/:slug` | `Article` (autor `Person` ou `Organization`, `datePublished`/`dateModified` reais) + `BreadcrumbList` + `FAQPage` quando o post tem FAQ; durante o carregamento, `BreadcrumbList` estático e título por slug |
| `/faq` | `FAQPage` |
| `/contato` | `BreadcrumbList` |

> `organizationJsonLd` e `professionalServiceJsonLd` publicam CNPJ e CAU a
> partir de `site_settings`. Como as colunas `cnpj`/`cau` ainda **não existem**
> no banco de produção (ver `docs/auditoria/rodada-2026-09-22.md`, DB-02), o
> valor que vai ao ar é o de `DEFAULTS` em `src/lib/useSiteSettings.ts`. Esses
> números estão travados por teste em
> `src/lib/__tests__/identidadeOficial.test.ts` — não altere sem atualizar o
> teste.

### Posts: autor, datas e FAQ (`src/lib/postSeo.ts`)

- **Autor.** O campo "Autor" do admin é texto livre. `Equipe Bewild` (ou vazio)
  publica `Organization`; um nome de pessoa publica `Person`. Nomes com registro
  conhecido ganham cargo e registro (hoje só Thiago Dantas do Amor, CAU
  A162437-7, fonte: rodapé oficial). Para acrescentar alguém, edite
  `KNOWN_AUTHORS` com uma fonte verificável — nada de número de registro de
  memória.
- **Datas.** `datePublished` = `published_at`; `dateModified` = `updated_at`
  quando é posterior. A linha "Atualizado em" aparece só quando a alteração foi
  em outro dia. Editar o post no admin já atualiza tudo (trigger `set_updated_at`).
- **FAQ.** Editado no admin (pergunta + resposta) e emitido como `FAQPage`.
  Padrão do plano SEO + IA: 4–6 perguntas, respostas de 40–70 palavras, tiradas
  do que o leitor pergunta ao Google.
- **Fallback.** Enquanto o banco não responde, `<title>` e H1 vêm do slug e o
  `BreadcrumbList` é estático (SEO-14).
- **llms.txt.** A seção "Conteúdos publicados" é reescrita por
  `scripts/generate-sitemap.mjs` entre os marcadores `posts:start`/`posts:end`.

### Padrão de post citável (resumo do plano de 21/09/2026)

Resposta em 2–3 frases no primeiro parágrafo, com número; um dado próprio com
origem e período declarados; uma tabela; subtítulos em forma de pergunta; FAQ
com 4–6 perguntas; autor com nome e registro; 3–5 links internos (pilar do
cluster, portfólio do bairro, `/diagnostico` uma vez no fim) e 2–3 externos para
fonte primária; ano no título quando o tema é preço, lei ou mercado; um único
CTA no fim. Nunca prometer renda ou ocupação; "Bewild", nunca "BeWild".

Valide tudo em: https://search.google.com/test/rich-results

---

## Sitemap

O sitemap oficial do site é o arquivo estático **`public/sitemap.xml`**, servido
em `https://bewild.com.br/sitemap.xml` e declarado no `robots.txt`.

Ele é **regenerado automaticamente no `prebuild`** pelo script
`scripts/generate-sitemap.mjs`, que consulta o banco via REST (chave pública) e
inclui:

- as rotas estáticas indexáveis (`/`, `/portfolio`, `/diagnostico`,
  `/orcamento`, `/conteudos`, `/guia-do-investidor`, `/faq`,
  `/autorizacao-condominio`, `/contato`, `/escopo`, `/como-funciona`,
  `/onde-atuamos`, `/parceiros`, `/privacidade`) — `/contato` entrou em
  18/09/2026 e `/guia-do-investidor` (página pilar, prioridade 0.8) em
  22/09/2026;
- um `<url>` por projeto com `published = true` e `visible = true` (prioridade 0.7);
- um `<url>` por conteúdo com `published = true` (prioridade 0.6);
- `lastmod` a partir da data mais recente disponível de cada registro.

O script nunca quebra o build: se faltar env, a rede falhar ou vierem menos de 6
projetos, ele imprime um aviso e mantém o arquivo atual.

Rodar manualmente: `npm run sitemap`.

### Por que existem duas fontes de sitemap (SEO-08)

Além do script de build existe a edge function `supabase/functions/sitemap/`.
**Ela não serve `/sitemap.xml`** — é o motor do botão *"gerar sitemap agora"*
em `Admin › SEO › Sitemap & Robots`, que mostra as URLs e permite baixar o
arquivo. Quem vai ao ar continua sendo o `public/sitemap.xml` commitado; o
próprio painel avisa isso.

As duas fontes foram conferidas em 22/09/2026 e estão **alinhadas**: mesmas
rotas estáticas (14, incluindo `/guia-do-investidor`), mesmas prioridades, mesmo filtro (`published = true AND
visible = true` para projetos, `published = true` para conteúdos) e mesmo
critério de `lastmod`. Travado por `src/lib/__tests__/sitemapParidade.test.ts`.
Se alterar uma, altere a outra — senão o preview do admin passa a divergir do
arquivo publicado.

A edge function `supabase/functions/robots/` tem a mesma natureza de preview e
**é mais permissiva** que o `public/robots.txt` real: não traz os `Disallow`
de `/gpt-knowledge/` e `/bakeoff/`. O arquivo estático é a fonte de verdade.

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
