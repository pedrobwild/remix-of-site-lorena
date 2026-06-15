## Fase 1 · Página `/diagnostico` no visual Bewild v4

Escopo restrito: **apenas** `src/pages/DiagnosticoPage.tsx` e um CSS isolado novo. Navbar (`BewildSiteNav`) e Footer continuam como estão. Banco fica para a Fase 2.

### O que muda
Hoje a página usa o sistema antigo (foto de fundo + acento dourado `#DCBE7A`, fonte "BeWild"). Vou substituir pelo layout do anexo: hero escuro navy em 2 colunas, com pitch à esquerda (eyebrow "Diagnóstico Bewild", título, subtítulo, "O que entregamos" em pílulas, "Como funciona em 5 passos" em lista, 4 cards de stats, e botão "Prefiro falar com um especialista" com ícone SVG) e card de formulário branco à direita, sticky no desktop, empilhado no mobile.

### Arquivos
- **`src/styles/bw-diag.css`** (novo) — tokens e classes prefixados `.bw-diag` espelhando o CSS do anexo (navy/cyan/sand, gradiente do hero, pílulas, steps, stats, form card sticky). Isolado, não vaza para outras rotas.
- **`src/pages/DiagnosticoPage.tsx`** (reescrito) — importa `bw-diag.css`, mantém `<BewildSiteNav />` e `<Footer />`, hospeda o markup do anexo. Mantém estado do formulário, máscara de WhatsApp, validação de obrigatórios (Nome + WhatsApp), seleção única dos grupos de chips, e a chamada atual ao `supabase.from("diagnostic_leads").insert(...)`. **Não troco a tabela nesta fase** — só Fase 2 ajusta isso conforme o spec do prompt.
- **`src/main.tsx` ou similar**: nenhum ajuste; o CSS é importado direto na página.

### Conformidade com guardrails
- Grafia "Bewild" em todos os textos (eyebrow, SEO title, mensagem WhatsApp).
- Zero emoji. Ícones em SVG inline (seta do CTA, ícone de chat do "Prefiro falar com um especialista", asterisco de obrigatório).
- Reuso do `BewildSiteNav` e do `Footer` existentes — sem duplicar header/footer do anexo.
- Nenhuma outra rota tocada.

### SEO
- Atualizo `useSeo` para `title: "Diagnóstico Bewild · Análise inicial do seu studio"` e descrição reescrita com a grafia correta. Canonical e JSON-LD permanecem.

### Fora desta fase (Fase 2, separada)
- Criar tabela `leads` conforme spec, RLS pública para insert e leitura só autenticada.
- Trocar o `insert` em `diagnostic_leads` por `leads` ou consolidar.
- Painel `/admin/leads` (não construir; só sinalizado).

Depois que você aprovar, implemento só a Fase 1 e te aviso pra rodar a Fase 2.