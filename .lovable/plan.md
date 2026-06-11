# Plano — Home BeWild (Prompt 10)

Reescrita completa da Home + ajustes globais (header, footer, FloatingCTA, rotas) seguindo o brief, mantendo o design system BeWild já existente.

## Escopo
Apenas Home (`/`) + chrome global (Header, Footer, FloatingCTA). Portfolio/Conteúdos/Diagnóstico **não** serão criados nesta entrega — só os links apontarão para `/portfolio`, `/conteudos`, `/diagnostico` (rotas já existentes ou a criar como stubs mínimos se faltar).

## 1. Fundação global
- **Grafia**: substituir "bewild" → "BeWild" em todo conteúdo da Home, header, footer, FloatingCTA.
- **Wordmark** (`BewildLogo` em `primitives.tsx`): atualizar para `Be` + `Wild` itálico, sem espaço, Playfair 600. Gold-400 sobre escuro, petróleo sobre claro.
- **Header** (`Header.tsx`): novos links — `O que fazemos` (#o-que-fazemos), `Como funciona` (#como-funciona), `Portfólio` (/portfolio), `Conteúdos ▾` (/conteudos com dropdown), `Falar no WhatsApp`, CTA `Solicitar diagnóstico →` (/diagnostico). Remover Host Care/Jornada/Simulador se houver. Navbar transparente sobre hero, blur claro após 40px.
- **Footer** (`Footer.tsx`): 3 colunas conforme brief; barra final nova; nome gigante `Be`+`Wild` itálico cortado pela borda com scrub. Remover widget verde "Falar com especialista" e logo-imagem antiga (se existirem).
- **FloatingCTA** (`FloatingWhatsAppButton.tsx`): substituir por card ink "Quer um diagnóstico do seu studio?" + BtnPrimary `Solicitar →` + mono `CONSULTIVO · SEM COMPROMISSO`, fechável, oculto em /diagnostico.
- **content.ts**: refatorar SERVICES, DIFFERENTIALS, AUDIENCE, FAQS, NAV_LINKS, CONTACT com as copys novas do brief.

## 2. Seções da Home (substituir/criar em `src/components/landing/`)
Ordem final em `App.tsx`:
1. **HeroSection** — 100vh, foto, eyebrow `BEWILD · REFORMA TURN-KEY...`, H1 2 linhas com itálico gold, lead, microlinha, 2 CTAs, `ROLE PARA DESCER`. GSAP entrada cinematográfica.
2. **ProblemSection** — split copy/6 RiskCards conforme brief.
3. **ServicesSection** (renomear conceito p/ "O que fazemos") — 6 lâminas horizontais com setas, dots, auto-avanço 4.8s, hover/click, mobile empilha.
4. **ProcessTimeline** ("Como funciona") — 7 cards scroll horizontal pinned com GSAP scrub, contador `0X / 07`, números gigantes parallax. Mobile vertical com linha gold scaleY.
5. **ArchitectureSection** ("Projeto personalizado") — split com 5 itens.
6. **DifferentialsSection** — grid 4×2, 8 diferenciais.
7. **CredibilitySection** — 4 stats com sub-disclaimers + faixa 6 checks.
8. **CasesGallery** ("Portfólio") — 2 cards preview + disclaimer + BtnGhost → /portfolio.
9. **TechnologySection** ("Portal") — split + componente Portal mockup com barra 52% animando.
10. **ComparisonSection** — tabela 3 col, 6 linhas; mobile vira cards.
11. **AudienceSection** — grid 3×2, 6 perfis.
12. **FAQSection** — 10 perguntas (já existem? completar/corrigir).
13. **FinalCTA** — H2 + parágrafo + 2 CTAs.

## 3. Motion
- Reveals `.rv` (fade+y32, 1s, delays escalonados) em todas as seções via GSAP ScrollTrigger.
- Hero: mídia scale 1.08→1, H1 stagger por linha.
- Lâminas: flex animado, auto-avanço com cancelamento na 1ª interação.
- ProcessTimeline: pin + scrub horizontal desktop, scaleY no mobile.
- Portal: y 80→0, scale .94→1, barra 52% preenchendo por scroll.
- `prefers-reduced-motion`: desliga pin/auto-avanço, mantém conteúdo visível.

## 4. Slots de imagem
Reaproveitar `src/assets/hero-slides/*` para hero (1 imagem em vez de carrossel). Demais slots: pílula mono `SLOT — descrição` no canto até fotos reais.

## 5. Fora de escopo (não tocar)
- Páginas /portfolio, /blog, /sobre, admin/* — só receber links.
- SEO/JSON-LD da Home permanece (App.tsx já tem useSeo OK).
- Backend, rotas, sitemap.

## 6. Verificação
Build + visual check em desktop e mobile (375px).

## Notas técnicas
- Tokens já existem (`bewild-ink`, `bewild-blue`, `gold-400`, `font-display`, `font-mono`); usar somente classes semânticas.
- Não criar páginas novas; só apontar hrefs.
- Stub do FAQ: se as 10 perguntas exatas não existirem no `content.ts`, transcrever do brief com respostas curtas (a primeira tem resposta fornecida; demais inventar tom consistente, claro e técnico — pedir confirmação ao usuário **só** se ele explicitar).
