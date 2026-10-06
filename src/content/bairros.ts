/**
 * Texto próprio das páginas de bairro (/reforma/<bairro>), começando pelos
 * cinco com mais projetos (CONT-03 da auditoria de SEO de 05/10/2026). Só
 * fatos publicados: contagens e metragens do portfólio, os números de
 * mercado e de contrato citados no post "melhores bairros para short stay"
 * (GuestFavorites jan–ago/2026 e base Bewild fev–out/2025) e a geografia do
 * bairro. Bairro sem entrada aqui mostra só a lista de projetos.
 *
 * As contagens de projetos vêm do banco na hora de renderizar; aqui ficam só
 * as frases que não mudam quando um projeto entra ou sai.
 */
export type BairroFaq = { q: string; a: string };
export type BairroPost = { href: string; label: string };
export type BairroContent = {
  /** Parágrafos da seção "Reformar em {bairro}: o que muda". */
  intro: string[];
  faq: BairroFaq[];
  posts: BairroPost[];
};

const PILAR = {
  href: "/conteudos/quanto-custa-reformar-apartamento-studio-ate-50-m2",
  label: "Quanto custa reformar um apartamento ou studio de até 50 m²",
};
const BAIRROS_POST = {
  href: "/conteudos/melhores-bairros-short-stay-sao-paulo",
  label: "Os melhores bairros para short stay em São Paulo em 2026",
};
const SHORT_STAY = { href: "/conteudos/o-que-e-short-stay", label: "Short stay: o que é, regras e quanto rende" };
const NBR = { href: "/conteudos/nbr-16280-reforma-studio-condominio", label: "NBR 16280: o que o condomínio exige antes da obra" };
const PRAZO = { href: "/conteudos/cronograma-reforma-studio-60-dias-uteis", label: "Cronograma de reforma de studio em 60 dias úteis" };
const FORA_SP = {
  href: "/conteudos/reformar-studio-sao-paulo-morando-em-outra-cidade",
  label: "Reformar um studio em São Paulo morando em outra cidade",
};

const PRAZO_FAQ =
  "Cerca de 60 dias úteis de obra para studios e apartamentos compactos de até 30 m², com a data de entrega em contrato e multa por dia de atraso. Metragens maiores ou integração de varanda levam mais; o cronograma por etapa é definido antes de a obra começar.";

export const BAIRROS_CONTENT: Record<string, BairroContent> = {
  pinheiros: {
    intro: [
      "Pinheiros é o bairro onde a Bewild mais reformou: são studios e apartamentos compactos de 21,43 a 41,14 m², em prédios como Do It Pinheiros, Highlights Pinheiros, My One Estação Fradique Coutinho, Spotlights Pinheiros e Pinheiros by Passarelli. Dos nove contratos de 2025 no bairro, sete foram para short stay, e cinco clientes moram fora da capital: acompanharam a obra pelo Bwild Workflow e receberam o apartamento pronto.",
      "O bairro junta metrô (estações Faria Lima, Fradique Coutinho e Pinheiros, da Linha 4-Amarela, além da CPTM), os escritórios da Faria Lima e a gastronomia da Rua dos Pinheiros e da Vila Madalena, ao lado. No levantamento da GuestFavorites de 2026, Pinheiros tem 62% de ocupação mediana, diária média de R$ 300 e 2.424 anúncios ativos: a combinação mais equilibrada entre diária, ocupação e demanda o ano inteiro.",
      "Nos contratos Bewild de 2025, a reforma completa em Pinheiros teve mediana de R$ 2.628 por m², acima da mediana da cidade (R$ 2.389): o padrão de acabamento sobe junto com a diária. Em prédio novo, vale conferir na convenção duas coisas antes de fechar o escopo: o padrão de envidraçamento da varanda e a infraestrutura de ar-condicionado.",
    ],
    faq: [
      {
        q: "Quanto custa reformar um studio em Pinheiros?",
        a: "Nos contratos Bewild de 2025, a mediana em Pinheiros foi R$ 2.628 por m², com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Num studio de 28 m², algo em torno de R$ 74 mil. A tabela por metragem está no guia de custo da Bewild, com 188 contratos analisados.",
      },
      {
        q: "Pinheiros vale para short stay?",
        a: "No levantamento da GuestFavorites (janeiro a agosto de 2026), o bairro tem 62% de ocupação mediana e diária média de R$ 300, com demanda de quem trabalha na Faria Lima durante a semana e de turistas no fim de semana. O que decide é o prédio: a convenção precisa permitir locação por temporada.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [BAIRROS_POST, PILAR, FORA_SP, { href: "/conteudos/fechar-varanda-em-vidro-studio-condominio", label: "Fechar varanda com vidro: custo e regra do condomínio" }],
  },
  butanta: {
    intro: [
      "No Butantã, a Bewild entregou studios de 23,61 a 29,35 m² em prédios como Ari Studios, Green View, Modern Estação Butantã e Now Butantã, quase todos a poucas quadras das estações Butantã e São Paulo–Morumbi, da Linha 4-Amarela.",
      "É o bairro com a demanda mais constante e a menor oferta entre os que a Bewild atende: 61% de ocupação mediana, diária média de R$ 276 e só 373 anúncios ativos no levantamento da GuestFavorites de 2026, puxados pela USP e pelo polo hospitalar da região. Foi aqui que um studio reformado pela Bewild fechou novembro com 70% de ocupação no Airbnb.",
      "Dois cuidados antes de comprar ou reformar: parte dos lançamentos da região é HIS ou HMP, classificações que não permitem locação por temporada, e isso precisa ser conferido na documentação do imóvel antes da compra; e a reforma completa teve a mediana mais baixa da cidade nos contratos de 2025, R$ 1.915 por m², o que mantém a conta do investimento favorável.",
    ],
    faq: [
      {
        q: "Quanto custa reformar um studio no Butantã?",
        a: "Nos contratos Bewild de 2025, a mediana no Butantã foi R$ 1.915 por m², a mais baixa entre os bairros atendidos, com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Num studio de 26 m², cerca de R$ 50 mil. A tabela por metragem está no guia de custo da Bewild.",
      },
      {
        q: "Meu studio no Butantã pode operar short stay?",
        a: "Depende da classificação da unidade e da convenção do prédio. Unidades HIS e HMP, comuns na região, não podem ser alugadas por temporada; confira a documentação do imóvel e a convenção antes de comprar.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [
      BAIRROS_POST,
      { href: "/conteudos/studio-his-ou-hmp-o-que-fazer", label: "Studio HIS ou HMP: o que fazer" },
      PILAR,
      SHORT_STAY,
    ],
  },
  brooklin: {
    intro: [
      "No Brooklin a Bewild entregou apartamentos de 21,59 a 37,38 m² em prédios como Hub Brooklin by EZ, Level Brooklin, My One Brooklin, Zip Brooklin e Brooklin Noventa. É também o bairro do escritório da Bewild, na Rua Pitú.",
      "A região da Berrini e da Chucri Zaidan é o eixo corporativo da zona sul, com a estação Brooklin da Linha 5-Lilás e a Berrini da CPTM; a demanda vem de quem trabalha ali durante a semana. O levantamento de mercado da GuestFavorites não tem página para o Brooklin, então o que a Bewild sabe vem dos próprios contratos: nove em 2025, todos para short stay, o mesmo número de Pinheiros.",
      "Foi a reforma mais econômica da base de 2025: mediana de R$ 2.096 por m² em studios de 24 m², com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Os prédios são novos e as plantas, parecidas entre si; o projeto de interiores é o que diferencia o anúncio.",
    ],
    faq: [
      {
        q: "Quanto custa reformar um studio no Brooklin?",
        a: "Nos contratos Bewild de 2025, a mediana no Brooklin foi R$ 2.096 por m², com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Num studio de 24 m², cerca de R$ 50 mil. A tabela por metragem está no guia de custo da Bewild.",
      },
      {
        q: "Dá para reformar no Brooklin morando em outra cidade?",
        a: "Sim. Vistoria por procuração, ligação de energia, instalação de internet e atendimento de emergências ficam com a Bewild, e você acompanha a obra pelo Bwild Workflow, com relatórios semanais e fotos.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [BAIRROS_POST, PILAR, FORA_SP, PRAZO],
  },
  "campo-belo": {
    intro: [
      "Em Campo Belo a Bewild entregou studios de 22 a 28 m² em prédios como Latitude Campo Belo, Balkon Campo Belo, Modern Campo Belo e Oriz by Plano&Plano. O bairro fica entre Moema e o aeroporto de Congonhas, com a estação Campo Belo da Linha 5-Lilás.",
      "No levantamento da GuestFavorites de 2026, Campo Belo tem 60% de ocupação mediana, diária média de R$ 233 e 1.077 anúncios ativos: diária mais baixa que a de Moema, com a mesma proximidade do aeroporto e do Parque Ibirapuera. Os três contratos Bewild no bairro em 2025 foram para short stay, com reforma mediana de R$ 2.198 por m².",
      "Nos studios de 22 a 28 m² entregues aqui, o projeto resolve cozinha, trabalho e descanso numa planta só, com marcenaria sob medida. O que mais pesa no orçamento é o padrão de acabamento e a metragem, não o bairro.",
    ],
    faq: [
      {
        q: "Quanto custa reformar um studio em Campo Belo?",
        a: "Nos contratos Bewild de 2025, a mediana em Campo Belo foi R$ 2.198 por m², com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Num studio de 26 m², cerca de R$ 57 mil. A tabela por metragem está no guia de custo da Bewild.",
      },
      {
        q: "Campo Belo vale para short stay?",
        a: "No levantamento da GuestFavorites (janeiro a agosto de 2026), o bairro tem 60% de ocupação mediana e diária média de R$ 233, com a demanda de quem chega ou sai por Congonhas. Os três contratos Bewild no bairro em 2025 foram para short stay.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [
      BAIRROS_POST,
      PILAR,
      SHORT_STAY,
      { href: "/conteudos/ar-condicionado-studio-quantos-btus", label: "Tabela de BTU: quantos BTUs um studio precisa" },
    ],
  },
  consolacao: {
    intro: [
      "Na Consolação a Bewild tem os menores apartamentos do portfólio, de 17,23 a 25 m², em prédios como Urban Flex, Maceió 88 by You Inc e Sergipe Boutique Apartments by You; parte deles ainda em fase de projeto.",
      "É o centro expandido em torno da Avenida Paulista, com as estações Consolação (Linha 2-Verde), Paulista e Higienópolis–Mackenzie (Linha 4-Amarela) e o Mackenzie. No levantamento da GuestFavorites de 2026, o bairro tem a maior ocupação mediana entre os que a Bewild acompanha, 63%, com diária média de R$ 269 e 1.612 anúncios: muitas reservas curtas, de estudantes, pacientes e turistas.",
      "Parte dos prédios é antiga, e nesses a convenção precisa ser lida com atenção antes da compra: nem todos permitem locação por temporada, e a parte elétrica e hidráulica pode pedir mais obra do que num lançamento. Nos lançamentos de 17 a 25 m², o projeto de interiores é o que faz a metragem render.",
    ],
    faq: [
      {
        q: "Quanto custa reformar um studio na Consolação?",
        a: "Nos 188 contratos analisados pela Bewild, a reforma completa de até 50 m² custa R$ 2.744 por m² na mediana (R$ 71.850 por reforma), com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Em studios de 17 a 25 m² o valor por m² tende a ficar acima disso, porque cozinha e banheiro custam o mesmo em qualquer metragem.",
      },
      {
        q: "Prédio antigo na Consolação: dá para reformar para short stay?",
        a: "Dá, desde que a convenção permita locação por temporada e a reforma siga a NBR 16280, com plano de reforma e ART ou RRT entregues ao síndico. Em prédio antigo, a parte elétrica e hidráulica costuma entrar no escopo, definido na medição técnica, antes de o preço fechar.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [BAIRROS_POST, NBR, PILAR, SHORT_STAY],
  },
};

export function bairroContent(slug: string): BairroContent | null {
  return BAIRROS_CONTENT[slug] ?? null;
}
