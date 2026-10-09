/**
 * Texto próprio das páginas de bairro (/reforma/<bairro>): os cinco com mais
 * projetos (CONT-03 da auditoria de 05/10/2026) e, desde a rodada 3 de
 * 06/10/2026, os outros 11 bairros do sitemap. Só
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
const PRAZO = { href: "/conteudos/quanto-tempo-demora-reforma-apartamento", label: "Quanto tempo demora a reforma: prazo por metragem e cronograma" };
const FORA_SP = {
  href: "/conteudos/reformar-studio-sao-paulo-morando-em-outra-cidade",
  label: "Reformar um studio em São Paulo morando em outra cidade",
};

const PRAZO_FAQ =
  "Cerca de 60 dias úteis de obra para studios e apartamentos compactos de até 30 m², com a data de entrega em contrato e multa por dia de atraso. Metragens maiores ou integração de varanda levam mais; o cronograma por etapa é definido antes de a obra começar.";

const CUSTO_FAQ_CIDADE =
  "Nos 188 contratos analisados pela Bewild, a reforma completa de até 50 m² custa R$ 2.744 por m² na mediana (R$ 71.850 por reforma), com projeto, obra, marcenaria, mobiliário e eletrodomésticos. O bairro pesa menos no preço do que a metragem e o padrão de acabamento; a tabela por metragem e a fórmula de bolso estão no guia de custo da Bewild.";
const CONDOMINIO_FAQ =
  "Antes de a obra começar, a Bewild entrega ao síndico o plano de reforma exigido pela NBR 16280, com ART ou RRT do responsável técnico, cronograma e horários de trabalho dentro do que a convenção permite. Em prédio novo, também conferimos o padrão de envidraçamento da varanda e a infraestrutura de ar-condicionado prevista pela construtora.";
const HIS_HMP = { href: "/conteudos/studio-his-ou-hmp-o-que-fazer", label: "Studio HIS ou HMP: o que fazer" };
const VARANDA = { href: "/conteudos/fechar-varanda-em-vidro-studio-condominio", label: "Fechar varanda com vidro: custo e regra do condomínio" };
const COMPARAR = { href: "/conteudos/como-comparar-orcamentos-de-reforma", label: "Como comparar orçamentos de reforma" };
const ANTIGO = { href: "/conteudos/reforma-de-apartamento-antigo-sao-paulo", label: "Reforma de apartamento antigo em São Paulo" };
const APTO_SP = { href: "/reforma-de-apartamento-sao-paulo", label: "Reforma de apartamento em São Paulo" };

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
  higienopolis: {
    intro: [
      "Em Higienópolis a Bewild reformou studios e apartamentos de 23 a 31,67 m² em prédios como Maceió 88, Elements Higienópolis e Aria Higienópolis. É um dos bairros mais tradicionais de São Paulo, com o Mackenzie, o Pátio Higienópolis e a estação Higienópolis–Mackenzie, da Linha 4-Amarela, a poucas quadras.",
      "O bairro mistura prédios antigos de apartamentos grandes com lançamentos compactos recentes. Nos compactos novos, a planta é parecida de um prédio para o outro, e é o projeto de interiores — marcenaria sob medida, iluminação e a escolha do que não mexer — que faz a metragem render. Nos antigos, a parte elétrica e hidráulica costuma entrar no escopo, definido na medição técnica antes de o preço fechar.",
      "A demanda vem de quem estuda ou trabalha na região e de quem busca morar em bairro arborizado e bem servido de comércio a pé. A convenção de cada prédio decide se a unidade pode ser alugada por temporada; é o primeiro documento que lemos antes de desenhar o projeto.",
    ],
    faq: [
      { q: "Quanto custa reformar um apartamento em Higienópolis?", a: CUSTO_FAQ_CIDADE },
      {
        q: "Prédio antigo em Higienópolis: o que muda na reforma?",
        a: "Em prédios antigos, a elétrica e a hidráulica costumam entrar no escopo, e a convenção e o regimento interno definem horários de obra e o que pode mudar na fachada. Tudo isso é levantado na medição técnica, antes do preço fechado, para a obra não ter aditivo.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [ANTIGO, PILAR, NBR, COMPARAR],
  },
  moema: {
    intro: [
      "Em Moema a Bewild reformou apartamentos de 27,46 a 38,53 m² em prédios como Collection Moema, The Collection Moema e Composite Moema. O bairro fica entre o Parque Ibirapuera e o aeroporto de Congonhas, com as estações Moema e Eucaliptos, da Linha 5-Lilás.",
      "No levantamento da GuestFavorites de 2026, Moema tem 61% de ocupação mediana, diária média de R$ 263 e 2.621 anúncios ativos — um dos maiores volumes de oferta da cidade, puxado por quem chega ou sai por Congonhas e por quem visita o Ibirapuera. Com tanta oferta, a qualidade do projeto e da foto do anúncio é o que separa um imóvel que reserva de outro que fica parado.",
      "As metragens de Moema são um pouco maiores que a média dos studios que a Bewild reforma, o que abre espaço para separar dormir, trabalhar e receber sem perder a integração. O que mais pesa no orçamento é o padrão de acabamento e a metragem, não o bairro.",
    ],
    faq: [
      { q: "Quanto custa reformar um apartamento em Moema?", a: CUSTO_FAQ_CIDADE },
      {
        q: "Moema vale para short stay?",
        a: "No levantamento da GuestFavorites (janeiro a agosto de 2026), o bairro tem 61% de ocupação mediana, diária média de R$ 263 e 2.621 anúncios ativos. Há demanda o ano inteiro, mas também muita oferta: o anúncio precisa se destacar em foto, layout e avaliações. A convenção do prédio precisa permitir locação por temporada.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [BAIRROS_POST, PILAR, SHORT_STAY, { href: "/conteudos/o-que-move-reservas-studio-airbnb", label: "O que move as reservas de um studio no Airbnb" }],
  },
  paulista: {
    intro: [
      "No entorno da Avenida Paulista a Bewild reformou studios de 23,28 a 27 m² em prédios como Citzy Paulista, Nik Paulista e The Collection Paulista. A região é servida pelas estações Consolação, Trianon–Masp e Brigadeiro, da Linha 2-Verde, e pela Paulista, da Linha 4-Amarela, com o polo hospitalar, o MASP e os escritórios da avenida a pé.",
      "A Paulista é divisa entre bairros com perfis diferentes: no levantamento da GuestFavorites de 2026, Jardim Paulista tem 62% de ocupação mediana e diária média de R$ 319; Bela Vista, 64% e R$ 237; Consolação, 63% e R$ 269. Muitas reservas curtas, de pacientes, estudantes e turistas, e demanda de quem compra para morar perto do trabalho.",
      "Nos studios de 23 a 27 m² entregues aqui, o projeto resolve cozinha, trabalho e descanso numa planta só, com marcenaria sob medida e acabamento pensado para a foto do anúncio ou para o dia a dia de quem mora. Em prédio antigo da região, a convenção e as instalações pedem leitura atenta antes do escopo.",
    ],
    faq: [
      { q: "Quanto custa reformar um studio perto da Paulista?", a: CUSTO_FAQ_CIDADE },
      {
        q: "Studio na Paulista vale para short stay?",
        a: "Os bairros em volta da avenida têm as maiores ocupações medianas do levantamento da GuestFavorites de 2026 (62% a 64%), com diárias entre R$ 237 e R$ 319 conforme o lado da avenida. O que decide é o prédio: a convenção precisa permitir locação por temporada, e unidades HIS ou HMP não podem operar.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [BAIRROS_POST, PILAR, SHORT_STAY, NBR],
  },
  perdizes: {
    intro: [
      "Em Perdizes a Bewild reformou studios de 24 a 29,73 m² em prédios como Cyrela by You Perdizes, Soma Perdizes, Think Tanabi, The Collection PUC e Nex One Estação Perdizes. O bairro tem a PUC-SP, o Allianz Parque e a Avenida Sumaré, e faz divisa com Pompeia, Vila Madalena e Pacaembu.",
      "No levantamento da GuestFavorites de 2026, Perdizes teve a menor ocupação mediana entre os bairros acompanhados, 53%, com diária média de R$ 254 e 1.752 anúncios ativos. Mesmo assim, foi o terceiro bairro em contratos Bewild em 2025: sete, seis deles para short stay. É um bairro em que a qualidade do anúncio separa quem reserva de quem não reserva.",
      "Nos contratos Bewild de 2025, a reforma completa em Perdizes teve mediana de R$ 2.493 por m², acima da mediana da cidade (R$ 2.389). Parte dos lançamentos da região é HIS ou HMP, classificações que não permitem locação por temporada; isso precisa ser conferido na documentação antes da compra.",
    ],
    faq: [
      {
        q: "Quanto custa reformar um studio em Perdizes?",
        a: "Nos contratos Bewild de 2025, a mediana em Perdizes foi R$ 2.493 por m², com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Num studio de 28 m², algo em torno de R$ 70 mil. A tabela por metragem está no guia de custo da Bewild.",
      },
      {
        q: "Perdizes vale para short stay?",
        a: "A ocupação mediana do bairro no levantamento da GuestFavorites (53%) é a menor da lista, mas a diária média de R$ 254 e a demanda da PUC e do Allianz Parque sustentam os anúncios bem feitos: seis dos sete contratos Bewild no bairro em 2025 foram para short stay. Confira antes se a unidade não é HIS ou HMP.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [BAIRROS_POST, HIS_HMP, PILAR, { href: "/conteudos/o-que-move-reservas-studio-airbnb", label: "O que move as reservas de um studio no Airbnb" }],
  },
  republica: {
    intro: [
      "Na República a Bewild reformou apartamentos de 17 a 38,58 m² em prédios como Metrocasa República, Galleria SP e Brasílio 177 — entre eles, um dos menores do portfólio, com 17 m². O bairro é o centro histórico de São Paulo, com a estação República (Linhas 3-Vermelha e 4-Amarela), o Theatro Municipal e a Praça da República.",
      "A região recebeu muitos lançamentos compactos nos últimos anos e tem demanda de quem trabalha no centro e de turistas, com diárias menores que as da Paulista e da zona oeste. Em plantas de 17 a 25 m², cada centímetro é decidido em projeto: cama, cozinha, trabalho e armazenamento precisam caber sem apertar.",
      "Prédios antigos convivem com lançamentos: nos antigos, elétrica, hidráulica e convenção entram na leitura antes do escopo; nos novos, o que mais muda o orçamento é o padrão de acabamento e o que não precisa ser trocado do que a construtora entregou.",
    ],
    faq: [
      { q: "Quanto custa reformar um studio na República?", a: CUSTO_FAQ_CIDADE },
      {
        q: "Dá para fazer um studio de 17 m² funcionar?",
        a: "Dá, com projeto. A Bewild já reformou unidades de 17 m² no centro: a marcenaria sob medida resolve cama, armário, bancada de trabalho e cozinha numa planta só, e a iluminação e o acabamento fazem o espaço parecer maior na foto e no uso. O estudo de layout vem antes do orçamento.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [{ href: "/conteudos/estudo-de-layout-studio-25-m2", label: "Estudo de layout de um studio de 25 m²" }, PILAR, ANTIGO, SHORT_STAY],
  },
  "santo-amaro": {
    intro: [
      "Em Santo Amaro a Bewild reformou studios e apartamentos de 22,02 a 38 m² em prédios como Greenview Brooklin, Level Brooklin e La Vida, na divisa com o Brooklin, no eixo das avenidas Chucri Zaidan e Berrini. A região tem a estação Santo Amaro, da Linha 5-Lilás e da Linha 9-Esmeralda da CPTM, e o Largo Treze.",
      "A demanda é a do polo corporativo da zona sul: quem trabalha na Berrini e na Chucri Zaidan durante a semana e procura um studio pronto, bem localizado e com boa internet. Parte dos contratos Bewild na região foi para short stay, com o mesmo perfil do Brooklin, vizinho.",
      "Os prédios são novos e as plantas, parecidas entre si; o projeto de interiores é o que diferencia o anúncio e o dia a dia de quem mora. O que mais pesa no orçamento é o padrão de acabamento e a metragem, não o bairro.",
    ],
    faq: [
      { q: "Quanto custa reformar um studio em Santo Amaro?", a: CUSTO_FAQ_CIDADE },
      {
        q: "Dá para reformar em Santo Amaro morando em outra cidade?",
        a: "Sim. Vistoria por procuração, ligação de energia, instalação de internet e atendimento de emergências ficam com a Bewild, e você acompanha a obra pelo Bwild Workflow, com relatórios semanais e fotos. O escritório da Bewild fica no Brooklin, a poucos minutos.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [PILAR, FORA_SP, PRAZO, SHORT_STAY],
  },
  "vila-clementino": {
    intro: [
      "Na Vila Clementino a Bewild reformou apartamentos de 25,64 a 31,58 m² em prédios como Organy Essencial Vila Clementino, Yby Urban Home, Casa Ibirapuera e Exalt Ibirapuera. O bairro fica entre o Parque Ibirapuera e a Unifesp, com as estações Santa Cruz (Linhas 1-Azul e 5-Lilás) e Hospital São Paulo (Linha 5-Lilás).",
      "A demanda vem do polo de saúde da região — Hospital São Paulo, Unifesp e clínicas — e do parque: pacientes, acompanhantes, residentes e profissionais de saúde que ficam por semanas, além de quem compra para morar. Para short stay, isso costuma significar estadias mais longas que as de turismo.",
      "As metragens de 25 a 32 m² permitem separar o canto de dormir do de trabalhar sem perder a integração. Em prédio novo, vale conferir na convenção o padrão de envidraçamento da varanda e a infraestrutura de ar-condicionado antes de fechar o escopo.",
    ],
    faq: [
      { q: "Quanto custa reformar um apartamento na Vila Clementino?", a: CUSTO_FAQ_CIDADE },
      { q: "O que o condomínio exige antes da obra?", a: CONDOMINIO_FAQ },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [PILAR, NBR, VARANDA, SHORT_STAY],
  },
  "vila-madalena": {
    intro: [
      "Na Vila Madalena a Bewild reformou studios e apartamentos de 23 a 38,68 m² em prédios como Península Vila Madalena, On Vila Madalena, Nurban Vila Madalena e The Collection Madalena. O bairro tem a estação Vila Madalena, da Linha 2-Verde, e fica ao lado de Pinheiros, com a Fradique Coutinho, da Linha 4-Amarela, a poucas quadras.",
      "É o bairro dos bares, dos ateliês e do Beco do Batman: demanda de turismo e de lazer no fim de semana, e de quem trabalha em Pinheiros e na Faria Lima durante a semana. Quem compra para morar procura a vida de bairro a pé; quem compra para alugar procura a foto que combina com a Vila.",
      "Nos studios de 23 a 28 m² entregues aqui, o projeto resolve cozinha, trabalho e descanso numa planta só, com marcenaria sob medida. Um antes e depois de um studio de 26 m² na Vila Madalena está nos conteúdos da Bewild.",
    ],
    faq: [
      { q: "Quanto custa reformar um studio na Vila Madalena?", a: CUSTO_FAQ_CIDADE },
      {
        q: "Vila Madalena vale para short stay?",
        a: "O bairro tem demanda de lazer e turismo no fim de semana e de quem trabalha em Pinheiros e na Faria Lima durante a semana; Pinheiros, ao lado, tem 62% de ocupação mediana e diária média de R$ 300 no levantamento da GuestFavorites de 2026. O que decide é o prédio: a convenção precisa permitir locação por temporada.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [
      { href: "/conteudos/antes-e-depois-studio-26-m2-vila-madalena", label: "Antes e depois: studio de 26 m² na Vila Madalena" },
      BAIRROS_POST,
      PILAR,
      SHORT_STAY,
    ],
  },
  "vila-mariana": {
    intro: [
      "Na Vila Mariana a Bewild reformou apartamentos de 31,43 a 41,34 m² em prédios como Nex One Paraíso, Today Vila Mariana e Patteo Klabin — metragens maiores que a média dos studios do portfólio. O bairro tem as estações Vila Mariana, Ana Rosa e Paraíso, da Linha 1-Azul, e o Parque Ibirapuera a pé.",
      "No levantamento da GuestFavorites de 2026, Vila Mariana tem 60% de ocupação mediana, diária média de R$ 226 e 2.238 anúncios ativos: a porta de entrada mais barata da zona sul, com metrô e hospitais. Dois contratos Bewild no bairro em 2025. Parte dos lançamentos da região é HIS ou HMP, classificações que não permitem locação por temporada.",
      "Em apartamentos de 31 a 41 m², o projeto separa dormir, trabalhar e receber sem perder a integração, e a marcenaria sob medida resolve armazenamento e home office. Para metragens maiores, veja também a reforma de apartamento em São Paulo.",
    ],
    faq: [
      { q: "Quanto custa reformar um apartamento na Vila Mariana?", a: CUSTO_FAQ_CIDADE },
      {
        q: "Vila Mariana vale para short stay?",
        a: "No levantamento da GuestFavorites (janeiro a agosto de 2026), o bairro tem 60% de ocupação mediana, diária média de R$ 226 e 2.238 anúncios ativos, com demanda de hospitais, metrô e Ibirapuera. Confira antes se a unidade não é HIS ou HMP e se a convenção permite locação por temporada.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [BAIRROS_POST, HIS_HMP, PILAR, APTO_SP],
  },
  "vila-nova-conceicao": {
    intro: [
      "Na Vila Nova Conceição a Bewild reformou studios de 21,3 a 25,73 m² em prédios como Living Full Vila Nova Conceição, Voxx Itaim, Nex One Pereira e Next One Vila Nova. O bairro fica entre o Parque Ibirapuera e o Itaim Bibi, em torno da Praça Pereira Coutinho e da Rua Afonso Braz.",
      "É um dos bairros de maior valor por metro quadrado da cidade, residencial e arborizado, sem estação de metrô dentro dos limites: a demanda vem de quem quer morar perto do parque e do Itaim e de quem trabalha na Faria Lima e na Juscelino Kubitschek. Itaim Bibi, vizinho, lidera o levantamento da GuestFavorites de 2026 em receita anual mediana por anúncio, com diária média de R$ 359.",
      "Nos studios de 21 a 26 m² entregues aqui, o padrão de acabamento acompanha o do bairro: marcenaria sob medida, iluminação em camadas e materiais escolhidos para a foto e para durar. O que mais pesa no orçamento é esse padrão e a metragem, não o endereço.",
    ],
    faq: [
      { q: "Quanto custa reformar um studio na Vila Nova Conceição?", a: CUSTO_FAQ_CIDADE },
      {
        q: "Vila Nova Conceição vale para short stay?",
        a: "O bairro não tem página própria no levantamento da GuestFavorites de 2026, mas o Itaim Bibi, vizinho, lidera em receita anual mediana por anúncio (R$ 77.390) com diária média de R$ 359 e 59% de ocupação. A demanda é de executivos e de quem visita a região da Faria Lima. A convenção do prédio precisa permitir locação por temporada.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [BAIRROS_POST, PILAR, COMPARAR, SHORT_STAY],
  },
  "vila-olimpia": {
    intro: [
      "Na Vila Olímpia a Bewild reformou studios de 25 a 28 m² em prédios como Do It Vila Olímpia, Vibe Vila Olímpia e Today Faria Lima. O bairro fica entre a Faria Lima e a Berrini, com a estação Vila Olímpia da Linha 9-Esmeralda da CPTM e o Shopping Vila Olímpia.",
      "É, com o Brooklin, o bairro corporativo da zona sul: a demanda vem de quem trabalha nos escritórios da região durante a semana e procura um studio pronto, silencioso e com boa internet. O levantamento de mercado da GuestFavorites não tem página para a Vila Olímpia; o que a Bewild sabe vem dos próprios contratos: três em 2025, todos para short stay.",
      "Nos contratos Bewild de 2025, a reforma completa na Vila Olímpia teve mediana de R$ 2.539 por m², com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Os prédios são novos e as plantas, parecidas entre si; o projeto de interiores é o que diferencia o anúncio.",
    ],
    faq: [
      {
        q: "Quanto custa reformar um studio na Vila Olímpia?",
        a: "Nos contratos Bewild de 2025, a mediana na Vila Olímpia foi R$ 2.539 por m², com projeto, obra, marcenaria, mobiliário e eletrodomésticos. Num studio de 26 m², cerca de R$ 66 mil. A tabela por metragem está no guia de custo da Bewild.",
      },
      {
        q: "Vila Olímpia vale para short stay?",
        a: "Os três contratos Bewild no bairro em 2025 foram para short stay, com demanda de quem trabalha na Faria Lima e na Berrini durante a semana. O levantamento da GuestFavorites não cobre o bairro; a conta de ocupação e diária precisa ser feita com dados do próprio prédio e da gestora. A convenção precisa permitir locação por temporada.",
      },
      { q: "Quanto tempo leva a obra?", a: PRAZO_FAQ },
    ],
    posts: [BAIRROS_POST, PILAR, FORA_SP, SHORT_STAY],
  },
};

export function bairroContent(slug: string): BairroContent | null {
  return BAIRROS_CONTENT[slug] ?? null;
}
