/**
 * conteudoData.ts — Fonte estática dos artigos do hub de conteúdo Be Wild.
 *
 * Cada artigo tem:
 * - slug único → rota /conteudos/[slug]
 * - metadados SEO (title, description, canonical, OG image)
 * - JSON-LD Article para GEO / Google Discover
 * - corpo HTML como string (renderizado via dangerouslySetInnerHTML, sanitizado)
 *
 * Para migrar para CMS/Supabase futuramente: basta substituir as funções
 * getConteudo / listConteudos por queries ao banco.
 */

export interface Conteudo {
  slug: string;
  titulo: string;
  categoria: string;
  categoriaColor: string;
  resumo: string;
  tempoLeitura: string;
  dataPublicacao: string;
  dataIso: string; // "2026-06-01" — para JSON-LD datePublished
  cta: string;
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  // Corpo em HTML — use tags semânticas simples: h2, h3, p, ul, li, table, a
  corpoHtml: string;
}

/* ─── Artigos ────────────────────────────────────────────── */
export const CONTEUDOS: Conteudo[] = [
  {
    slug: "studio-short-stay",
    titulo: "Como preparar um studio para short stay: o que muda no projeto?",
    categoria: "Preparação do ativo",
    categoriaColor: "amber",
    resumo:
      "Reformar para morar e preparar para a diária são duas coisas diferentes. Entenda quais decisões de projeto fazem o imóvel performar melhor — e quais são desperdício.",
    tempoLeitura: "6 min",
    dataPublicacao: "Junho 2026",
    dataIso: "2026-06-01",
    cta: "Ler guia",
    seo: {
      title: "Como preparar um studio para short stay | Be Wild",
      description:
        "Guia completo sobre preparação de studio para Airbnb e short stay: materiais, layout, iluminação, pontos de energia e o que realmente impacta a performance operacional.",
      keywords: "studio short stay, reforma airbnb, preparação imóvel aluguel temporada, reforma studio sp",
    },
    corpoHtml: `
<p>A maioria dos proprietários que prepara um imóvel para o short stay começa pelo erro mais caro: tratar a reforma como se fosse para moradia. O critério é o mesmo — "ficou bonito?" — mas o produto é completamente diferente.</p>

<p>Um apartamento para moradia precisa durar décadas com uso moderado. Um studio para short stay precisa durar décadas com uso intenso — e ainda converter bem nas fotos do Airbnb, ser limpo em 45 minutos entre hóspedes, e não gerar chamados de manutenção toda semana.</p>

<h2>O que realmente impacta a performance</h2>

<p><strong>1. Material de piso:</strong> Porcelanato 60×60 acetinado parece bonito na foto, mas ranha com facilidade e mostra cada marca de mala. Imóveis de short stay de alto desempenho em São Paulo usam porcelanato matte ou piso vinílico de alta resistência — durável, fotogênico e mais barato de substituir parcialmente.</p>

<p><strong>2. Layout de circulação:</strong> Em um studio de 25–35m², cada metro quadrado conta. O erro mais comum é posicionar a cama de forma que ela "preencha" o cômodo visualmente — o que é ótimo para sensação de conforto, mas péssimo para foto. A cama sempre deve ser fotografável de pelo menos dois ângulos.</p>

<p><strong>3. Iluminação:</strong> O principal diferencial visual de listings de alto desempenho no Airbnb de São Paulo é iluminação quente e direta. Ponto de luz no teto centralizado é o erro mais comum — iluminação indireta em faixa de LED embutida no forro custa menos e faz diferença brutal nas fotos.</p>

<p><strong>4. Pontos de energia:</strong> Studios para short stay precisam de tomadas em quantidade acima do padrão: ao menos 2 tomadas em cada lado da cama (para carregadores), 2 tomadas na bancada de trabalho, 1 tomada USB embutida próxima à entrada. Hóspedes que viajam a trabalho — perfil dominante nos bairros corporativos de SP — pontuam mal imóveis sem pontos de energia suficientes.</p>

<p><strong>5. Facilidade de limpeza:</strong> Cortinas de tecido são inimigo declarado do short stay. Cada lavagem é uma hora de trabalho. Persianas de blackout ou cortinas de rolo em tecido técnico custam mais na compra e economizam tempo operacional por anos.</p>

<h2>O que pode ser simplificado</h2>
<p>Marmorizado no banheiro, bancada de porcelanito, acabamento de luxo na área de serviço — são investimentos que raramente aparecem nas avaliações de hóspedes. Hóspedes de short stay avaliam: espaço percebido, limpeza, conforto da cama e velocidade do Wi-Fi. Acabamentos premium em áreas de pouca foto têm ROI baixo.</p>

<h2>A diferença que a Be Wild faz</h2>
<p>A Be Wild projeta para o short stay desde a prancha — não adapta projetos residenciais. Isso significa que cada decisão de material, layout e instalação considera os critérios de performance operacional e fotográfica desde o início. O resultado é um imóvel que fotografa melhor, é mais fácil de operar e tem custo de manutenção previsível.</p>

<p class="disclaimer">Este conteúdo é informativo. Cada imóvel tem suas especificidades — o diagnóstico Be Wild considera as características do seu ativo antes de qualquer recomendação.</p>
    `.trim(),
  },
  {
    slug: "short-stay-vale-pena-sp",
    titulo: "Short stay ainda vale a pena em São Paulo? Uma análise sem promessa de renda garantida.",
    categoria: "Short Stay",
    categoriaColor: "gold",
    resumo:
      "Com premissas reais, contexto de mercado e sem prometer renda passiva mágica. O que os dados dizem sobre curta temporada na capital.",
    tempoLeitura: "8 min",
    dataPublicacao: "Junho 2026",
    dataIso: "2026-06-01",
    cta: "Ler análise",
    seo: {
      title: "Short stay ainda vale a pena em SP? Análise 2026 | Be Wild",
      description:
        "Análise realista sobre o mercado de short stay em São Paulo em 2026: ocupação média, receita por bairro, saturação e quando não faz sentido — sem promessa de renda garantida.",
      keywords: "short stay são paulo 2026, airbnb sp vale pena, mercado short stay sp, ocupação airbnb são paulo",
    },
    corpoHtml: `
<p>São Paulo tem aproximadamente 30.000–32.000 listagens ativas no Airbnb em 2026, segundo dados da <a href="https://airbtics.com/annual-airbnb-revenue-in-sao-paulo-brazil-pt" target="_blank" rel="noopener noreferrer">Airbtics (2025)</a>. A pergunta que todo investidor faz é inevitável: o mercado está saturado?</p>

<p>A resposta honesta é: depende de qual parte do mercado você está olhando.</p>

<h2>O que os dados mostram</h2>
<p>A taxa de ocupação mediana em São Paulo está entre 58–62% segundo a <a href="https://thelatinvestor.com/blogs/news/sao-paulo-airbnb" target="_blank" rel="noopener noreferrer">TheLatinvestor (2026)</a>. Isso significa que um imóvel mediano fica ocupado 17–19 noites por mês. Com diária média (ADR) de R$220–R$350 para studios e 1 dormitório em bairros como Pinheiros, Itaim e Vila Madalena, a receita bruta mensal fica em torno de R$3.740–R$6.650.</p>

<p>Mas a média esconde uma distorção importante: os <strong>top performers chegam a 65–75% de ocupação</strong>, enquanto imóveis mal posicionados ficam abaixo de 50%. A diferença não é o bairro — é a qualidade da preparação e da gestão.</p>

<h2>Por que a "saturação" não é o problema real</h2>
<p>Das ~30.000 listagens ativas em SP, a maioria é operada por proprietários individuais sem preparação profissional: fotos medianas, textos automáticos, precificação estática, atendimento lento. Esse é o padrão contra o qual um imóvel profissionalmente preparado compete — e vence com frequência.</p>

<p>Imóveis que combinam preparação voltada para short stay (layout, fotografia, equipamentos) com gestão profissional (precificação dinâmica, listagem otimizada, atendimento 24h) sistematicamente ficam acima da média de ocupação do bairro. Não é garantia — mas é uma vantagem estrutural real.</p>

<h2>Quando o short stay não faz sentido</h2>
<p>Short stay tem custos operacionais maiores que locação convencional: gestora, limpeza entre hóspedes, enxoval, consumíveis, manutenção mais frequente. Imóveis em bairros com baixa demanda de viajantes ou de negócios têm dificuldade de compensar esse custo operacional com diária.</p>

<p>Por isso, o diagnóstico é a etapa mais crítica — antes de reformar ou colocar no Airbnb, é preciso entender se aquele ativo específico tem potencial real para o short stay.</p>

<p class="disclaimer">Dados de mercado são referência de contexto, não projeção individual. Resultado passado não garante resultado futuro. O desempenho de cada imóvel depende de localização, estado, gestão e condições de mercado específicas.</p>
    `.trim(),
  },
  {
    slug: "airbnb-vs-booking",
    titulo: "Airbnb ou Booking? Como os canais de distribuição impactam sua taxa de ocupação.",
    categoria: "Performance",
    categoriaColor: "emerald",
    resumo:
      "Cada plataforma tem perfil de hóspede, algoritmo e taxa diferente. Entenda como a estratégia de canais afeta receita e ocupação.",
    tempoLeitura: "7 min",
    dataPublicacao: "Junho 2026",
    dataIso: "2026-06-01",
    cta: "Ler guia",
    seo: {
      title: "Airbnb vs Booking.com para short stay em SP | Be Wild",
      description:
        "Comparativo completo entre Airbnb e Booking.com para curta temporada em São Paulo: taxas, perfil de hóspede, algoritmo e por que a distribuição multicanal é a estratégia correta.",
      keywords: "airbnb vs booking, distribuição multicanal short stay, taxa airbnb host, booking comissão hospedagem",
    },
    corpoHtml: `
<p>A pergunta "qual plataforma devo usar?" é formulada ao contrário. A pergunta certa é: "qual perfil de hóspede meu imóvel atende melhor — e quais plataformas alcançam esse perfil?"</p>

<h2>Airbnb: força nas estadias de experiência</h2>
<p>O Airbnb tem maior penetração entre viajantes de lazer, turismo e visitantes de curta permanência (1–3 noites). O algoritmo prioriza imóveis com alto número de avaliações positivas recentes, taxa de resposta acima de 90% e preço competitivo frente ao mercado local. Superhost aumenta visibilidade em média 25–30% nos resultados de busca.</p>

<p>A comissão padrão para o anfitrião é de 3% por reserva confirmada (modelo split, onde o hóspede paga mais 14%). Esse modelo é mais favorável ao anfitrião que a maioria das OTAs (Online Travel Agencies).</p>

<h2>Booking.com: força em viagens corporativas e estadias longas</h2>
<p>O Booking tem maior penetração em viagens corporativas, eventos e estadias médias (3–7 noites). A plataforma opera com comissão mais alta (15–17% para hospedagem), mas o volume de busca internacional é significativamente maior — especialmente para São Paulo, que recebe fluxo constante de executivos e congressistas.</p>

<p>Imóveis em bairros corporativos (Itaim Bibi, Vila Olímpia, Brooklin) tipicamente têm melhor performance no Booking que no Airbnb para estadias de semana — o perfil de hóspede de negócios valoriza estabilidade de reserva e sistema de faturamento, não experiência "única".</p>

<h2>Por que a distribuição multicanal é a estratégia correta</h2>
<p>A maior alavanca de ocupação não é escolher a "melhor" plataforma — é estar em múltiplos canais com calendário sincronizado (via PMS como Guesty ou Hostfully) e precificação dinâmica calibrada por demanda. Gestoras que operam em apenas um canal deixam diárias na mesa nas janelas de baixa demanda de cada plataforma.</p>

<p>A BeWild Host Care opera nos dois canais simultaneamente com sincronização automática de calendário e precificação dinâmica ajustada por sazonalidade, eventos em SP e comportamento de demanda em tempo real.</p>

<p class="disclaimer">Taxas e condições das plataformas podem mudar. Consulte os termos atualizados do Airbnb e Booking.com diretamente nas plataformas.</p>
    `.trim(),
  },
  {
    slug: "gestao-propria-vs-profissional",
    titulo: "Gestão própria vs. gestora profissional: o custo real de cada caminho.",
    categoria: "Riscos e comparativos",
    categoriaColor: "rose",
    resumo:
      "Além do percentual de administração, existem custos de tempo, erro, manutenção e oportunidade que raramente aparecem na planilha. Veja a comparação completa.",
    tempoLeitura: "9 min",
    dataPublicacao: "Junho 2026",
    dataIso: "2026-06-01",
    cta: "Ver comparativo",
    seo: {
      title: "Gestão própria vs. gestora profissional de short stay | Be Wild",
      description:
        "Comparativo detalhado entre gerenciar o próprio Airbnb e contratar uma gestora profissional: custos reais, precificação dinâmica, tempo e impacto no ranqueamento.",
      keywords: "gestão própria airbnb, gestora curta temporada sp, vale pena gestora airbnb, custo gestão short stay",
    },
    corpoHtml: `
<p>O raciocínio parece simples: "se a gestora cobra 20–25% da receita, fico com 75–80% gerindo sozinho." O problema é que esse cálculo só compara percentuais — não compara receita total, nem custo operacional real.</p>

<h2>O que a gestão própria realmente custa</h2>

<p><strong>Tempo de atendimento:</strong> Em um imóvel com 18–22 reservas por mês (média de short stay em SP), o proprietário gasta em média 3–5h/semana com mensagens de hóspedes, check-in/out, coordenação de limpeza e resolução de problemas. Nas primeiras semanas, esse número pode dobrar.</p>

<p><strong>Precificação estática:</strong> O maior erro operacional de proprietários independentes é manter preço fixo ou ajustar manualmente com pouca frequência. Ferramentas de precificação dinâmica (PriceLabs, Wheelhouse) ajustam o preço diariamente com base em demanda, eventos e concorrência. A diferença média de receita entre precificação dinâmica e estática em São Paulo é de 15–30%.</p>

<p><strong>Score e visibilidade:</strong> O algoritmo do Airbnb penaliza cancelamentos, atraso em resposta e avaliações abaixo de 4.7. Um proprietário que demora 4h para responder uma mensagem de hóspede (o que é normal em qualquer agenda profissional) já compromete o ranqueamento.</p>

<p><strong>Manutenção reativa:</strong> Sem sistema de triagem de problemas, o proprietário recebe diretamente a pressão de hóspede insatisfeito com chuveiro com pressão baixa às 23h de uma sexta-feira.</p>

<h2>O comparativo real</h2>

<table>
  <thead>
    <tr>
      <th>Critério</th>
      <th>Gestão própria</th>
      <th>Gestora profissional</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Precificação</td><td>Manual/estática</td><td>Dinâmica — diária</td></tr>
    <tr><td>Atendimento</td><td>Proprietário 24h</td><td>Equipe dedicada 24h</td></tr>
    <tr><td>Ranqueamento</td><td>Variável</td><td>Otimizado</td></tr>
    <tr><td>Manutenção</td><td>Reativa</td><td>Preventiva + ágil</td></tr>
    <tr><td>Relatórios</td><td>Manual/nenhum</td><td>Mensal detalhado</td></tr>
    <tr><td>Tempo/semana</td><td>3–8h</td><td>~0h</td></tr>
    <tr><td>Receita vs. média</td><td>Igual ou abaixo</td><td>Acima da média</td></tr>
  </tbody>
</table>

<p>A conta final raramente favorece a gestão própria quando o proprietário considera o custo de oportunidade do seu tempo — especialmente para imóveis com receita potencial acima de R$4.000/mês, onde a taxa de gestão é compensada pela diferença de receita gerada por precificação dinâmica e ranqueamento otimizado.</p>

<p class="disclaimer">Comparativo baseado em dados de mercado e benchmarks de gestão de short stay em São Paulo. Cada imóvel tem especificidades que afetam o resultado final.</p>
    `.trim(),
  },
  {
    slug: "7-erros-short-stay",
    titulo: "Os 7 erros mais comuns de quem prepara imóvel para short stay.",
    categoria: "Preparação do ativo",
    categoriaColor: "amber",
    resumo:
      "De material inadequado a layout que dificulta a limpeza. Erros que parecem pequenos e custam caro na operação — identificados a partir de cases reais.",
    tempoLeitura: "5 min",
    dataPublicacao: "Junho 2026",
    dataIso: "2026-06-01",
    cta: "Ler guia",
    seo: {
      title: "7 erros de quem prepara imóvel para short stay | Be Wild",
      description:
        "Os 7 erros mais comuns na preparação de imóveis para Airbnb: cama fora de posição fotográfica, cortinas de tecido, Wi-Fi mal posicionado, enxoval inadequado e mais.",
      keywords: "erros airbnb, preparação imóvel short stay, reforma studio airbnb, short stay erros comuns",
    },
    corpoHtml: `
<p>Estes erros aparecem repetidamente em imóveis que chegam ao diagnóstico Be Wild já em operação — ou que precisam de reforma antes de começar.</p>

<ul class="erros-list">
  <li>
    <strong>1. Cama fora de posição fotográfica</strong>
    <p>A principal foto do listing precisa mostrar a cama com espaço visual em pelo menos dois lados. Camas encostadas na parede lateral reduzem o espaço percebido e a taxa de clique no anúncio.</p>
  </li>
  <li>
    <strong>2. Cortinas de tecido</strong>
    <p>Cada lavagem leva 45–60 minutos de trabalho de limpeza. Imóveis com cortinas de tecido em todas as janelas acumulam custo operacional invisível que corrói a margem ao longo do tempo.</p>
  </li>
  <li>
    <strong>3. Cozinha sem bancada de trabalho clara</strong>
    <p>Mesmo em studios compactos, hóspedes de short stay avaliam a funcionalidade da cozinha. Bancada escura, sem espaço para trabalho e sem tomadas de fácil acesso é um ponto negativo recorrente em avaliações.</p>
  </li>
  <li>
    <strong>4. Wi-Fi em ponto único central</strong>
    <p>Em studios com laje de concreto armado, o roteador em posição central pode ter sinal fraco no banheiro e na área de serviço. Dois pontos de acesso (um em cada extremidade) eliminam esse problema.</p>
  </li>
  <li>
    <strong>5. Armazenamento insuficiente</strong>
    <p>Hóspedes de mais de 3 noites precisam de espaço para malas abertas, roupas e itens de higiene. Imóveis sem armário de corpo inteiro ou sem espaço embaixo da cama têm avaliações piores em estadias médias.</p>
  </li>
  <li>
    <strong>6. Ausência de blackout no quarto</strong>
    <p>São Paulo tem bairros com intensa iluminação noturna. Imóveis sem cortina blackout ou persiana opaca recebem reclamações consistentes de hóspedes. Custo da solução: R$300–R$600 por janela.</p>
  </li>
  <li>
    <strong>7. Ignorar o enxoval</strong>
    <p>Enxoval de qualidade — lençol 200 fios, toalha densa, fronha sem marcas — é o item mais mencionado positivamente em reviews de 5 estrelas. É também o item mais ignorado por proprietários que tentam cortar custo na preparação.</p>
  </li>
</ul>

<p class="disclaimer">Levantamento baseado em visitas técnicas e diagnósticos realizados pela equipe Be Wild. Cada imóvel é avaliado individualmente.</p>
    `.trim(),
  },
  {
    slug: "bairros-sp-short-stay",
    titulo: "Pinheiros, Vila Madalena e Consolação: qual bairro tem mais potencial para short stay?",
    categoria: "Bairros de SP",
    categoriaColor: "violet",
    resumo:
      "Análise comparativa com dados de demanda, perfil de hóspede, concorrência e sazonalidade nos bairros mais buscados de São Paulo.",
    tempoLeitura: "7 min",
    dataPublicacao: "Junho 2026",
    dataIso: "2026-06-01",
    cta: "Ver análise",
    seo: {
      title: "Short stay em Pinheiros, Vila Madalena e Consolação | Be Wild",
      description:
        "Análise de potencial para short stay nos principais bairros de São Paulo: Pinheiros, Vila Madalena, Consolação, Itaim Bibi, Brooklin. Dados de ocupação, ADR e perfil de hóspede.",
      keywords: "short stay pinheiros sp, airbnb vila madalena, consolação aluguel temporada, bairros sp short stay potencial",
    },
    corpoHtml: `
<p>São Paulo tem bairros com perfis muito distintos de demanda para short stay. Entender o perfil de cada um ajuda a calibrar expectativas de diária, ocupação e tipo de hóspede — antes de reformar ou colocar no mercado.</p>

<h2>Pinheiros</h2>
<p>Um dos bairros com maior demanda de short stay em São Paulo. Combina público de lazer (restaurantes, bares, cultura) com demanda corporativa (proximidade da Faria Lima). O perfil de hóspede é diversificado — viajante nacional de final de semana, executivo de passagem e nômade digital. ADR de referência para studios bem preparados: R$260–R$340/noite. Ocupação de top performers: 65–73%.</p>
<p>O mercado de Pinheiros é competitivo e relativamente maduro. Imóveis sem diferenciação visual e operacional ficam no meio do pack. Com preparação profissional e gestão ativa, a diferença de receita entre o median e o top performer pode ser de R$1.500–R$2.500/mês em um mesmo bairro.</p>

<h2>Vila Madalena</h2>
<p>Bairro com forte apelo de lazer e cultura. O perfil dominante é viajante de final de semana — grupos pequenos, casais, turismo cultural. Isso significa pico de ocupação forte às sextas, sábados e domingos, e janela mais fraca de segunda a quinta. Imóveis com capacidade para 3–4 hóspedes performam especialmente bem aqui.</p>
<p>A sazonalidade de Vila Madalena é mais marcada que Pinheiros — eventos culturais (shows no Carioca, festivais de rua) criam picos de demanda que multiplicam a diária. Gestão com precificação dinâmica é especialmente importante para capturar esses picos.</p>

<h2>Consolação</h2>
<p>Bairro de transição entre o centro expandido e Higienópolis. Demanda mista: estudantes de passagem, público de eventos na Paulista (congressos, shows) e hóspedes de custo-benefício que querem proximidade da Paulista sem pagar o ticket de Jardins. ADR menor que Pinheiros — mas mercado menos saturado em imóveis de qualidade.</p>
<p>O potencial de Consolação está sub-explorado. Studios compactos (22–30m²) bem preparados nessa região têm menor custo de preparação e competem em nicho menos disputado — o que pode resultar em melhor relação investimento/retorno que bairros mais valorizados.</p>

<h2>Qual tem mais potencial?</h2>
<p>Depende do imóvel e do objetivo do proprietário. Para maximizar receita bruta em imóvel já preparado: Pinheiros e Itaim Bibi. Para melhor relação investimento/retorno com imóvel a preparar: Consolação e Vila Mariana. Para demanda de negócios com alta ocupação de semana: Vila Olímpia e Brooklin.</p>
<p>O diagnóstico Be Wild avalia o potencial específico do seu ativo considerando bairro, metragem, estado atual e perfil de imóvel — sem generalizar por bairro.</p>

<p class="disclaimer">Dados de referência baseados em <a href="https://airbtics.com/annual-airbnb-revenue-in-sao-paulo-brazil-pt" target="_blank" rel="noopener noreferrer">Airbtics (2025)</a> e <a href="https://thelatinvestor.com/blogs/news/sao-paulo-airbnb" target="_blank" rel="noopener noreferrer">TheLatinvestor (2026)</a>. Resultado passado não garante resultado futuro.</p>
    `.trim(),
  },
];

/* ─── Helpers ────────────────────────────────────────────── */
export function getConteudo(slug: string): Conteudo | undefined {
  return CONTEUDOS.find((c) => c.slug === slug);
}

export function listConteudos(): Conteudo[] {
  return CONTEUDOS;
}

/** Mapa de cores por categoria para uso nos cards */
export const CATEGORIA_COLOR_MAP: Record<string, string> = {
  amber: "text-amber-600 border-amber-300/50 bg-amber-50",
  gold: "text-bewild-gold border-bewild-gold/30 bg-bewild-gold/8",
  emerald: "text-emerald-600 border-emerald-300/50 bg-emerald-50",
  rose: "text-rose-500 border-rose-300/50 bg-rose-50",
  violet: "text-violet-500 border-violet-300/50 bg-violet-50",
};
