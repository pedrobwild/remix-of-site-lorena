/**
 * Pré-renderiza /guia-do-investidor.
 *
 * Gera, depois do build, dist/guia-do-investidor/index.html (mais o irmão
 * dist/guia-do-investidor.html) com <head> completo (título, descrição,
 * keywords, canonical, Open Graph, Twitter e JSON-LD Article + Breadcrumb +
 * FAQPage) e um corpo semântico dentro de <div id="root"> para crawlers que
 * não executam JS. O corpo espelha o texto real das seções renderizadas em
 * src/guia/components/guide/ (mesmos ids de âncora, listas e tabelas).
 * O React substitui o corpo ao montar.
 *
 * Título, descrição, datas, FAQ, JSON-LD, tabela de bairros e checklist vêm
 * dos MESMOS módulos que a SPA usa (src/guia/data/guiaMeta.ts, bairros.ts e
 * checklist.ts) — dado puro, sem alias "@/", para rodar aqui em Node. Assim o
 * HTML servido ao crawler e a página montada nunca divergem.
 *
 * O JSON-LD sai marcado com data-seo-managed="true": o useSeo da SPA remove
 * os blocos marcados antes de inserir os seus, sem duplicar dados estruturados.
 *
 * NUNCA pode quebrar o build: qualquer falha apenas imprime um aviso.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";
import {
  GUIA_DESCRIPTION,
  GUIA_FAQ,
  GUIA_H1,
  GUIA_KEYWORDS,
  GUIA_PATH,
  GUIA_TITLE,
  GUIA_URL,
  guiaJsonLd,
} from "../src/guia/data/guiaMeta";
import { BAIRROS_ORDENADOS, FAIXAS_METRAGEM, ROI_AVISO } from "../src/guia/data/bairros";
import { CHECKLIST_ITEMS, textoFaixasChecklist } from "../src/guia/data/checklist";
import { fmtBRL, fmtPct } from "../src/guia/lib/format";

/* ────────────────────────────────────────────────────────────────
   Corpo pré-renderizado — uma <section> por seção do guia, na mesma
   ordem e com os mesmos ids usados em src/guia/components/guide/
   (TableOfContents / SECTIONS). O texto é copiado dos componentes.
   ──────────────────────────────────────────────────────────────── */

type Bloco =
  | { tipo: "p"; texto: string }
  | { tipo: "h3"; texto: string }
  | { tipo: "ul"; itens: string[] }
  | { tipo: "table"; cabecalho: string[]; linhas: string[][] }
  | { tipo: "links"; itens: Array<{ href: string; label: string }> };

type Secao = { id: string; h2: string; blocos: Bloco[] };

/** Tabela de bairros — gerada da mesma base da tela (src/guia/data/bairros.ts). */
const TABELA_BAIRROS: Bloco = {
  tipo: "table",
  cabecalho: ["Bairro", "Diária mín.", "Diária máx.", "Ocupação média", ...FAIXAS_METRAGEM],
  linhas: BAIRROS_ORDENADOS.map((b) => [
    b.nome,
    fmtBRL(b.mercado.diariaMin),
    fmtBRL(b.mercado.diariaMax),
    fmtPct(b.mercado.ocupacao),
    ...FAIXAS_METRAGEM.map((f) => {
      const v = b.mercado.diariaPorMetragem?.[f];
      return v === undefined ? "—" : fmtBRL(v);
    }),
  ]),
};

const SECOES: Secao[] = [
  {
    id: "mapa-bairros",
    h2: "Mapa de Bairros",
    blocos: [
      {
        tipo: "p",
        texto:
          "Mapa interativo de bairros rentáveis de São Paulo: demanda, diária praticada, ocupação observada e faixas de receita por metragem (20–25 m², 26–35 m² e 36–50 m²). O mapa mostra metrô, pontos de interesse e mapa de calor de demanda.",
      },
      {
        tipo: "p",
        texto:
          `O ranking de rentabilidade ordena os bairros por ROI estimado, diária média, ocupação ou menor competição. Cada bairro exibe o número aproximado de studios no Airbnb, a faixa de diária em R$/noite, a ocupação média e a receita mensal de referência (diária média × 30 × ocupação, antes de custos). ${ROI_AVISO}`,
      },
      {
        tipo: "p",
        texto:
          "A comparação permite selecionar até 3 bairros e confrontar diária média, faixa de diária, ocupação, ROI estimado, receita mensal, anúncios ativos, perfil de demanda e competição.",
      },
      { tipo: "h3", texto: "Diária e ocupação por bairro" },
      TABELA_BAIRROS,
      {
        tipo: "p",
        texto:
          "Faixas observadas de diária (R$/noite) e ocupação média de studios por bairro. “—” = a base não traz o recorte por metragem para o bairro.",
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/melhores-bairros-short-stay-sao-paulo", label: "Os melhores bairros para short stay em São Paulo em 2026" },
          { href: "/conteudos/o-que-e-short-stay", label: "O que é short stay: definição, regras e números de São Paulo" },
        ],
      },
    ],
  },
  {
    id: "mercado",
    h2: "Mercado e Precificação — São Paulo",
    blocos: [
      {
        tipo: "p",
        texto:
          "Diárias médias, ocupação e receita por bairro. Na ferramenta, escolha o bairro, a metragem, o nível de decoração (Básico, Premium ou Alto padrão) e a ocupação estimada para ver diária mínima, diária máxima, receita por mês e receita por ano.",
      },
      {
        tipo: "p",
        texto:
          "Metodologia de cálculo: a diária mínima e máxima são faixas observadas para studios do bairro selecionado, baseadas em dados de mercado. O multiplicador de decoração ajusta a faixa: Básico (1,0×) mantém valores base, Premium (1,2×) reflete studios com acabamento e fotos acima da média, Alto padrão (1,45×) reflete studios com design autoral e operação profissional. A metragem aplica ajuste adicional: studios abaixo de 25 m² recebem -8% e acima de 35 m² recebem +8%.",
      },
      {
        tipo: "p",
        texto:
          "Como os dados são coletados: dados de mercado coletados e cruzados pela Bewild a partir de bases do setor (AirDNA, plataformas de reserva, dados públicos de anúncios ativos). Os valores representam médias trimestrais e são atualizados periodicamente para refletir a dinâmica real do mercado paulistano.",
      },
      {
        tipo: "p",
        texto:
          "Limitações: valores são estimativas baseadas em médias de mercado e não constituem garantia de resultado. Resultados reais dependem de fatores como execução da reforma, qualidade das fotos, gestão operacional, sazonalidade, concorrência local e posicionamento na plataforma. Use como referência para tomada de decisão, não como projeção financeira definitiva.",
      },
      {
        tipo: "p",
        texto:
          "Para alcançar o topo da faixa, priorize: marcenaria planejada + iluminação cênica + fotos profissionais. Esses 3 fatores combinados podem elevar sua diária em até 40%.",
      },
    ],
  },
  {
    id: "escolha-ativo",
    h2: "Como Avaliar a Unidade",
    blocos: [
      {
        tipo: "p",
        texto: "Nem todo studio é bom para short stay. Use este framework para avaliar antes de comprar.",
      },
      { tipo: "h3", texto: "Prédio" },
      {
        tipo: "ul",
        itens: [
          "Permite short stay (sem restrição em convenção)",
          "Portaria 24h ou controle de acesso",
          "Áreas comuns relevantes (academia, coworking, lavanderia)",
          "Bom estado de conservação e manutenção",
          "Vizinhança sem histórico de reclamações contra locação curta",
        ],
      },
      { tipo: "h3", texto: "Unidade" },
      {
        tipo: "ul",
        itens: [
          "Metragem eficiente (20–40 m²)",
          "Planta inteligente (sem corredores desperdiçados)",
          "Boa insolação e ventilação natural",
          "Andar alto ou posição com menos ruído",
          "Banheiro com ventilação (janela ou exaustão)",
          "Varanda ou sacada (diferencial competitivo)",
        ],
      },
      { tipo: "h3", texto: "Localização" },
      {
        tipo: "ul",
        itens: [
          "Próximo a metrô ou transporte público",
          "Bairro com demanda comprovada para short stay",
          "Comércio, restaurantes e serviços a pé",
          "Região percebida como segura",
          "Mercado não saturado (concorrência saudável)",
        ],
      },
      {
        tipo: "p",
        texto:
          "A pontuação classifica o ativo: de 0 a 5, alto risco — a unidade tem gaps importantes, revise antes de avançar. De 6 a 9, potencial com ressalvas — há oportunidade, mas itens críticos precisam de atenção. De 10 a 13, boa oportunidade — ativo sólido, foque nos itens pendentes para maximizar retorno. De 14 a 16, excelente ativo — perfil ideal para short stay, avance com confiança.",
      },
      {
        tipo: "h3",
        texto: "Operação vs. Revenda: ativo certo para cada objetivo",
      },
      {
        tipo: "p",
        texto:
          "Bom para operação (gera receita mensal alta e consistente): planta eficiente e fácil de mobiliar; bairro com demanda real de hóspedes; condomínio acessível e que permite short stay; fácil de decorar com investimento controlado; preço de aquisição permite yield saudável.",
      },
      {
        tipo: "p",
        texto:
          "Bom para revenda (valoriza no longo prazo mas pode render pouco): localização premium com valorização histórica; acabamento de alto padrão e marca do incorporador; metragem generosa (pode reduzir eficiência/m²); condomínio alto que comprime margem operacional; demanda de hóspedes pode não justificar o ADR necessário.",
      },
      {
        tipo: "p",
        texto:
          "Metragem ideal e eficiência de planta: a faixa 25–35 m² é o sweet spot para short stay em São Paulo. Abaixo de 25 m², o espaço limita a experiência (especialmente para estadias acima de 3 noites). Acima de 40 m², o custo de aquisição e condomínio sobe sem proporcional aumento na diária. Eficiência de planta: priorize unidades onde a área útil é maximizada — sem corredores longos, com cozinha integrada e banheiro compacto mas funcional. Uma planta de 28 m² bem desenhada pode performar melhor que uma de 35 m² com layout ruim. Regra prática: se a cama, mesa de trabalho, sofá (ou banco) e armário cabem sem comprometer circulação, a planta é eficiente.",
      },
      {
        tipo: "p",
        texto:
          "Restrições de condomínio: a convenção do condomínio é o documento decisivo. Busque cláusulas sobre “locação por temporada”, “hospedagem” ou “uso residencial exclusivo”. Se a convenção é silente sobre o tema, há espaço legal para operar — mas isso pode mudar em assembleia. Sinais de alerta: proibição explícita de locação por período inferior a 30 dias, histórico de multas a proprietários que operam short stay, ou assembleia recente que deliberou contra. Sinais positivos: outros proprietários já operando no Airbnb, administradora receptiva, e prédio com perfil de investidores (não apenas moradores).",
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/como-avaliar-studio-antes-de-comprar", label: "Como avaliar um studio antes de comprar: 16 critérios em 3 blocos" },
          { href: "/conteudos/o-que-perguntar-ao-sindico-antes-de-reformar", label: "O que perguntar ao síndico antes de reformar um studio" },
          { href: "/conteudos/studios-airbnb-sao-paulo-o-que-a-lei-permite", label: "Condomínio pode proibir Airbnb? O que o STJ decidiu" },
        ],
      },
    ],
  },
  {
    id: "rentabilidade",
    h2: "A Matemática do Investimento",
    blocos: [
      {
        tipo: "p",
        texto: "Entenda como a conta é formada antes de abrir o simulador. Receita bruta ≠ o que vai para o bolso.",
      },
      { tipo: "h3", texto: "Da receita bruta ao bolso: a cascata do retorno" },
      {
        tipo: "table",
        cabecalho: ["Etapa", "Referência", "Valor (exemplo)"],
        linhas: [
          ["Receita bruta", "ADR × noites ocupadas/mês", "R$ 9.000"],
          ["Comissão plataforma", "~15% (Airbnb + processamento)", "- R$ 1.350"],
          ["Gestão operacional", "~18% (se terceirizada)", "- R$ 1.620"],
          ["Limpeza por virada", "~R$ 100/virada × ~8 viradas/mês", "- R$ 800"],
          ["Condomínio", "Custo fixo mensal", "- R$ 500"],
          ["IPTU + Utilidades", "Luz, água, internet, gás", "- R$ 500"],
          ["Impostos", "~6% (Simples/MEI)", "- R$ 540"],
          ["Receita líquida", "O que sobra no bolso", "R$ 3.690"],
        ],
      },
      {
        tipo: "p",
        texto:
          "Exemplo baseado em studio de 30 m² em Pinheiros, ADR R$ 350, ocupação 75%. Valores reais variam por unidade e operação.",
      },
      { tipo: "h3", texto: "Cenários de retorno" },
      {
        tipo: "p",
        texto: "O cenário base é o mais provável para uma operação bem executada. Cenário conservador: primeiros meses, baixa temporada ou bairro menos aquecido. Cenário otimista: studio premium, fotos profissionais, preço dinâmico e localização top.",
      },
      {
        tipo: "table",
        cabecalho: ["Cenário", "Ocupação", "Diária média", "Receita bruta/mês", "Receita líquida/mês", "Yield anual", "Payback estimado"],
        linhas: [
          ["Conservador", "65%", "R$ 280", "R$ 5.460", "R$ 1.200", "~5%", "~14 anos"],
          ["Base", "75%", "R$ 350", "R$ 7.875", "R$ 2.560", "~8%", "~8 anos"],
          ["Otimista", "85%", "R$ 420", "R$ 10.710", "R$ 4.100", "~12%", "~5 anos"],
        ],
      },
      { tipo: "h3", texto: "O que mais mexe no retorno" },
      {
        tipo: "ul",
        itens: [
          "Ocupação (impacto alto): cada 5pp de ocupação = ~R$ 500/mês de receita bruta",
          "Diária média — ADR (impacto alto): cada R$ 50 a mais na diária = ~R$ 1.125/mês bruto a 75% de ocupação",
          "Condomínio (impacto médio): custo fixo que não escala — condomínios acima de R$ 1.200 comprimem margem",
          "Gestão + Limpeza (impacto médio): operação própria economiza ~25%, mas exige tempo e processo",
        ],
      },
      {
        tipo: "p",
        texto:
          "O segredo está na composição, não em um fator isolado: um studio com ADR médio mas 85% de ocupação pode render mais que um com diária alta e 60% de ocupação. Da mesma forma, um condomínio barato em bairro bom pode compensar uma diária menor. Use o simulador para testar seus cenários específicos.",
      },
      { tipo: "h3", texto: "ROI vs. Yield: qual métrica usar" },
      {
        tipo: "ul",
        itens: [
          "Yield bruto = receita anual bruta ÷ valor do imóvel. Útil para comparações rápidas entre ativos e regiões. Não considera custos operacionais.",
          "Yield líquido = receita anual líquida ÷ valor do imóvel. Mais realista, mas depende de premissas de custo que variam por operação.",
          "ROI (Return on Investment) = lucro líquido ÷ capital investido total (inclui reforma, mobília, ITBI). É a métrica mais completa, mas exige dados detalhados de implantação.",
          "Payback = capital investido ÷ lucro líquido mensal. Indica em quantos meses o investimento se paga. Para short stay em SP, paybacks entre 5 e 10 anos são considerados saudáveis.",
        ],
      },
      { tipo: "h3", texto: "Custos que investidores iniciantes esquecem" },
      {
        tipo: "ul",
        itens: [
          "ITBI: ~3% do valor do imóvel na compra",
          "Registro e escritura: ~1,5% adicional",
          "Fundo de reserva: cobrado em muitos condomínios além da taxa ordinária",
          "Reposição de enxoval: toalhas, roupas de cama e itens de cozinha a cada 6–12 meses",
          "Manutenção corretiva: ~5% da receita anual para reparos inesperados",
          "Vacância sazonal: janeiro e períodos entre feriados podem ter ocupação 20–30% menor",
        ],
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/quanto-rende-studio-short-stay-sao-paulo", label: "Quanto rende um studio no short stay em São Paulo: a conta linha a linha" },
          { href: "/conteudos/custos-de-operar-studio-short-stay", label: "Receita bruta não é lucro: a cascata de custos de um studio" },
          { href: "/conteudos/como-declarar-renda-airbnb-imposto-de-renda", label: "Como declarar a renda de Airbnb no imposto de renda" },
        ],
      },
    ],
  },
  {
    id: "simulador",
    h2: "Simulador de Receita",
    blocos: [
      { tipo: "p", texto: "Calcule sua rentabilidade estimada em menos de 1 minuto." },
      {
        tipo: "p",
        texto:
          "Informe bairro, metragem, ocupação estimada, diária atual (opcional — se não informar, usamos a média do bairro para a faixa de metragem do studio) e o objetivo: maximizar receita (+5 p.p. de ocupação), estabilidade de ocupação (−10% na diária) ou posicionamento premium (−10 p.p. de ocupação e +20% na diária). A ocupação e a diária consideradas aparecem no resultado. Se informar o orçamento de reforma, o simulador calcula o payback da reforma.",
      },
      {
        tipo: "p",
        texto:
          "Como funciona o rate boost: o cenário base usa a diária média do bairro para a faixa de metragem do seu studio (ou a sua diária atual, se informada), já com o ajuste do objetivo escolhido. +10% = decoração básica melhorada (pintura, iluminação, enxoval novo). +20% = decoração premium com fotos profissionais e mobília planejada. +30% = studio de alto padrão com design autoral, fotos de catálogo e operação otimizada. Cada nível já inclui os itens do anterior, e o percentual é o aumento total sobre a diária base — os níveis não se somam.",
      },
      {
        tipo: "p",
        texto:
          "O que o payback considera: o cálculo é simplificado — Payback = Orçamento de reforma ÷ Receita incremental mensal (diferença entre o cenário com aumento de diária e o cenário base, com a mesma ocupação e o mesmo objetivo). Sem aumento de diária não há receita incremental, e o payback não é calculado. Não inclui custos operacionais como limpeza (~R$ 80–120/virada), taxa da plataforma (~15%), condomínio, IPTU ou imposto de renda. Para uma projeção completa, solicite um diagnóstico personalizado.",
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/o-que-esta-incluso-orcamento-reforma-studio", label: "O que está incluso (e o que não está) num orçamento de reforma de studio" },
          { href: "/conteudos/como-comparar-orcamentos-de-reforma", label: "Como comparar orçamentos de reforma sem cair em armadilha" },
          { href: "/conteudos/reforma-turn-key-ou-tradicional", label: "Reforma turn-key ou tradicional: a planilha de custo total" },
        ],
      },
    ],
  },
  {
    id: "reservas",
    h2: "O que realmente move reservas",
    blocos: [
      { tipo: "p", texto: "Os 6 fatores que transformam um studio vazio em máquina de reservas." },
      {
        tipo: "ul",
        itens: [
          "Limpeza — fator #1 global: 90% dos hóspedes consideram limpeza o critério mais importante na escolha. Limpeza impecável = reviews 5 estrelas.",
          "Check-in sem atrito — fechadura digital ou key box eliminam esperas e reclamações. Hóspedes corporativos chegam tarde — check-in autônomo é decisivo.",
          "Precisão do anúncio — fotos reais, descrição honesta e expectativa alinhada. Anúncios que entregam o que prometem têm 2x menos cancelamentos.",
          "Avaliações e nota — acima de 4,8 você entra no topo das buscas. Cada 0,1 ponto acima de 4,5 pode aumentar sua taxa de conversão em até 12%.",
          "Segurança e acessibilidade — portaria 24h, câmeras em áreas comuns, boa iluminação. Casais e turistas solo priorizam segurança acima do preço.",
          "Ambiente + trabalho + entretenimento — Wi-Fi rápido, mesa de trabalho, smart TV e boa acústica. Para estadias de 3+ dias, o setup do ambiente define a experiência.",
        ],
      },
      {
        tipo: "p",
        texto:
          "Como interpretar esses drivers: cada driver tem peso diferente por persona. Executivos priorizam check-in rápido e Wi-Fi estável para reuniões. Turistas priorizam localização e experiência visual. Estudantes valorizam preço e avaliações de outros hóspedes. Use os filtros de persona para ver a priorização e adapte seu studio ao público dominante do bairro.",
      },
      {
        tipo: "p",
        texto:
          "Como aplicar na prática: priorize os 3 primeiros drivers da persona dominante do seu bairro. Em Pinheiros (público misto executivo/turista), foque em limpeza impecável + check-in digital + fotos reais. Em Vila Mariana (mais estudantes e casais), priorize avaliações altas + preço competitivo + ambiente confortável para estadias longas. O segredo é alinhar produto e operação ao perfil real de quem reserva na sua região.",
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/o-que-move-reservas-studio-airbnb", label: "O que faz o hóspede escolher o seu studio: 6 fatores e 4 perguntas" },
          { href: "/conteudos/preparar-studio-airbnb-checklist", label: "Como preparar um studio para Airbnb: o que muda na diária" },
        ],
      },
    ],
  },
  {
    id: "reforma",
    h2: "Reforma Inteligente",
    blocos: [
      { tipo: "p", texto: "Quanto investir, onde priorizar e o que gera mais retorno por m²." },
      { tipo: "h3", texto: "Piso (25 m²): vinílico ou porcelanato" },
      {
        tipo: "table",
        cabecalho: ["Item", "Vinílico (R$/m²)", "Vinílico (subtotal)", "Porcelanato (R$/m²)", "Porcelanato (subtotal)"],
        linhas: [
          ["Material", "R$ 66", "R$ 1.650", "R$ 110", "R$ 2.750"],
          ["Instalação", "R$ 25", "R$ 625", "R$ 85", "R$ 2.125"],
          ["Preparação", "R$ 12", "R$ 300", "R$ 40", "R$ 1.000"],
          ["Total", "—", "R$ 2.575", "—", "R$ 5.875"],
        ],
      },
      {
        tipo: "p",
        texto:
          "Diferença: +R$ 3.300 pelo porcelanato. Para short stay, vinílico oferece melhor custo-benefício e resistência a riscos.",
      },
      {
        tipo: "p",
        texto:
          "Por que vinílico vence no ROI: o vinílico custa 56% menos que porcelanato, tem instalação mais rápida (1–2 dias vs 3–5 dias) e é visualmente indistinguível em fotos de anúncio. Para short stay, onde o hóspede fica 2–5 dias, a percepção de qualidade é a mesma. Além disso, vinílico é mais silencioso, confortável ao pisar e mais fácil de reparar em caso de dano pontual — basta trocar uma régua.",
      },
      {
        tipo: "p",
        texto:
          "Quando porcelanato faz sentido: em áreas molhadas (banheiro, cozinha aberta com pia) onde a resistência à água é crítica. Também faz sentido em studios de alto padrão (diária acima de R$ 400) onde o investimento adicional é compensado pela diária mais alta e pelo público-alvo que percebe a diferença. Se o condomínio já tem porcelanato em bom estado, não troque — aproveite.",
      },
      { tipo: "h3", texto: "Marcenaria" },
      {
        tipo: "p",
        texto: "Armários fechados: R$ 24.000 (mais proteção). Armários abertos / nichos: R$ 19.000 (mais estético).",
      },
      {
        tipo: "p",
        texto:
          "Marcenaria é o que aparece no anúncio: equilibre estética e funcionalidade. Armários fechados protegem itens dos hóspedes, mas abertos com iluminação fotografam melhor e geram mais cliques.",
      },
      { tipo: "h3", texto: "Iluminação vs. bancada" },
      {
        tipo: "p",
        texto:
          "Iluminação LED completa (marcenaria + teto + fitas): R$ 2.800 — melhor ROI. Trocar bancadas (quartzo, demolição + material 2,8–3,2 m): R$ 5.200 — custo elevado.",
      },
      {
        tipo: "p",
        texto:
          "Decisão do investidor: iluminação gera impacto visual desproporcional ao custo — transforma fotos, eleva percepção de qualidade e custa quase metade da troca de bancada. Priorize iluminação sempre.",
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/piso-vinilico-ou-porcelanato-studio", label: "Piso vinílico ou porcelanato no studio para alugar: o que a conta diz" },
          { href: "/conteudos/quanto-custa-reformar-studio-short-stay-sao-paulo", label: "Quanto custa reformar um studio em São Paulo em 2026" },
          { href: "/conteudos/cronograma-reforma-studio-60-dias-uteis", label: "Cronograma de uma reforma de studio: 60 dias úteis, semana a semana" },
        ],
      },
    ],
  },
  {
    id: "antichecklist",
    h2: "Anti-checklist: O que NÃO fazer",
    blocos: [
      { tipo: "p", texto: "Erros que destroem rentabilidade — aprenda antes de cometer." },
      {
        tipo: "ul",
        itens: [
          "Aproveite bancadas da construtora — trocar bancadas novas custa R$ 5.000+ e raramente muda a percepção do hóspede. Troque apenas se estiverem danificadas ou com padrão muito datado.",
          "Cuidado com integração de sacada — custo a partir de R$ 8.000 + riscos com regras do condomínio. Avalie se o ganho de espaço justifica o investimento e verifique a convenção antes.",
          "Não mexa no revestimento do banheiro — remover revestimento original pode comprometer a impermeabilização (garantia geralmente de 5 anos). Risco de infiltração e custos imprevisíveis.",
          "Evite demolições e alterações de instalações — prefira resolver com marcenaria e layout inteligente. Mover pontos hidráulicos ou elétricos encarece e atrasa. Trabalhe com a planta existente.",
        ],
      },
      {
        tipo: "p",
        texto:
          "Economia pode chegar a 30% no custo total: ao evitar demolições desnecessárias e priorizar marcenaria + layout, investidores experientes economizam até 30% do orçamento de reforma — dinheiro que vai direto para decoração e fotos, onde o retorno é comprovado.",
      },
      { tipo: "h3", texto: "Detalhamento dos custos evitáveis" },
      {
        tipo: "table",
        cabecalho: ["Item evitável", "Custo médio", "Alternativa inteligente", "Economia"],
        linhas: [
          ["Trocar bancadas novas", "R$ 5.200", "Manter originais da construtora", "R$ 5.200"],
          ["Integrar sacada", "R$ 8.000+", "Decorar sacada como espaço funcional", "R$ 7.000+"],
          ["Remover revestimento banheiro", "R$ 6.000+", "Pintura epóxi ou adesivos sobre o existente", "R$ 5.000+"],
          ["Mover pontos hidráulicos", "R$ 4.000+", "Trabalhar com a planta existente", "R$ 4.000+"],
        ],
      },
      {
        tipo: "p",
        texto:
          "Quando SIM faz sentido demolir: apenas quando o layout atual impede a funcionalidade básica do studio (ex.: cozinha inacessível, banheiro sem ventilação mínima) E o ROI projetado compensa o custo adicional. Antes de demolir, faça a conta: se a demolição custa R$ 10.000 e o ganho mensal projetado é R$ 300, o payback será de mais de 33 meses — provavelmente não compensa. Consulte um arquiteto com experiência em short stay antes de tomar essa decisão.",
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/o-que-nao-reformar-no-studio-short-stay", label: "O anti-checklist da reforma: 4 itens que não compensa mexer" },
          { href: "/conteudos/7-erros-imovel-short-stay", label: "Os 7 erros mais comuns de quem prepara um imóvel para short stay" },
        ],
      },
    ],
  },
  {
    id: "decoracao",
    h2: "Decoração Estratégica",
    blocos: [
      { tipo: "p", texto: "Design que converte: estética + funcionalidade + rentabilidade." },
      { tipo: "h3", texto: "Os 5 Pilares" },
      {
        tipo: "ul",
        itens: [
          "Design autoral — estética diferenciada que se destaca nas buscas",
          "Fotos profissionais — imagens que vendem: a primeira impressão do anúncio",
          "Funcionalidade — cada metro útil otimizado para o hóspede",
          "Durabilidade — materiais que resistem ao uso intenso de short stay",
          "Identidade de marca — consistência visual que gera reviews e retorno",
        ],
      },
      { tipo: "h3", texto: "O Flywheel da Rentabilidade" },
      {
        tipo: "p",
        texto:
          "Ciclo virtuoso: cada etapa alimenta a próxima — Design → Fotos → Cliques → Reservas → Reviews → Ranking → Diária maior. Menos manutenção, operação simplificada e reputação orgânica.",
      },
      { tipo: "h3", texto: "Budget breakdown por nível" },
      {
        tipo: "table",
        cabecalho: ["Nível", "Investimento", "O que inclui"],
        linhas: [
          ["Básico", "R$ 15–25 mil", "Pintura, iluminação LED, mobília essencial, enxoval padrão, fotos com celular profissional"],
          ["Premium", "R$ 25–40 mil", "Marcenaria planejada, iluminação cênica, mobília curada, enxoval premium, fotos profissionais, smart lock"],
          ["Alto padrão", "R$ 40–60 mil", "Design autoral, marcenaria premium, piso vinílico/porcelanato, automação, arte original, styling completo, fotos + vídeo"],
        ],
      },
      {
        tipo: "p",
        texto:
          "ROI por nível de decoração: Básico — payback de 10–14 meses, melhora marginal na diária (+10–15%), mas custo baixo. Premium — payback de 8–12 meses, melhor custo-benefício: o aumento de diária (+20–30%) compensa o investimento adicional com folga. Alto padrão — payback de 6–10 meses, diária +30–45%, mas exige público-alvo compatível e bairro premium (Itaim, Pinheiros, Vila Olímpia). O nível Premium geralmente oferece o melhor retorno ajustado ao risco.",
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/preparar-studio-airbnb-checklist", label: "Como preparar um studio para Airbnb: o que muda na diária" },
          { href: "/conteudos/7-erros-imovel-short-stay", label: "Os 7 erros mais comuns de quem prepara um imóvel para short stay" },
        ],
      },
    ],
  },
  {
    id: "tendencias",
    h2: "Tendências 2026",
    blocos: [
      { tipo: "p", texto: "20 práticas dos hosts mais rentáveis do Brasil." },
      {
        tipo: "ul",
        itens: [
          "Fotografia profissional estratégica — fotos profissionais aumentam CTR, conversão e diária.",
          "Primeira foto extremamente forte — a primeira imagem define se o usuário clica no anúncio.",
          "Identidade visual do apartamento — um conceito único faz o anúncio se destacar.",
          "Self check-in ultra intuitivo — menos fricção no check-in, mais avaliações.",
          "Guia digital personalizado da cidade — guia local aumenta satisfação e reviews.",
          "Wi-Fi extremamente rápido — Wi-Fi rápido é filtro decisivo para muitos hóspedes.",
          "Colchão padrão hotel — sono excelente = mais 5 estrelas.",
          "Roupa de cama premium — sensação de hotel com enxoval superior.",
          "Cortinas blackout — sono melhor para hóspedes de qualquer fuso.",
          "Iluminação pensada para fotos — iluminação boa melhora fotos e experiência.",
          "Elemento de design único — um detalhe memorável aumenta lembrança e cliques.",
          "Smart TV com streaming — streaming é padrão esperado.",
          "Limpeza profissional padronizada — limpeza consistente = avaliações consistentes.",
          "Checklists operacionais — processos permitem escalar sem perder qualidade.",
          "Preço dinâmico automático — preço ajustado diariamente maximiza receita.",
          "Gestão profissional de calendário — calendário otimizado captura picos de demanda.",
          "Estratégia de estadia mínima — regras por período melhoram ocupação e eficiência.",
          "Automatização de mensagens — automação reduz trabalho e melhora experiência.",
          "Reviews estratégicas — pedir review na hora certa aumenta a taxa de avaliação.",
          "Portfólio de unidades — hosts de grande escala crescem com padrão replicável.",
        ],
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/gestao-propria-vs-gestora", label: "Gestão própria ou gestora profissional: o custo real de cada caminho" },
          { href: "/conteudos/short-stay-sem-virar-gerente-de-obra", label: "Renda passiva de verdade: short stay sem virar gerente de obra" },
        ],
      },
    ],
  },
  {
    id: "anuncio-pricing",
    h2: "Anúncio e Precificação",
    blocos: [
      {
        tipo: "p",
        texto: "O produto físico é metade da equação. A outra metade é como você captura a receita.",
      },
      { tipo: "h3", texto: "Anatomia de um anúncio que converte" },
      {
        tipo: "ul",
        itens: [
          "1. Foto de capa irresistível — 60% do CTR vem da primeira foto. Use luz natural, enquadramento amplo e um elemento visual marcante. Fotografe entre 10h e 14h com luz natural; mostre o ambiente inteiro, não detalhes; inclua um elemento memorável (quadro, luminária, vista).",
          "2. Título com localização + diferencial — o título aparece nas buscas. Inclua bairro, metrô próximo e o diferencial principal. Ex.: “Studio Design · Pinheiros · 2min Metrô”. Evite superlativos genéricos (“maravilhoso”, “incrível”) e destaque o que te diferencia dos vizinhos.",
          "3. Descrição orientada a benefícios — não liste features: venda a experiência. “Wi-Fi 300 Mbps ideal para trabalho remoto” diz mais que “tem Wi-Fi”. Organize por blocos (localização, conforto, trabalho) e inclua distâncias a pé para pontos relevantes.",
          "4. Amenidades 100% preenchidas — o algoritmo do Airbnb favorece anúncios com mais amenidades marcadas. Complete todas as amenidades reais, inclusive as óbvias; amenidades filtráveis (Wi-Fi, cozinha, AC) são decisivas — cada uma é um possível filtro do hóspede.",
        ],
      },
      { tipo: "h3", texto: "Estratégia de precificação por fase" },
      {
        tipo: "p",
        texto:
          "A precificação evolui com a maturidade do anúncio. Não comece pelo preço ideal — conquiste credibilidade primeiro.",
      },
      {
        tipo: "ul",
        itens: [
          "Lançamento (mês 1–2): entrada agressiva, -20% do mercado. Priorize volume de reservas e reviews. As primeiras 5–10 avaliações definem sua posição no algoritmo.",
          "Estabilização (mês 3–4): subida gradual, +5% a cada 15 dias. Com reviews positivas, comece a subir. Monitore a taxa de conversão — se cair, volte um degrau.",
          "Operação normal (mês 5+): preço dinâmico automático. Use PriceLabs, Beyond ou Wheelhouse. Defina piso, teto e regras de estadia mínima por temporada.",
          "Picos (eventos e feriados): +30% a +50% sobre a base. Carnaval, F1, Lollapalooza, feriados prolongados e eventos corporativos. Antecipe a precificação.",
        ],
      },
      { tipo: "h3", texto: "Sazonalidade em São Paulo" },
      {
        tipo: "table",
        cabecalho: ["Período", "Meses", "Ocupação esperada", "Ajuste de preço"],
        linhas: [
          ["Alta", "Mar, Jun, Jul, Out, Nov, Dez", "80–90%", "+20 a +50%"],
          ["Média", "Fev, Abr, Mai, Ago, Set", "70–80%", "Base"],
          ["Baixa", "Jan (pós-feriados)", "55–65%", "-10 a -15%"],
        ],
      },
      { tipo: "h3", texto: "Como subir a diária sem perder ocupação" },
      {
        tipo: "ul",
        itens: [
          "Fotos profissionais (+20–40%): o maior ROI por real investido. Fotos profissionais podem dobrar seu CTR.",
          "Estadia mínima inteligente (+10–15%): 2 noites mínimo em semana, 3 em feriados. Reduz viradas e custos de limpeza.",
          "Título e descrição otimizados (+10–20%): teste A/B de títulos e reescreva a descrição a cada trimestre.",
          "Preço dinâmico (+15–25%): ferramentas automatizadas capturam picos que você não consegue monitorar manualmente.",
        ],
      },
      {
        tipo: "p",
        texto:
          "Preço é o último ajuste, não o primeiro: antes de mexer no preço, garanta que fotos, título, descrição e amenidades estejam otimizados. Um anúncio bem montado converte mais a qualquer preço. Precificação sem produto é desconto — precificação com produto é posicionamento.",
      },
      {
        tipo: "p",
        texto:
          "Ferramentas de preço dinâmico recomendadas: PriceLabs — o mais usado no Brasil, interface intuitiva, bom para quem tem 1–10 unidades, integra com Airbnb e Booking. Beyond Pricing — forte em mercados internacionais, mais robusto para quem opera em múltiplas cidades. Wheelhouse — permite mais controle manual sobre regras. Investimento típico: R$ 30–80/mês por unidade.",
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/como-precificar-studio-airbnb-sao-paulo", label: "Como precificar um studio no Airbnb: as três fases da diária" },
          { href: "/conteudos/airbnb-ou-booking", label: "Airbnb ou Booking: onde anunciar o seu studio e o que muda" },
        ],
      },
    ],
  },
  {
    id: "casestudy",
    h2: "Case Study: Studio em Pinheiros",
    blocos: [
      { tipo: "p", texto: "Jornada real de um investidor — do imóvel à receita recorrente." },
      {
        tipo: "p",
        texto:
          "Studio de 28 m² em Pinheiros: imóvel de R$ 325.000, reforma de R$ 32.000 e decoração de R$ 28.000 — investimento total de R$ 385.000. Com diária média de R$ 380 e ocupação de 82%, a receita média ficou em R$ 9.348/mês (R$ 112.176 no ano), com yield bruto de 29,1%.",
      },
      { tipo: "h3", texto: "Timeline do Projeto" },
      {
        tipo: "ul",
        itens: [
          "Mês 1–2: Compra + reforma — aquisição, reforma inteligente e marcenaria planejada",
          "Mês 3: Decoração + fotos — design premium, enxoval e sessão fotográfica profissional",
          "Mês 4: Lançamento — anúncio otimizado + preço dinâmico + primeiras reservas",
          "Mês 5–10: Ramp-up — construção de reviews, ajustes de preço, ocupação crescente",
          "Mês 11+: Cruzeiro — operação estável, receita previsível, payback atingido",
        ],
      },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/reformar-studio-sao-paulo-morando-em-outra-cidade", label: "Como reformar um studio em São Paulo morando em outra cidade" },
          { href: "/conteudos/comprou-studio-na-planta-antes-das-chaves", label: "Comprou studio na planta: o que fazer antes de receber as chaves" },
        ],
      },
    ],
  },
  {
    id: "checklist",
    h2: "Checklist do Investidor",
    blocos: [
      { tipo: "p", texto: "Avalie sua preparação antes de investir." },
      { tipo: "ul", itens: [...CHECKLIST_ITEMS] },
      { tipo: "p", texto: textoFaixasChecklist() },
      {
        tipo: "links",
        itens: [
          { href: "/conteudos/o-que-vem-no-studio-novo-sao-paulo", label: "O que vem (e o que não vem) no seu studio novo em São Paulo" },
          { href: "/conteudos/recebi-chaves-studio-na-planta-o-que-fazer", label: "Recebi as chaves do studio na planta. O que fazer antes de alugar" },
        ],
      },
    ],
  },
];

const attr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Substitui a primeira ocorrência de `pattern`. Usa função de substituição:
 * com string, `$&`, `$'` e `$1` no texto seriam interpretados pelo replace.
 */
const substituir = (html: string, pattern: RegExp, valor: string) => html.replace(pattern, () => valor);

function headFor(html: string): string {
  const set = (pattern: RegExp, valor: string) => {
    html = substituir(html, pattern, valor);
  };

  set(/<title>[\s\S]*?<\/title>/, `<title>${attr(GUIA_TITLE)}</title>`);
  set(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="description" content="${attr(GUIA_DESCRIPTION)}" />`,
  );
  set(/<meta\s+name="keywords"[\s\S]*?\/>/, `<meta name="keywords" content="${attr(GUIA_KEYWORDS)}" />`);
  set(/<meta\s+name="DC.title"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="DC.title" content="${attr(GUIA_TITLE)}" />`);
  set(/<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/?>/, `<link rel="canonical" href="${GUIA_URL}" />`);
  html = html.replace(
    /<link\s+rel="alternate"\s+hreflang="([\w-]+)"\s+href="[\s\S]*?"\s*\/?>/g,
    (_m, lang: string) => `<link rel="alternate" hreflang="${lang}" href="${GUIA_URL}" />`,
  );
  set(/<meta\s+property="og:type"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:type" content="article" />`);
  set(/<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:url" content="${GUIA_URL}" />`);
  set(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:title" content="${attr(GUIA_TITLE)}" />`,
  );
  set(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:description" content="${attr(GUIA_DESCRIPTION)}" />`,
  );
  set(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:title" content="${attr(GUIA_TITLE)}" />`,
  );
  set(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:description" content="${attr(GUIA_DESCRIPTION)}" />`,
  );

  // Um bloco por objeto, como o useSeo faz; marcados para a SPA substituir.
  const blocos = guiaJsonLd()
    .map(
      (obj) =>
        `<script type="application/ld+json" data-seo-managed="true" data-prerender="guia">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`,
    )
    .join("\n");
  return substituir(html, /<\/head>/, `${blocos}\n</head>`);
}

function renderBloco(b: Bloco): string {
  switch (b.tipo) {
    case "p":
      return `<p>${attr(b.texto)}</p>`;
    case "h3":
      return `<h3>${attr(b.texto)}</h3>`;
    case "ul":
      return `<ul>${b.itens.map((i) => `<li>${attr(i)}</li>`).join("")}</ul>`;
    case "table":
      return (
        `<table><thead><tr>${b.cabecalho.map((h) => `<th scope="col">${attr(h)}</th>`).join("")}</tr></thead>` +
        `<tbody>${b.linhas
          .map(
            (linha) =>
              `<tr>${linha.map((c, i) => (i === 0 ? `<th scope="row">${attr(c)}</th>` : `<td>${attr(c)}</td>`)).join("")}</tr>`,
          )
          .join("")}</tbody></table>`
      );
    case "links": {
      const anchors = b.itens.map((l) => `<a href="${attr(l.href)}">${attr(l.label)}</a>`).join(" · ");
      return `<p>Aprofunde: ${anchors}</p>`;
    }
  }
}

function bodyFor(html: string): string {
  const secoes = SECOES.map(
    (s) => `<section id="${attr(s.id)}"><h2>${attr(s.h2)}</h2>${s.blocos.map(renderBloco).join("")}</section>`,
  ).join("");

  const faq =
    `<section id="faq"><h2>Perguntas frequentes</h2>` +
    GUIA_FAQ.map((f) => `<h3>${attr(f.q)}</h3><p>${attr(f.a)}</p>`).join("") +
    `</section>`;

  const content =
    `<article data-prerender="guia-body">` +
    `<nav><a href="/">Início</a> / <a href="${GUIA_PATH}">Guia do investidor</a></nav>` +
    `<h1>${attr(GUIA_H1)}</h1>` +
    `<p>${attr(GUIA_DESCRIPTION)}</p>` +
    secoes +
    faq +
    `<p><a href="/orcamento">Solicitar orçamento</a> · <a href="/portfolio">Portfólio de reformas em SP</a> · <a href="/conteudos">Conteúdos sobre reforma e short stay</a></p>` +
    `<p>Conteúdo informativo. As faixas de diária, ocupação e custo citadas são retratos de mercado do período analisado e não constituem promessa, garantia ou recomendação de investimento.</p>` +
    `</article>`;

  return substituir(html, /<div id="root"><\/div>/, `<div id="root">${content}</div>`);
}

/** HTML final do guia a partir do dist/index.html (exportado para teste). */
export function renderGuiaHtml(baseHtml: string): string {
  return bodyFor(headFor(baseHtml));
}

export function prerenderGuia(): Plugin {
  return {
    name: "bewild-prerender-guia",
    apply: "build",
    closeBundle() {
      try {
        const distIndex = resolve("dist/index.html");
        if (!existsSync(distIndex)) {
          console.warn("[prerender-guia] dist/index.html não encontrado — nada gerado.");
          return;
        }
        const html = renderGuiaHtml(readFileSync(distIndex, "utf8"));
        const dirFile = resolve("dist/guia-do-investidor/index.html");
        mkdirSync(dirname(dirFile), { recursive: true });
        writeFileSync(dirFile, html, "utf8");
        writeFileSync(resolve("dist/guia-do-investidor.html"), html, "utf8");
        console.log("[prerender-guia] /guia-do-investidor pronto em dist/guia-do-investidor/");
      } catch (err) {
        console.warn(`[prerender-guia] ${err instanceof Error ? err.message : String(err)} — nada gerado.`);
      }
    },
  };
}
