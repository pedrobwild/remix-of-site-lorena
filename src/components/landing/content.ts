/**
 * content.ts — Fonte única de verdade do conteúdo da landing **bewild**.
 *
 * Tudo aqui é editável sem tocar nos componentes: textos, métricas, cases,
 * FAQ, etc. Números absolutos ficam isolados em `metrics` para revisão.
 *
 * ⚠️ Antes de publicar: validar internamente prazos, garantias e métricas.
 */

import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  PencilRuler,
  BedDouble,
  Hammer,
  Sofa,
  MonitorSmartphone,
  Search,
  ClipboardList,
  DraftingCompass,
  Wallet,
  CalendarClock,
  HardHat,
  PackageCheck,
  LayoutGrid,
  Lightbulb,
  Layers,
  Wrench,
  SlidersHorizontal,
  Network,
  Building2,
  Target,
  MonitorCheck,
  Settings2,
  Sparkles,
  Globe2,
  Plane,
  Briefcase,
  Building,
  
  Handshake,
} from "lucide-react";

/** Contato — editar com os dados oficiais antes de publicar. */
export const CONTACT = {
  whatsappNumber: "5511911906183",
  whatsappText: "Olá, quero um diagnóstico para meu studio",
  email: "contato@bewild.com.br",
  instagram: "https://instagram.com/bewild.oficial",
  linkedin: "https://www.linkedin.com/",
  city: "São Paulo, Brasil",
};

export function whatsappHref(text: string = CONTACT.whatsappText): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "O que fazemos", href: "/#o-que-fazemos" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Portfólio", href: "/portfolio" },
  { label: "Conteúdos", href: "/conteudos" },
];

export const HERO = {
  chips: [],
  floatingCards: [],
};

export const PROBLEM_BULLETS: string[] = [
  "Orçamentos que começam baixos e crescem no meio da obra.",
  "Fornecedores que não conversam entre si.",
  "Projeto bonito, mas difícil de executar.",
  "Studio pronto visualmente, mas ruim de operar.",
  "Cliente acompanhando tudo por WhatsApp, sem rastreabilidade.",
  "Imóvel parado enquanto deveria estar gerando receita.",
];

export interface ServiceItem {
  title: string;
  text: string;
  icon: LucideIcon;
}

export const SERVICES: ServiceItem[] = [
  {
    title: "Reforma turn-key",
    text: "Projeto, obra, compras, fornecedores, marcenaria, mobiliário e acabamento final coordenados em um único processo.",
    icon: Boxes,
  },
  {
    title: "Projeto de arquitetura personalizado",
    text: "Cada imóvel recebe um estudo próprio de layout, circulação, marcenaria, iluminação, acabamentos e uso. Nada de copiar e colar projeto genérico.",
    icon: PencilRuler,
  },
  {
    title: "Studios para short-stay",
    text: "Soluções pensadas para foto, diária, experiência do hóspede, limpeza rápida, resistência e manutenção simples.",
    icon: BedDouble,
  },
  {
    title: "Interiores e marcenaria inteligente",
    text: "Aproveitamento de cada centímetro com armários, bancadas, painéis, iluminação e móveis sob medida para studios compactos.",
    icon: Hammer,
  },
  {
    title: "Mobiliário, eletros e enxoval",
    text: "Curadoria de itens essenciais para o imóvel sair pronto para uso, anúncio e operação.",
    icon: Sofa,
  },
  {
    title: "Tecnologia de acompanhamento",
    text: "Portal, cronograma, fotos, relatórios e registros para reduzir incerteza e dar visibilidade ao cliente.",
    icon: MonitorSmartphone,
  },
];

export interface StepItem {
  n: string;
  title: string;
  text: string;
  icon: LucideIcon;
}

export const STEPS: StepItem[] = [
  {
    n: "01",
    title: "Diagnóstico do imóvel",
    text: "Analisamos metragem, planta, padrão do prédio, objetivo de uso, região, restrições e potencial do imóvel.",
    icon: Search,
  },
  {
    n: "02",
    title: "Briefing e estratégia",
    text: "Entendemos se o imóvel será usado para short-stay, long stay, uso misto ou moradia. A estratégia define o nível de investimento e as escolhas do projeto.",
    icon: ClipboardList,
  },
  {
    n: "03",
    title: "Projeto de arquitetura personalizado",
    text: "Desenvolvemos layout, conceito, marcenaria, iluminação, acabamentos e soluções para o imóvel performar melhor no uso e na foto.",
    icon: DraftingCompass,
  },
  {
    n: "04",
    title: "Orçamento e escopo",
    text: "Organizamos o que está incluso, o que é opcional, quais itens impactam operação e quais escolhas afetam prazo, custo e percepção de valor.",
    icon: Wallet,
  },
  {
    n: "05",
    title: "Planejamento da obra",
    text: "Cronograma, compras críticas, fornecedores, condomínio, lead times, marcenaria e sequência de execução.",
    icon: CalendarClock,
  },
  {
    n: "06",
    title: "Execução e acompanhamento",
    text: "A obra avança com gestão técnica, fotos, relatórios, controle de etapas e comunicação centralizada.",
    icon: HardHat,
  },
  {
    n: "07",
    title: "Entrega pronta para operar",
    text: "Finalização, limpeza, montagem, ajustes finais, fotos e imóvel pronto para uso, locação ou anúncio.",
    icon: PackageCheck,
  },
];

export interface ArchBlock {
  title: string;
  text: string;
  icon: LucideIcon;
}

export const ARCH_BLOCKS: ArchBlock[] = [
  {
    title: "Layout inteligente",
    text: "Definimos cama, bancada, cozinha, armários, TV, circulação e apoio de malas para o espaço parecer maior e funcionar melhor.",
    icon: LayoutGrid,
  },
  {
    title: "Marcenaria sob medida",
    text: "Criamos soluções de armazenamento, painéis, bancadas e nichos que aumentam a percepção de qualidade e reduzem improvisos.",
    icon: Layers,
  },
  {
    title: "Iluminação e percepção de valor",
    text: "A luz certa melhora a foto, a experiência do hóspede e a sensação de cuidado no imóvel.",
    icon: Lightbulb,
  },
  {
    title: "Materiais para uso real",
    text: "A escolha não é só estética. Consideramos limpeza, manutenção, resistência, reposição e custo total.",
    icon: Wrench,
  },
  {
    title: "Personalização sem perder eficiência",
    text: "O projeto respeita o imóvel e o perfil do investidor, mas evita escolhas que encarecem, atrasam ou prejudicam a operação.",
    icon: SlidersHorizontal,
  },
];

export interface Differential {
  title: string;
  text: string;
  icon: LucideIcon;
}

export const DIFFERENTIALS: Differential[] = [
  {
    title: "Operação ponta-a-ponta",
    text: "Um único time integra arquitetura, obra, compras, fornecedores, marcenaria, mobiliário e entrega.",
    icon: Network,
  },
  {
    title: "Especialização em studios compactos",
    text: "Conhecemos as decisões críticas de imóveis pequenos: layout, armazenamento, eletros, circulação, iluminação e operação.",
    icon: Building2,
  },
  {
    title: "Foco em investidor",
    text: "Cada escolha considera prazo, custo, percepção de valor, manutenção e potencial de rentabilização.",
    icon: Target,
  },
  {
    title: "Transparência de escopo",
    text: "O cliente entende o que está incluso, o que é opcional e quais escolhas impactam preço ou prazo.",
    icon: ClipboardList,
  },
  {
    title: "Portal de acompanhamento",
    text: "Fotos, relatórios, cronograma e atualizações para acompanhar a obra sem depender de mensagens soltas.",
    icon: MonitorCheck,
  },
  {
    title: "Gestão técnica",
    text: "Cronograma, compras, lead times, fornecedores e execução tratados como partes do mesmo sistema.",
    icon: Settings2,
  },
  {
    title: "Acabamentos pensados para operação",
    text: "Bonito na foto, resistente no uso, simples de limpar e mais fácil de manter.",
    icon: Sparkles,
  },
  {
    title: "Experiência remota",
    text: "Ideal para quem comprou imóvel em São Paulo, mas mora em outra cidade, estado ou país.",
    icon: Globe2,
  },
];

/**
 * Métricas de credibilidade — EDITÁVEIS.
 * ⚠️ Validar internamente antes de publicar (prazos e garantias dependem
 * de contrato/escopo/fornecedor).
 */
export const METRICS: { value: string; suffix: string; label: string }[] = [
  {
    value: "55",
    suffix: "dias úteis",
    label: "referência de prazo para obras padrão, sujeito ao escopo",
  },
  {
    value: "5",
    suffix: "anos",
    label: "garantia de mão de obra geral, quando aplicável ao contrato",
  },
  {
    value: "10+",
    suffix: "anos",
    label: "garantia em marcenaria selecionada, conforme fornecedor/escopo",
  },
  {
    value: "100%",
    suffix: "turn-key",
    label: "projeto, obra, mobiliário e entrega coordenados",
  },
];

export const TRUST_POINTS: string[] = [
  "Contrato e escopo claros.",
  "Fotos e relatórios de acompanhamento.",
  "Projeto aprovado antes da execução.",
  "Compras críticas planejadas.",
  "Gestão de fornecedores.",
  "Entrega com checklist final.",
];

export interface CaseItem {
  name: string;
  challenge: string;
  solution: string;
  result: string;
  /** Caminho da imagem em /public/images/cases/ (placeholder até subir a real). */
  image: string;
  imageAlt: string;
  tag: string;
}

export const CASES: CaseItem[] = [
  {
    name: "Studio compacto para short-stay",
    challenge: "Transformar uma planta pequena em um imóvel funcional, bonito e fácil de operar.",
    solution:
      "Marcenaria inteligente, bancada compacta, iluminação estratégica, eletros adequados e acabamento resistente.",
    result: "Unidade pronta para fotos, anúncio e operação.",
    image: "/images/cases/studio-compacto-pronto-01.jpg",
    imageAlt: "Studio compacto reformado pela bewild, pronto para short-stay",
    tag: "Short-stay",
  },
  {
    name: "Studio recém-entregue na planta",
    challenge:
      "Sair do apartamento cru para uma unidade mobiliada sem o cliente precisar coordenar múltiplos fornecedores.",
    solution: "Projeto personalizado, obra turn-key, compras planejadas e montagem final.",
    result: "Imóvel entregue com visual consistente, layout otimizado e pronto para uso.",
    image: "/images/cases/antes-depois-studio-01-depois.jpg",
    imageAlt: "Studio entregue na planta e finalizado pela bewild",
    tag: "Turn-key",
  },
  {
    name: "Imóvel para investidor remoto",
    challenge: "Cliente fora da cidade precisava acompanhar a obra sem visitas constantes.",
    solution: "Portal, fotos, relatórios, cronograma e comunicação centralizada.",
    result: "Obra acompanhada à distância com mais clareza e menos ansiedade.",
    image: "/images/cases/bastidor-obra-01.jpg",
    imageAlt: "Bastidor de obra de studio acompanhada à distância pela bewild",
    tag: "Investidor remoto",
  },
  {
    name: "Studio com foco em percepção de valor",
    challenge: "Destacar o imóvel em uma região com alta concorrência de anúncios.",
    solution: "Iluminação, marcenaria, painel, enxoval e composição visual pensada para foto.",
    result: "Unidade mais competitiva visualmente para plataformas de locação.",
    image: "/images/cases/marcenaria-studio-01.jpg",
    imageAlt: "Detalhe de marcenaria e iluminação em studio reformado pela bewild",
    tag: "Percepção de valor",
  },
];

export const TECH_BULLETS: string[] = [
  "Cronograma por etapa.",
  "Fotos de evolução.",
  "Relatórios de acompanhamento.",
  "Registro de decisões.",
  "Controle de escopo.",
  "Compras e fornecedores.",
  "Visão clara do que está em andamento.",
];

export interface ComparisonRow {
  label: string;
  traditional: string;
  bewild: string;
}

export const COMPARISON: ComparisonRow[] = [
  {
    label: "Arquitetura",
    traditional: "Projeto isolado, nem sempre conectado à obra.",
    bewild: "Projeto personalizado já pensado para execução, uso e operação.",
  },
  {
    label: "Orçamento",
    traditional: "Múltiplos fornecedores e risco de lacunas.",
    bewild: "Escopo centralizado e itens organizados por etapa.",
  },
  {
    label: "Obra",
    traditional: "Cliente cobra e coordena.",
    bewild: "Gestão técnica e acompanhamento estruturado.",
  },
  {
    label: "Marcenaria",
    traditional: "Fornecedor separado.",
    bewild: "Integrada ao projeto e à sequência da obra.",
  },
  {
    label: "Comunicação",
    traditional: "Mensagens soltas.",
    bewild: "Portal, registros e atualizações.",
  },
  {
    label: "Entrega",
    traditional: "Imóvel reformado, mas nem sempre pronto para operar.",
    bewild: "Imóvel pensado para uso, foto, anúncio e operação.",
  },
];

export interface AudienceItem {
  title: string;
  text: string;
  icon: LucideIcon;
}

export const AUDIENCE: AudienceItem[] = [
  {
    title: "Investidor de short-stay",
    text: "Para quem quer preparar o imóvel para Airbnb, Booking ou locação por temporada.",
    icon: BedDouble,
  },
  {
    title: "Investidor iniciante",
    text: "Para quem comprou o primeiro studio e quer fazer certo desde o começo.",
    icon: Target,
  },
  {
    title: "Investidor de portfólio",
    text: "Para quem tem múltiplas unidades e precisa de padrão, processo e escala.",
    icon: Briefcase,
  },
  {
    title: "Cliente remoto",
    text: "Para quem mora fora de São Paulo, em outro estado ou fora do Brasil.",
    icon: Plane,
  },
  {
    title: "Proprietário de uso misto",
    text: "Para quem quer usar o imóvel em parte do ano e rentabilizar no restante.",
    icon: Building,
  },
  {
    title: "Parceiros imobiliários",
    text: "Para corretores e incorporadoras que querem entregar uma solução mais completa ao comprador.",
    icon: Handshake,
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "A BeWild faz só projeto ou também executa a obra?",
    a: "A BeWild atua no modelo turn-key: projeto de arquitetura personalizado, planejamento, execução, compras, marcenaria, mobiliário e entrega final, conforme o escopo contratado.",
  },
  {
    q: "O projeto de arquitetura é personalizado?",
    a: "Sim. Cada imóvel recebe um estudo próprio de layout, marcenaria, iluminação, acabamentos e uso. A personalização considera metragem, objetivo do imóvel, orçamento, região e tipo de operação.",
  },
  {
    q: "Vocês trabalham com studios pequenos?",
    a: "Sim. Studios compactos são uma das especialidades da BeWild. O projeto é pensado para aproveitar melhor cada metro quadrado, sem comprometer circulação, estética e funcionalidade.",
  },
  {
    q: "Consigo acompanhar a obra à distância?",
    a: "Sim. O processo inclui acompanhamento com fotos, relatórios, cronograma e comunicação organizada — especialmente importante para investidores que não moram perto do imóvel.",
  },
  {
    q: "Vocês ajudam com móveis, eletros e enxoval?",
    a: "Sim, quando incluído no escopo. A proposta pode contemplar mobiliário, eletrodomésticos, marcenaria, itens de acabamento e preparação para uso ou locação.",
  },
  {
    q: "A BeWild atende imóveis para Airbnb?",
    a: "Sim. A BeWild desenvolve reformas para short stay, long stay e uso misto, considerando estética, manutenção, limpeza, resistência e experiência do hóspede.",
  },
  {
    q: "O orçamento é fechado?",
    a: "O orçamento é estruturado por escopo. Mudanças solicitadas pelo cliente, descobertas técnicas ou itens fora do escopo podem gerar ajustes, mas a proposta deixa claro o que está incluso e o que é opcional.",
  },
  {
    q: "Posso ver exemplos antes de fechar?",
    a: "Sim. A BeWild apresenta galeria de reformas entregues, imagens reais e, quando disponível, tours, antes/depois e projetos semelhantes por metragem.",
  },
  {
    q: "Vocês atendem fora de São Paulo?",
    a: "Atualmente, a operação é concentrada em São Paulo e região, com possibilidade de análise para outras praças conforme escopo e disponibilidade.",
  },
  {
    q: "Como começo?",
    a: "Envie a planta, metragem, localização e objetivo do imóvel. A equipe avalia o melhor caminho de projeto, escopo e próximos passos.",
  },
];

export const OBJETIVO_OPTIONS = ["Short-stay", "Long stay", "Uso próprio", "Uso misto"] as const;
