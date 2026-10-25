# Correções da análise de desempenho — 25/10/2026

Relatório: análise de desempenho do bewild.com.br (25/10/2026). Este arquivo registra o que foi aplicado e o valor anterior do que mudou direto no banco (para desfazer, se preciso).

## No código (este PR)

- Fotos dos blocos da home empacotadas com hash e cache de 1 ano, com largura de 960 px nova e width/height declarados (`src/content/homeSlides.ts`).
- zod fora do pacote inicial: JavaScript que toda página baixa antes de ficar interativa caiu de 300 KB para 276 KB gzip (medido no build).
- gtag.js (GA4 e Google Ads) e GTM baixam depois do `load` e de um momento ocioso.
- Preposição certa no nome do bairro em títulos, H1, descrições e textos das páginas /reforma/<bairro>, nos títulos dos projetos e no llms.txt.
- Link no corpo dos artigos para as páginas de reforma de studio e de apartamento (primeira menção, só em texto corrido).
- Título e descrição de /onde-atuamos e do Índice de custo de reforma.
- robots.txt: AhrefsBot e SemrushBot liberados.

## No banco (já no ar, sem deploy)

Tabela `bewild_posts`, campos `meta_title` e `meta_description`:

| Artigo | meta_title anterior | meta_description anterior |
| --- | --- | --- |
| o-que-e-short-stay | O que é short stay: regras e quanto rende em SP (2026) | Short stay é a locação por temporada de até 90 dias (Lei 8.245/91). O que muda para long stay, o que a lei exige e quanto rende um studio em SP. |
| quanto-tempo-demora-reforma-apartamento | Quanto tempo demora uma reforma? Prazo por m² em contrato | De 60 dias úteis (até 30 m²) a 110 (120 m² com varanda): a tabela do contrato Bewild, o cronograma de um studio data a data e o que atrasa. |
| quanto-custa-reformar-apartamento-studio-ate-50-m2 | Quanto custa reformar um apartamento em SP: 188 contratos | 188 contratos da Bewild em SP: reforma completa de até 50 m² custa R$ 71,9 mil na mediana, ou R$ 2.744/m². Preço por metragem e retorno pós-obra. |
| etapas-de-reforma-de-apartamento-cronograma | Etapas e fases da reforma de apartamento: ordem e cronograma | Seis etapas, da visita técnica à entrega, com o entregável e o responsável de cada uma. O que trava quando a ordem é invertida e onde a obra costuma parar. |
| nbr-16280-reforma-studio-condominio | NBR 16280: o que é e o que o condomínio exige na reforma | A NBR 16280 sem juridiquês: plano de reforma, ART ou RRT, o que o síndico pode pedir, quando a Prefeitura entra e o passo a passo em São Paulo. |
| quanto-custa-bancada-granito-quartzo-studio | Quanto custa bancada de granito ou quartzo no studio | Em 56 de 89 contratos da Bewild, a bancada da construtora ficou. Quando muda: R$ 1 mil a R$ 1,5 mil no banheiro e R$ 1,8 mil a R$ 3 mil na cozinha. |
| aditivo-em-obra-por-que-existe | Aditivo de obra: o que é, quando é legítimo e como evitar | Aditivo nasce de orçamento incompleto, mudança do cliente ou imprevisto do prédio. Quando é legítimo, o que mais gera custo extra de reforma e como evitar. |

Artigo `reforma-de-apartamento-antigo-sao-paulo` reescrito para o posicionamento de unidade recém-entregue (mesma URL): título, meta, resumo, primeiro parágrafo, seção nova "Por que a Bewild só reforma apartamento recém-entregue", fecho "Seu apartamento é novo ou ainda está na planta?" e uma pergunta nova no FAQ. As seções técnicas originais continuam. Título anterior: "Reforma de apartamento antigo em SP: o que verificar em 2026".

## Não aplicado, e por quê

- CSS embutido na home: o `head()` de toda rota vai no pacote inicial, então a folha da home entraria no JavaScript de todas as páginas (testado e desfeito).
- Endereços curtos de projeto (/portfolio/ag, /bf, /ff): são o endereço único de cada projeto e o título já cita prédio, bairro e metragem; trocar o slug exige mudar o banco e o código na mesma publicação, com risco de 404.
- Títulos dos 159 projetos: o gerador de `src/lib/projectSeo.ts` já monta prédio + bairro + metragem quando o título salvo não tem contexto de busca.
- Páginas de bairro: já tinham bairro no H2, FAQ local e alt das fotos.
- Consent Mode v2 (modo avançado): decisão jurídica sob a LGPD.
- Sitemap do domínio antigo na propriedade do Search Console: a conexão é só leitura.

## Incorporação na prévia Lovable

Arquivo recebido incorporado sem publicação. Os números de desempenho e as alterações no banco descritos acima são registros do autor do patch, não medições nem alterações executadas nesta incorporação. Nenhum artigo foi reescrito no banco. O carregamento da tag Google foi unificado e revalida consentimento/rota no momento ocioso; os links comerciais aplicam-se somente ao corpo de artigos, não às licenças.
