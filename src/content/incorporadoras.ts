/* ============================================================
 * Conteúdo da página /parceiros/incorporadoras e do menu Parceiros.
 * Texto aprovado no escopo de 23/09/2026 (Matheus).
 *
 * Regras de texto (governança Bewild): sem travessão, sem antítese e
 * sem os termos vetados pela marca; faixas escritas como "18 a 77 m²";
 * sem valores em reais, número de unidade ou nome de comprador.
 *
 * Números, linha do tempo, projetos e depoimento do case NÃO ficam
 * aqui: vêm da tabela partner_cases (slug "leal-moreira"), para
 * atualizar sem publicar código.
 * ============================================================ */

export const INCORP_PATH = "/parceiros/incorporadoras";
export const INCORP_CASE_SLUG = "leal-moreira";
export const INDICACAO_FORM_URL = "https://forms.gle/vG9n5bWb4Rc7vEV56";

export const INCORP_SEO = {
  title: "Parceria com incorporadoras em São Paulo | Bewild",
  description:
    "Projeto, obra e mobília para os compradores do seu empreendimento em São Paulo, com o case do LM Urban Flex Bela Cintra, da Leal Moreira.",
  keywords:
    "parceria incorporadora reforma, reforma para compradores de lançamento, personalização de unidades, reforma pós-chaves São Paulo, pacote por tipologia, Bewild incorporadoras",
  breadcrumb: [
    { name: "Início", path: "/" },
    { name: "Parceiros", path: "/parceiros" },
    { name: "Incorporadoras", path: "/parceiros/incorporadoras" },
  ],
};


export const INCORP_HERO = {
  label: "Para incorporadoras",
  titleStart: "Projeto, obra e mobília",
  titleEm: "para os compradores do seu empreendimento.",
  lead:
    "A Bewild atende quem compra unidades do seu empreendimento com projeto, obra, marcenaria e mobília em um único contrato, com preço e prazo fechados. A incorporadora indica, e a relação com o comprador continua sua.",
  ctaPrimary: {
    label: "Conversar sobre o meu empreendimento",
    href: "#contato-incorporadora",
    cta: "incorporadoras-hero-contato",
  },
  ctaSecondary: {
    label: "Ver o case Leal Moreira",
    href: "#leal-moreira",
    cta: "incorporadoras-hero-case",
  },
  caseStrip: "Case · LM Urban Flex Bela Cintra",
};

export const INCORP_CASE = {
  id: "leal-moreira",
  label: "01 · Case Leal Moreira",
  title:
    "Compradores do LM Urban Flex Bela Cintra contratam com a Bewild projeto, obra, marcenaria e mobília em um único contrato.",
  intro: [
    "A Leal Moreira entregou o LM Urban Flex Bela Cintra, na Rua Bela Cintra, perto da Avenida Paulista, em agosto de 2026.",
    "Pelo programa de indicações, a Leal Moreira apresenta a Bewild aos compradores, e quem contrata recebe projeto e obra desenhados para a planta da sua unidade.",
  ],
  statsTitle: "O case em números",
  updatedPrefix: "Atualizado em",
  timelineTitle: "Linha do tempo",
  galleryTitle: "Projetos das unidades",
  galleryNote:
    "As imagens são dos projetos em 3D. As fotos entram aqui conforme as obras forem entregues.",
  galleryLink: "Ver projeto",
  statusLabels: {
    em_projeto: "Projeto em 3D",
    em_obra: "Em obra",
    entregue: "Entregue",
  } as Record<string, string>,
  quoteLabel: "Leal Moreira",
  buyer: {
    title: "Comprou uma unidade no LM Urban Flex Bela Cintra?",
    text: "Fale com a Bewild sobre o projeto e a obra da sua unidade.",
    ctaLabel: "Falar no WhatsApp",
    whatsappMessage:
      "Olá! Comprei uma unidade no LM Urban Flex Bela Cintra e quero conversar sobre o projeto.",
    cta: "incorporadoras-comprador-lm",
  },
};

export const INCORP_STEPS = {
  id: "como-funciona",
  label: "02 · Como funciona",
  title: "O mesmo modelo no seu empreendimento.",
  lead: "Seis etapas, da planta do empreendimento ao apartamento pronto do comprador.",
  steps: [
    {
      n: "01",
      t: "Plantas e tipologias",
      d: "A Bewild estuda as plantas do empreendimento e agrupa as unidades por tipologia.",
    },
    {
      n: "02",
      t: "Pacotes com projeto em 3D",
      d: "Cada tipologia ganha um pacote com projeto, escopo e valor fechados, que o time de vendas pode apresentar antes das chaves.",
    },
    {
      n: "03",
      t: "Indicação registrada",
      d: "A incorporadora registra cada comprador interessado no formulário oficial. O registro vale por 12 meses.",
    },
    {
      n: "04",
      t: "Contrato com o comprador",
      d: "O comprador assina com a Bewild e personaliza o projeto no 3D. A obra só começa com o 3D aprovado.",
    },
    {
      n: "05",
      t: "Projeto executivo, liberação e obra",
      d: "A Bewild faz o projeto executivo, cuida da documentação e do pedido de liberação no condomínio e executa a obra.",
    },
    {
      n: "06",
      t: "Vistoria e entrega",
      d: "Vistoria de engenheiro e entrega das chaves ao comprador. A incorporadora recebe relatório mensal de indicações, contratos e comissões.",
    },
  ],
};

export const INCORP_BENEFITS = {
  id: "ganhos",
  label: "03 · O que a incorporadora ganha",
  title: "O que muda para a incorporadora com a parceria.",
  items: [
    {
      t: "O comprador que mora longe recebe o imóvel pronto",
      d: "No LM Urban Flex Bela Cintra, a maioria dos compradores mora em Belém. A Bewild conduz projeto, obra e entrega em São Paulo, e o comprador acompanha cada etapa pelo Bwild Workflow.",
    },
    {
      t: "Um argumento de venda antes das chaves",
      d: "Pacotes por tipologia, com projeto em 3D e valor fechado, mostram ao comprador como a unidade fica pronta para morar ou alugar.",
    },
    {
      t: "Um interlocutor técnico para o condomínio",
      d: "A Bewild cuida da documentação e do pedido de liberação de cada obra, e o condomínio tem um só interlocutor para as unidades que ela atende.",
    },
    {
      t: "Receita de indicação com regra clara",
      d: "Comissão sobre o valor líquido recebido de cada contrato indicado, com relatório mensal e direito de auditoria. O percentual fica no termo de parceria.",
    },
    {
      t: "A relação com o comprador continua sua",
      d: "A Bewild fala sempre em nome próprio, atende só o comprador indicado e usa os dados dele apenas para essa indicação, conforme a LGPD.",
    },
    {
      t: "Execução com garantia em contrato",
      d: "Preço e prazo em contrato e obra a partir de 60 dias úteis para unidades de até 30 m². São 5 anos de garantia na mão de obra, mais de 10 anos na marcenaria e mais de 160 reformas entregues.",
    },
  ],
};

export const INCORP_RULES = {
  id: "regras",
  label: "04 · Regras da parceria",
  title: "As regras que valem para a incorporadora parceira.",
  items: [
    "Indicação registrada no formulário oficial, válida por 12 meses.",
    "Comissão sobre o valor líquido efetivamente recebido, sem adiantamento.",
    "Relatório mensal com status das indicações, contratos, recebimentos e comissões.",
    "Direito de auditoria dos registros das indicações, uma vez por ano.",
    "Parceria não exclusiva para os dois lados.",
    "Percentual definido no termo de parceria.",
  ],
  link: {
    label: "Ver todas as regras do programa",
    href: "/parceiros#comissao",
    cta: "incorporadoras-regras",
  },
};

export const INCORP_FAQ = {
  id: "faq",
  label: "05 · Perguntas de incorporadoras",
  title: "5 respostas diretas.",
  items: [
    {
      q: "Onde a Bewild atende?",
      a: "Em São Paulo capital. O comprador pode morar em qualquer cidade: a aprovação do projeto e o acompanhamento da obra funcionam à distância, pelo Bwild Workflow.",
    },
    {
      q: "Existe mínimo de unidades?",
      a: "Não. O cronograma de cada prédio é montado com a incorporadora e com o condomínio, conforme os contratos fechados.",
    },
    {
      q: "Quando a incorporadora deve chamar a Bewild?",
      a: "Antes das chaves, para montar os pacotes por tipologia e apoiar o time de vendas. Depois das chaves, para atender os compradores que ainda não reformaram.",
    },
    {
      q: "Quem fala com o comprador?",
      a: "A Bewild, sempre em nome próprio, a partir da indicação registrada pela incorporadora. Os dados do comprador são usados só para atender a indicação.",
    },
    {
      q: "Como funciona a comissão?",
      a: "Ela é calculada sobre o valor líquido que o comprador efetivamente pagou. No contrato à vista, é paga em até 30 dias do recebimento. No parcelado, a partir da segunda parcela, em até 10 dias úteis de cada recebimento. O percentual fica no termo de parceria.",
    },
  ],
};

export const INCORP_FORM = {
  id: "contato-incorporadora",
  label: "06 · Conversar sobre o seu empreendimento",
  title: "Conte sobre o seu empreendimento.",
  intro:
    "A equipe Bewild responde pelo WhatsApp informado para marcar uma conversa sobre as plantas e o momento do empreendimento.",
  partnerNoteLead: "Já é parceira e quer registrar um comprador?",
  partnerNoteLink: "Registrar uma indicação",
  emailPrefix: "Prefere e-mail?",
  fields: {
    nome: "Nome",
    cargo: "Cargo (opcional)",
    incorporadora: "Incorporadora",
    whats: "WhatsApp",
    mail: "E-mail (opcional)",
    empreendimento: "Empreendimento e bairro",
    empreendimentoPlaceholder: "Nome do empreendimento · bairro",
    fase: "Fase do empreendimento",
    unidades: "Número de unidades (opcional)",
    unidadesPlaceholder: "Ex.: 120",
    metragens: "Metragens das plantas (opcional)",
    metragensPlaceholder: "Ex.: 18, 25 e 40 m²",
    chaves: "Previsão de chaves (opcional)",
    chavesPlaceholder: "mês/ano",
    compradores: "Onde mora a maioria dos compradores (opcional)",
  },
  fases: ["Lançamento", "Em obras", "Chaves entregues"],
  compradores: ["A maioria mora em São Paulo", "A maioria mora em outras cidades", "Não sei"],
  errors: {
    nome: "Informe seu nome.",
    incorporadora: "Informe a incorporadora.",
    whats: "Informe um número com DDD.",
    mail: "Confira o e-mail digitado.",
    empreendimento: "Informe o empreendimento e o bairro.",
    fase: "Selecione a fase do empreendimento.",
  },
  submit: "Enviar para a Bewild",
  sending: "Enviando…",
  retry: "Tentar de novo",
  privacy: "Seus dados são usados apenas para responder a este contato, conforme a LGPD.",
  whatsappIntro:
    "Olá, vim pelo site da Bewild e quero conversar sobre uma parceria para o meu empreendimento.",
  done: {
    label: "Contato recebido",
    title: "Obrigado,",
    text: "A equipe Bewild vai chamar você no WhatsApp informado para marcar a conversa.",
    whatsLabel: "Confirmar no WhatsApp",
  },
  timedOut: {
    label: "Envio sem confirmação",
    title: "Seu contato pode já ter chegado,",
    text: "A confirmação demorou mais que o normal. Para garantir, mande pelo WhatsApp: a mensagem já vai com os seus dados. Se já tivermos recebido, é só ignorar.",
    whatsLabel: "Enviar pelo WhatsApp",
  },
  failed:
    "Não conseguimos enviar agora. Tente de novo ou mande pelo WhatsApp: a mensagem já vai com os seus dados.",
};

/* ---------------- Menu "Parceiros" (dropdown) ---------------- */

export const NAV_PARCEIROS = {
  label: "Parceiros",
  items: [
    {
      href: "/indique-um-amigo",
      title: "Clientes e amigos",
      desc: "Indique quem vai reformar e receba no Pix.",
      cta: "nav-parceiros-clientes",
      gated: false,
    },
    {
      href: "/parceiros",
      title: "Corretores e profissionais",
      desc: "Comissão por contrato indicado, com relatório mensal.",
      cta: "nav-parceiros-profissionais",
      gated: false,
    },
    {
      href: "/parceiros/incorporadoras",
      title: "Incorporadoras",
      desc: "Projeto e obra para os compradores do seu empreendimento.",
      cta: "nav-parceiros-incorporadoras",
      gated: true,
    },
  ],
};

/* ---------------- Textos usados na /parceiros quando a página de incorporadoras estiver ligada ---------------- */

export const PARCEIROS_WHEN_INCORP_ON = {
  heroLead:
    "Corretores, imobiliárias, arquitetos e administradoras podem indicar clientes para uma entrega completa de projeto, obra, marcenaria e mobília. Quando o contrato indicado é pago, você recebe a comissão definida no seu termo.",
  seoDescription:
    "Indique clientes para a Bewild, acompanhe cada oportunidade e receba comissão conforme o termo. Programa para corretores, imobiliárias, arquitetos e administradoras.",
  caminhoIncorporadorasLink: "Ver a página para incorporadoras",
  bloco07: {
    label: "07 · Para incorporadoras",
    title: "Incorporadoras têm uma página própria.",
    text: "Pacotes por tipologia antes das chaves, obra para os compradores depois delas e o case do LM Urban Flex Bela Cintra, da Leal Moreira.",
    cta: "Ver a página para incorporadoras",
  },
  cardLealMoreira: {
    text: "Programa de indicações vigente com a Leal Moreira, formalizado em termo de parceria. Compradores do LM Urban Flex Bela Cintra contratam com a Bewild projeto, obra, marcenaria e mobília.",
    cta: "Ver o case completo",
    href: "/parceiros/incorporadoras#leal-moreira",
  },
  marcasCta: "Ver o case Leal Moreira",
};
