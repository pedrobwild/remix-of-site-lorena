
# Redesign da página Jornada Be Wild / Método (`/metodo-bwild`)

Re-skin total da página existente. Ordem das seções mantida. Copy abaixo já é a final do prompt. Escuro só em hero + footer global.

## Escopo de arquivos

- **`src/pages/MetodoBwildPage.tsx`** — reescrever o conteúdo da página (hero, etapas, ciclo, CTA final). Mantém uso de `<Header />`, `<Footer />`, `<FloatingWhatsAppButton />`, `<MobileBottomCTA />`, `<StickyDiagnosticPanel />`.
- **`src/styles/metodo.css`** (novo) — estilos específicos da página: hero overlay/grain, trilho horizontal pinned, cards de etapa, linha de progresso, pills do ciclo, CTA final. Importado no topo da página.
- **`src/components/landing/JornadaPinnedTrack.tsx`** (novo) — componente proprietário do scroll horizontal pinned das 5 etapas. Recebe a lista canônica das etapas, faz GSAP `ScrollTrigger` com `pin: true, scrub: .8`, calcula a distância do trilho, atualiza contador `0X / 05` e barra de progresso gold. Em `≤900px` ou `prefers-reduced-motion` cai para layout vertical com linha gold preenchendo por scroll.
- **`src/components/landing/JornadaBeWild.tsx`** — adicionar as 5 cópias finais (descrição + CheckList) nesta página. Não tocamos nas outras variantes (`home`/`compacta`/`mini`) — apenas reusamos `ETAPAS_JORNADA` como fonte e ampliamos `detalhe` se necessário (a copy nova de checklist substitui a atual nesse arquivo, já que a lista canônica é a mesma e o restante do site usa só `title`/`descricao`/`icon`).

GSAP/ScrollTrigger já existe no projeto (`src/lib/gsap.ts`, `useBwMotion`).

## Seções implementadas

### 1. Hero (escuro, foto/vídeo full-bleed)
- 100vh (min 640px), conteúdo ancorado embaixo, container 1180.
- Slot de mídia full-bleed (`<video muted loop playsinline>` se disponível, senão `<img>`); overlay duplo + grain SVG; pílula mono discreta enquanto não houver material.
- Eyebrow gold-400 `JORNADA BE WILD`.
- H1 em duas linhas com máscara (`overflow:hidden` por linha) + GSAP `yPercent: 110 → 0`: "Do diagnóstico ao repasse:" / *"o método Be Wild."* (itálico gold-400).
- Lead branco .85 + BtnPrimary "Iniciar diagnóstico →".
- Indicador `ROLE PARA DESCER` no canto inferior direito com linha vertical pulsante.
- Timeline de entrada GSAP (sem pin no hero).

### 2. As 5 etapas (claro `#FBFAF8`, scroll horizontal pinned)
- Cabeçalho com reveals: eyebrow petróleo `AS 5 ETAPAS`, H2 "Cada etapa conecta *com a próxima*.", sub.
- Desktop: `JornadaPinnedTrack` com 5 cards 560px (cards 02/04 em areia `#F2EEE5` com selo `FASE 1/2`, demais em branco), número gigante mono `rgba(10,37,64,.06)` 9rem ao fundo com parallax x leve, fade/scale por scrub conforme cruzam o centro.
- Track de progresso 2px com fill gold + contador `01 / 05` mono.
- Mobile/reduced-motion: lista vertical com linha gold à esquerda preenchendo por scroll, pontos com borda gold, cards full-width.
- Copy dos 5 cards exatamente como no prompt (Diagnóstico, Be Wild Reformas, Lançamento, BeWild Host Care, Acompanhamento).

### 3. Por que o ciclo inteiro importa (branco)
- Coluna 740px centralizada, eyebrow + H2 + 2 parágrafos verbatim do prompt.
- Faixa de pills mono: `DIAGNÓSTICO → REFORMA → LANÇAMENTO → OPERAÇÃO → REPASSE`, acendendo em sequência ao entrar na viewport (border + texto → gold, ~380ms entre cada).

### 4. CTA final (areia `#F2EEE5`)
- Container 760, centralizado. H2 "Descubra em qual etapa seu imóvel está.", parágrafo, dois CTAs: BtnPrimary "Diagnosticar meu imóvel →" e BtnGhost ink "Falar com especialista".

### 5. Footer
- Mantém o `<Footer />` global já no padrão ink.

## Tokens / classes
- Reuso de `bewild-cream`, `bewild-parchment`, `bewild-ink`, `bewild-gold`, `bewild-gold-400`, `bewild-blue` já no Tailwind config.
- Easing universal `cubic-bezier(.22,.61,.21,1)` via CSS custom property na folha nova.
- Sem cores hardcoded fora dos tokens listados no prompt; sem gradientes coloridos.

## Detalhes técnicos
- `ScrollTrigger` com `invalidateOnRefresh: true` e cleanup no `useEffect`.
- `matchMedia('(max-width: 900px)')` + `(prefers-reduced-motion: reduce)` para alternar entre pinned e vertical, sem montar dois DOMs duplicados.
- Reveals padrão centralizados num helper `useReveal` local (IntersectionObserver, threshold .16), aplicado a eyebrow → título → texto → CTA com delays `.12/.24/.36/.48s`.
- Imports tipados; nenhum `any`. Sem mudanças em `App.tsx`, rotas, sitemap ou SEO além do `useSeo` já existente (mantido com pequenos ajustes de copy se necessário).

## Fora do escopo
- Header, Footer global, dropdown de Conteúdos, FloatingCTA, navbar scroll behavior (já existem e foram tratados em prompts anteriores).
- Outras páginas e o componente `JornadaBeWild` nas variantes `home`/`compacta`/`mini`.
- Backend, rotas, fontes (Playfair/Poppins/JetBrains Mono já carregadas).
