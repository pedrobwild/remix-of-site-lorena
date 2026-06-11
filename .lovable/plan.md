## Objetivo
Substituir a Home atual pela nova Home BeWild conforme o código de referência (1138 linhas), preservando layout, copy, tipografia e movimento. Em paralelo: despublicar as rotas legadas e consolidar nav/footer/floating CTA globais.

## Etapa 1 — Limpeza estrutural (antes da Home)
1. **Despublicar rotas legadas**: remover `/host-care`, `/jornada`, `/simulador` (ou nomes equivalentes) de `useHashRoute.ts`, `STATIC_ROUTES`, `router.tsx`, `check-routes-parity.mjs`, `sitemap.xml`, `supabase/functions/sitemap`, e do edge `not-found-check`. Remover páginas/componentes mortos.
2. **Limpar links** para essas rotas no Header, Footer, conteúdos, CTAs e textos do site inteiro (`rg` global).
3. **Remover** `FloatingWhatsAppButton.tsx` (widget verde) e qualquer outro flutuante antigo.
4. **Tokens**: garantir que `--ink/--blue/--gold/--areia/--frio/--home` existam em `index.css` e no `tailwind.config` (já há base — adicionar o que faltar).
5. **Fontes**: confirmar `<link>` com Playfair Display ital,wght 0,500/0,600/1,500/1,600 + Poppins 300/400/500 + JetBrains Mono 400 no `index.html`.
6. **Grafia "BeWild"** em todo o copy (busca global por "Bwild", "Be Wild", "bewild" em texto corrente).

## Etapa 2 — Componentes globais
1. **Header**: ajustar para o padrão do mock — transparente sobre hero escuro da Home, sólido `bg-bewild-home/92 + blur` ao rolar (`scrolled`); em rotas internas (não-home) já sólido desde o topo (correção que apliquei agora). Dropdown "Conteúdos" e "Portfólio" mantidos.
2. **Footer**: 3 colunas + barra final + wordmark gigante `Be*Wild*` cortado pela borda subindo com scrub (GSAP). Garantir grafia e remover links legados.
3. **FloatingCTA** (novo componente `FloatingCTA.tsx`): aparece após ~90% da primeira dobra, fechável com `sessionStorage`, oculto quando rota é `/diagnostico` ou a seção CTA final está visível.

## Etapa 3 — HomePage seção por seção
Arquivo principal: `src/pages/HomePage.tsx` (ou `Index.tsx`) reescrito do zero. Cada seção vira componente isolado em `src/components/home/`:

1. **HeroCinematic** — H1 com máscara linha-a-linha (GSAP SplitText manual), entrada eyebrow→título→lead→micro→CTAs. Em ≥768px e sem reduced-motion: ScrollTrigger pinado por ~90vh; linhas do H1 saem stagger para cima, foto zooma 1→1.12, véu escurece, cue some.
2. **OQueFazemosLaminas** — 6 lâminas horizontais; ativa expande `flex:4.4`; hover ativa; setas + dots; auto-avanço 4.8s que para após primeira interação; mobile empilhado vertical.
3. **ComoFuncionaHorizontalPinned** — ≥901px: ScrollTrigger pin + scrub do trilho com 7 cards; barra gold + contador `0X / 07`; números gigantes parallax dentro de cada card; foco no card central. ≤900px: lista vertical com linha gold preenchendo por scroll.
4. **StackCards** — Cartões sticky sobrepostos (Projeto personalizado → Diferenciais → Credibilidade); ao entrar o próximo, anterior recua scale .94 / y -14 e véu .45; dots de progresso. ≤900px: fluxo empilhado normal.
   - **ProjetoPersonalizado** (cartão 1): imagem estica `flex:1` ao texto, parallax sutil, legenda abaixo.
   - **DiferenciaisCartao** (cartão 2): grid de cards com ícones-linha + Portal BeWild (mock) que sobe `y:80→0, scale .94→1` ao entrar, barra de cronograma enchendo até 52%, etapas concluídas com ✓ gold + pill "EM ANDAMENTO".
   - **CredibilidadeCartao** (cartão 3): 4 contadores (55 / 5 / 10+ / 100%) animando ao entrar com sub-disclaimers verbatim; lista de checks gold.
5. **PortfolioPreview** — 2 cards (Stack) com aspect 16/10, k/v "RESULTADO" gold.
6. **Depoimento** — slot vídeo (poster + botão play azul); `blockquote` italic com filete gold; placeholder até receber vídeo real.
7. **Comparativo** — tabela 3 colunas em desktop; ≤760px vira cards empilhados (✗ cinza, ✓ gold).
8. **FAQ** — 10 perguntas do mock; respostas **reaproveitadas do FaqPage/FAQSection já cadastrado** (busca no projeto); 1 aberto por vez, primeiro aberto por padrão, ícone + girando 45°, acessível teclado. Remover nota "mock ilustrativo".
9. **CTAFinal** — `/diagnostico` + WhatsApp.

## Etapa 4 — Sistema de motion
- Lib: GSAP + ScrollTrigger já instalada (verificar). Criar `src/lib/home-motion.ts` com helpers (revealOnEnter, splitLinesMask, pinHero, horizontalRail, stackCards, counterAnim, footerScrub).
- **Reduced motion**: respeitar `prefers-reduced-motion` em todos os hooks — sem pin, sem auto-avanço, conteúdo estático e visível.
- Âncoras `#o-que-fazemos`, `#como-funciona`, `#diferenciais` com smooth scroll + offset compensando navbar fixo (84px).

## Etapa 5 — QA
- `rg -i "host care|host-care|jornada|simulador"` → 0 hits em texto corrente / links.
- `rg -i "bwild|be wild"` → 0 hits.
- Manual em 1280/768/375: hero pin, lâminas, trilho horizontal, stack, contadores, FAQ, FloatingCTA.
- Console limpo.
- Build passa, parity script passa, sitemap atualizado.

## Detalhes técnicos
- Imagens: usar Unsplash placeholders com pílula `SLOT ·` no canto (componente `SlotBadge`) até troca pelas reais (hero, 6 lâminas, planta, 2 portfólio, poster depoimento).
- Tailwind: estender com tokens `bewild-*` já existentes; criar utilities arbitrárias quando necessário (`bg-[#FBFAF8]` etc.) — preferir tokens.
- GSAP context cleanup em todos os `useEffect`.
- A11y: foco visível, `aria-expanded` em FAQ/dropdown, `aria-current` no nav, `prefers-reduced-motion`.

## Arquivos esperados (estimativa)
- **Criar** (~10): `src/components/home/HeroCinematic.tsx`, `OQueFazemosLaminas.tsx`, `ComoFuncionaPinned.tsx`, `StackCards.tsx`, `ProjetoPersonalizado.tsx`, `DiferenciaisCartao.tsx`, `CredibilidadeCartao.tsx`, `PortfolioPreview.tsx`, `Depoimento.tsx`, `Comparativo.tsx`, `CTAFinal.tsx`, `SlotBadge.tsx`, `src/components/landing/FloatingCTA.tsx`, `src/lib/home-motion.ts`.
- **Reescrever**: `src/pages/HomePage.tsx` (ou `Index.tsx`), `src/components/landing/Footer.tsx` (wordmark gigante + scrub), `src/components/landing/Header.tsx` (afinar tom claro/escuro).
- **Editar**: `index.html` (fontes), `src/index.css` (tokens faltantes + utilities `.bw-*`), `useHashRoute.ts`, `STATIC_ROUTES`, `router.tsx`, `check-routes-parity.mjs`, `public/sitemap.xml`, `supabase/functions/sitemap/index.ts`, `supabase/functions/not-found-check/index.ts`, `content.ts`, `App.tsx` (montar FloatingCTA global).
- **Remover**: `FloatingWhatsAppButton.tsx`, páginas/seções de Host Care / Jornada / Simulador.

## Riscos & decisões pendentes
- **Páginas existentes não-Home** (Diagnóstico, Conteúdos, Portfólio, etc.) **não** serão tocadas neste plano — só herdam o Header/Footer/FloatingCTA atualizados.
- **Vídeo do depoimento**: fica como slot até você enviar o arquivo/embed.
- **Fotos reais**: tudo Unsplash + pílula SLOT até substituição.
- O FAQ vai puxar respostas do que já existe em `FAQSection.tsx` / `FaqPage.tsx`; se alguma das 10 perguntas do mock não tiver correspondência cadastrada, vou listar essas pendências ao final em vez de inventar resposta.
