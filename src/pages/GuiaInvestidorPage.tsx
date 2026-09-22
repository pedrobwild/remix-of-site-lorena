import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { breadcrumbJsonLd, faqJsonLd, getCanonicalBase, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./guia-investidor.css";

/* ============================================================
 * GuiaInvestidorPage — /guia-do-investidor
 *
 * Página pilar de SEO, 100% editorial e estática (sem banco, sem
 * formulário próprio). Conteúdo extraído do app "Guia do Investidor"
 * (shortstay-guide.lovable.app); aqui fica a versão indexável no
 * domínio bewild.com.br, apontando para as ferramentas interativas.
 *
 * Regra de conteúdo: nenhuma promessa de renda, ocupação ou
 * rentabilidade. Toda faixa numérica vem com origem e período.
 *
 * Datas do JSON-LD são CONSTANTES (nunca new Date()): a página é
 * editorial e a data muda só quando o texto muda.
 * ============================================================ */

const PUBLISHED = "2026-09-22";
const MODIFIED = "2026-09-22";
const H1 = "Guia do investidor em studios para short stay em São Paulo";
const CANONICAL = "/guia-do-investidor";

/**
 * Faixas por bairro alinhadas ao post já publicado
 * /conteudos/melhores-bairros-short-stay-sao-paulo (fonte: GuestFavorites,
 * jan–ago/2026). A tabela original do app divergia dessa base, então vale a
 * fonte publicada.
 */
const BAIRROS: Array<{ bairro: string; diaria: string; ocupacao: string; receita: string }> = [
  { bairro: "Itaim Bibi", diaria: "R$ 359", ocupacao: "59%", receita: "R$ 77.390" },
  { bairro: "Jardim Paulista", diaria: "R$ 319", ocupacao: "62%", receita: "R$ 72.372" },
  { bairro: "Pinheiros", diaria: "R$ 300", ocupacao: "62%", receita: "R$ 68.335" },
  { bairro: "Consolação", diaria: "R$ 269", ocupacao: "63%", receita: "R$ 61.447" },
  { bairro: "Butantã", diaria: "R$ 276", ocupacao: "61%", receita: "R$ 61.177" },
  { bairro: "Moema", diaria: "R$ 263", ocupacao: "61%", receita: "R$ 58.542" },
  { bairro: "Bela Vista", diaria: "R$ 237", ocupacao: "64%", receita: "R$ 54.942" },
  { bairro: "Campo Belo", diaria: "R$ 233", ocupacao: "60%", receita: "R$ 51.132" },
  { bairro: "Vila Mariana", diaria: "R$ 226", ocupacao: "60%", receita: "R$ 49.446" },
  { bairro: "Perdizes", diaria: "R$ 254", ocupacao: "53%", receita: "R$ 49.423" },
];

const CASCATA: Array<{ linha: string; referencia: string }> = [
  { linha: "Receita bruta", referencia: "diária média × noites ocupadas no mês" },
  { linha: "Comissão da plataforma", referencia: "~15% (anúncio + processamento)" },
  { linha: "Gestão operacional", referencia: "~18% da receita, quando terceirizada" },
  { linha: "Limpeza", referencia: "~R$ 100 por virada, ~8 viradas/mês" },
  { linha: "Condomínio", referencia: "custo fixo mensal, não escala com a receita" },
  { linha: "IPTU e utilidades", referencia: "luz, água, internet, gás" },
  { linha: "Impostos", referencia: "~6% (Simples/MEI)" },
  { linha: "Receita líquida", referencia: "o que sobra depois de tudo" },
];

const CHECKLIST = [
  "Localização com demanda comprovada",
  "Condomínio permite short stay",
  "Análise de concorrência feita",
  "Orçamento de reforma definido",
  "Projeção financeira validada",
  "Fotos profissionais planejadas",
  "Mobília funcional selecionada",
  "Plano de precificação dinâmica",
  "Gestão operacional definida",
  "Documentação fiscal em ordem",
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Quanto custa um studio para short stay em São Paulo?",
    a: "O investimento total costuma ficar entre R$ 250 mil e R$ 600 mil, dependendo do bairro, da metragem e do nível de acabamento. Studios de 25 a 35 m² em bairros como Pinheiros, Vila Mariana e Consolação são os que mais aparecem na faixa de melhor custo-benefício.",
  },
  {
    q: "Qual o retorno esperado de um studio em short stay?",
    a: "O yield bruto observado no mercado varia aproximadamente de 8% a 18% ao ano, conforme bairro, produto e operação. É uma faixa de mercado, não uma projeção: o resultado depende de execução, precificação, sazonalidade e concorrência local, e a Bewild não garante renda ou ocupação.",
  },
  {
    q: "Preciso de CNPJ para operar short stay?",
    a: "Não é obrigatório, mas costuma ser recomendado. Com CNPJ você emite nota fiscal, organiza a tributação e ganha credibilidade junto a plataformas e hóspedes. Confirme o enquadramento com seu contador.",
  },
  {
    q: "O condomínio pode proibir short stay?",
    a: "Pode. A convenção do condomínio é o documento decisivo e pode restringir locação por temporada. Verifique a convenção e as atas de assembleia antes de comprar, e priorize prédios que permitem ou são neutros quanto ao tema.",
  },
  {
    q: "Qual a ocupação média de um studio em São Paulo?",
    a: "As médias observadas ficam entre 65% e 80%, variando por bairro e temporada. Unidades bem operadas em bairros de alta demanda costumam trabalhar na parte de cima dessa faixa.",
  },
  {
    q: "Vale a pena contratar uma administradora?",
    a: "Com uma ou duas unidades e tempo disponível, a autogestão funciona. Acima disso, ou sem disponibilidade, a gestão terceirizada — que costuma cobrar entre 15% e 25% da receita — passa a fazer sentido. É uma troca entre margem e tempo.",
  },
  {
    q: "Quanto custa a reforma de um studio?",
    a: "Depende do estado da unidade e do escopo. Uma reforma inteligente, sem demolições desnecessárias, custa bem menos que uma obra com mudança de instalações; a decoração e o mobiliário entram como linha separada. A Bewild orça por escopo fechado, item a item, antes do início da obra.",
  },
  {
    q: "Qual o melhor bairro para investir em short stay?",
    a: "Depende do orçamento e do perfil de risco. Pinheiros, Vila Mariana e Consolação aparecem com boa relação entre risco e retorno; Itaim Bibi e Vila Olímpia têm diárias mais altas, mas exigem investimento de aquisição maior.",
  },
];

const TOC: Array<{ href: string; label: string }> = [
  { href: "#bairros", label: "Onde investir: como escolher o bairro?" },
  { href: "#unidade", label: "Como avaliar a unidade antes de comprar?" },
  { href: "#condominio", label: "O condomínio pode proibir short stay?" },
  { href: "#matematica", label: "Como funciona a matemática do investimento?" },
  { href: "#performance", label: "O que faz um studio performar?" },
  { href: "#reforma", label: "Reforma inteligente: onde investir e onde não mexer?" },
  { href: "#decoracao", label: "Decoração e fotos: o que muda a diária?" },
  { href: "#anuncio", label: "Como estruturar o anúncio e a precificação?" },
  { href: "#checklist", label: "Checklist do investidor" },
  { href: "#faq", label: "Perguntas frequentes" },
];

export default function GuiaInvestidorPage() {
  const { settings } = useSiteSettings();

  const base = getCanonicalBase(settings);
  const ogImage = settings?.seo_og_image || settings?.default_og_image || undefined;
  const absOg = ogImage
    ? /^https?:\/\//i.test(ogImage)
      ? ogImage
      : `${base}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`
    : undefined;
  const org = { "@type": "Organization", name: "Bewild", url: `${base}/` };

  useSeo({
    title: "Guia do investidor em studios para short stay em SP | Bewild",
    description:
      "Como escolher o bairro, validar a conta, reformar e operar um studio para short stay em São Paulo. Faixas de diária, custos, checklist e FAQ do investidor.",
    canonicalPath: CANONICAL,
    ogType: "article",
    keywords:
      "guia do investidor short stay, studio para airbnb são paulo, investir em studio compacto, rentabilidade short stay sp",
    jsonLd: settings
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: H1,
            inLanguage: "pt-BR",
            author: org,
            publisher: org,
            mainEntityOfPage: `${base}${CANONICAL}`,
            ...(absOg ? { image: absOg } : {}),
            datePublished: PUBLISHED,
            dateModified: MODIFIED,
          },
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Guia do investidor", path: CANONICAL },
          ]),
          faqJsonLd(FAQ_ITEMS),
        ]
      : undefined,
  });

  return (
    <div className="bwa-gi-page">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-gi-intro">
          <div className="bwa-shell">
            <p className="bwa-label">Guia do investidor · Edição 2026</p>
            <h1>{H1}</h1>
            <p className="bwa-gi-lead">
              Um studio de 20 a 40 m² é o formato mais comum de investimento em short stay em
              São Paulo, e a conta dele se decide em quatro perguntas: onde comprar, quanto a
              unidade consegue cobrar por noite, quanto da receita bruta sobra depois dos custos
              e o que a reforma precisa entregar para sustentar a diária. Este guia reúne o que a
              Bewild aprendeu executando reformas de studios na cidade, organizado como um manual
              de decisão — não como promessa de retorno. Nenhum número aqui é garantia: são
              faixas observadas no mercado, que variam por unidade, prédio, execução e operação.
            </p>
            <p className="bwa-mono bwa-gi-stamp">
              Atualizado em setembro de 2026 · Bewild · Resp. técnico Thiago Dantas do Amor,
              CAU A162437-7
            </p>
          </div>
        </section>

        <nav className="bwa-gi-toc" aria-label="Índice do guia">
          <div className="bwa-shell">
            <h2>Índice</h2>
            <ol>
              {TOC.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <section className="bwa-gi-section" id="bairros">
          <div className="bwa-shell">
            <h2>Onde investir: como escolher o bairro?</h2>
            <p>
              A localização define o teto da diária e o piso da ocupação. A tabela abaixo traz a
              diária média observada para anúncios de short stay por bairro em São Paulo, a
              ocupação mediana da região e a receita anual mediana por anúncio, usada como
              referência de comparação entre ativos.
            </p>

            <div className="bwa-gi-tablewrap">
              <table className="bwa-gi-table">
                <thead>
                  <tr>
                    <th scope="col">Bairro</th>
                    <th scope="col">Diária média</th>
                    <th scope="col">Ocupação</th>
                    <th scope="col">Receita anual mediana</th>
                  </tr>
                </thead>
                <tbody>
                  {BAIRROS.map((b) => (
                    <tr key={b.bairro}>
                      <td>{b.bairro}</td>
                      <td>{b.diaria}</td>
                      <td>{b.ocupacao}</td>
                      <td>{b.receita}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bwa-mono bwa-gi-note">
              Ocupação mediana, diária média e receita anual mediana por anúncio: levantamento
              GuestFavorites sobre 34.854 anúncios ativos em São Paulo, janeiro a agosto de 2026,
              compilado pela Bewild — os mesmos números publicados no ranking de bairros do blog.
              São estimativas de referência para tomada de decisão, não projeção de resultado.
            </p>

            <p>
              Duas variáveis deslocam a faixa da tabela para cima ou para baixo dentro do mesmo
              bairro. A metragem: studios abaixo de 25 m² tendem a operar cerca de 8% abaixo da
              média do bairro, e acima de 35 m², cerca de 8% acima. E o nível de acabamento:
              unidades com acabamento e fotos acima da média costumam operar perto de 1,2× a
              faixa base, e unidades com design autoral e operação profissional, perto de 1,45×.
            </p>
            <p>
              Para chegar ao topo da faixa, o conjunto que mais aparece nas unidades bem
              posicionadas é o mesmo: marcenaria planejada, iluminação cênica e fotos
              profissionais.
            </p>
            <p className="bwa-gi-link-line">
              Leia também:{" "}
              <a href="/conteudos/melhores-bairros-short-stay-sao-paulo">
                Os melhores bairros para short stay em São Paulo em 2026
              </a>
              .
            </p>
          </div>
        </section>

        <section className="bwa-gi-section" id="unidade">
          <div className="bwa-shell">
            <h2>Como avaliar a unidade antes de comprar?</h2>
            <p>
              Nem todo studio é bom para short stay. Antes da proposta, vale rodar quatro blocos
              de verificação.
            </p>

            <div className="bwa-gi-cards">
              <article className="bwa-gi-card">
                <h3>Condomínio</h3>
                <ul>
                  <li>Permite short stay (sem restrição em convenção)</li>
                  <li>Portaria 24h ou controle de acesso</li>
                  <li>Áreas comuns relevantes (academia, coworking, lavanderia)</li>
                  <li>Bom estado de conservação e manutenção</li>
                  <li>Vizinhança sem histórico de reclamações contra locação curta</li>
                </ul>
              </article>

              <article className="bwa-gi-card">
                <h3>Unidade</h3>
                <ul>
                  <li>Metragem eficiente (20–40 m²)</li>
                  <li>Planta inteligente (sem corredores desperdiçados)</li>
                  <li>Boa insolação e ventilação natural</li>
                  <li>Andar alto ou posição com menos ruído</li>
                  <li>Banheiro com ventilação (janela ou exaustão)</li>
                  <li>Varanda ou sacada (diferencial competitivo)</li>
                </ul>
              </article>

              <article className="bwa-gi-card">
                <h3>Entorno</h3>
                <ul>
                  <li>Próximo a metrô ou transporte público</li>
                  <li>Bairro com demanda comprovada para short stay</li>
                  <li>Comércio, restaurantes e serviços a pé</li>
                  <li>Região percebida como segura</li>
                  <li>Mercado não saturado (concorrência saudável)</li>
                </ul>
              </article>

              <article className="bwa-gi-card">
                <h3>Due diligence documental</h3>
                <ul>
                  <li>Verificar matrícula atualizada do imóvel</li>
                  <li>Confirmar inexistência de ônus ou penhoras</li>
                  <li>Ler a convenção do condomínio (cláusulas sobre locação)</li>
                  <li>Consultar atas de assembleia recentes</li>
                  <li>Visitar em horários diferentes (ruído, luz, circulação)</li>
                  <li>Verificar estado de instalações (elétrica, hidráulica)</li>
                  <li>Checar pressão de água e funcionamento de ralos</li>
                  <li>Avaliar vedação de janelas e acústica</li>
                  <li>Pesquisar anúncios ativos no mesmo edifício</li>
                  <li>Comparar preço/m² com transações recentes da região</li>
                </ul>
              </article>
            </div>

            <h3>Qual a metragem ideal de um studio para short stay?</h3>
            <p>
              De 25 a 35 m² é o intervalo mais equilibrado para short stay em São Paulo. Abaixo
              de 25 m², o espaço limita a experiência, especialmente em estadias acima de três
              noites. Acima de 40 m², o custo de aquisição e o condomínio sobem sem aumento
              proporcional na diária. Eficiência de planta pesa mais que metragem bruta: uma
              planta de 28 m² bem desenhada pode performar melhor que uma de 35 m² com layout
              ruim. O teste prático é simples — se cama, mesa de trabalho, um assento e armário
              cabem sem comprometer a circulação, a planta é eficiente.
            </p>

            <h3>Comprar para operar ou para revender?</h3>
            <p>
              São dois ativos diferentes. Um bom ativo de operação tem planta eficiente e fácil
              de mobiliar, bairro com demanda real de hóspedes, condomínio acessível que permite
              short stay, decoração viável com investimento controlado e preço de aquisição que
              comporta a conta. Um bom ativo de revenda tem localização premium, acabamento de
              alto padrão e marca do incorporador — mas costuma vir com metragem generosa (que
              reduz a eficiência por m²), condomínio alto que comprime a margem operacional e uma
              demanda de hóspedes que nem sempre justifica a diária necessária. Decida o objetivo
              antes de comparar unidades.
            </p>
          </div>
        </section>

        <section className="bwa-gi-section" id="condominio">
          <div className="bwa-shell">
            <h2>O condomínio pode proibir short stay?</h2>
            <p>
              A convenção do condomínio é o documento decisivo. Procure cláusulas sobre "locação
              por temporada", "hospedagem" ou "uso residencial exclusivo". Quando a convenção é
              silente sobre o tema, há espaço legal para operar — mas isso pode mudar em
              assembleia.
            </p>
            <p>
              <em>Sinais de alerta:</em> proibição explícita de locação por período inferior a 30
              dias, histórico de multas a proprietários que operam short stay, ou assembleia
              recente que deliberou contra.
            </p>
            <p>
              <em>Sinais positivos:</em> outros proprietários já operando na plataforma,
              administradora receptiva e prédio com perfil de investidores, não apenas de
              moradores.
            </p>
            <p className="bwa-gi-link-line">
              <a href="/conteudos/studios-airbnb-sao-paulo-o-que-a-lei-permite">
                Condomínio pode proibir Airbnb? O que o STJ decidiu em 2026
              </a>
              .
            </p>
          </div>
        </section>

        <section className="bwa-gi-section" id="matematica">
          <div className="bwa-shell">
            <h2>Como funciona a matemática do investimento?</h2>
            <p>
              Receita bruta não é o que entra no bolso. A cascata abaixo mostra, em percentuais
              típicos, o que sai da receita antes do resultado líquido.
            </p>

            <div className="bwa-gi-tablewrap">
              <table className="bwa-gi-table">
                <thead>
                  <tr>
                    <th scope="col">Linha</th>
                    <th scope="col">Referência</th>
                  </tr>
                </thead>
                <tbody>
                  {CASCATA.map((l) => (
                    <tr key={l.linha}>
                      <td>{l.linha}</td>
                      <td>{l.referencia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bwa-mono bwa-gi-note">
              Percentuais de referência de mercado, não tabela de preços da Bewild. Variam por
              operação, regime tributário e contrato de gestão.
            </p>

            <h3>Qual métrica usar — yield, ROI ou payback?</h3>
            <p>
              <em>Yield bruto</em> é a receita anual bruta dividida pelo valor do imóvel; serve
              para comparação rápida entre ativos e regiões, mas ignora custos operacionais.{" "}
              <em>Yield líquido</em> usa a receita anual líquida — mais realista, porém dependente
              de premissas de custo que mudam de operação para operação. <em>ROI</em> é o lucro
              líquido sobre o capital total investido (imóvel, reforma, mobília, ITBI); é a
              métrica mais completa e a que exige mais dados. <em>Payback</em> é o capital
              investido dividido pelo lucro líquido mensal, e indica em quantos meses o
              investimento se paga.
            </p>

            <h3>Quais custos os investidores iniciantes esquecem?</h3>
            <ul>
              <li>ITBI: cerca de 3% do valor do imóvel na compra</li>
              <li>Registro e escritura: cerca de 1,5% adicional</li>
              <li>Fundo de reserva: cobrado em muitos condomínios além da taxa ordinária</li>
              <li>
                Reposição de enxoval: toalhas, roupa de cama e itens de cozinha a cada 6 a 12
                meses
              </li>
              <li>
                Manutenção corretiva: reserve um percentual da receita anual para reparos
                inesperados
              </li>
              <li>
                Vacância sazonal: janeiro e períodos entre feriados costumam ter ocupação bem
                menor
              </li>
            </ul>

            <h3>O que mexe mais no retorno?</h3>
            <p>
              Ocupação e diária média puxam a receita; condomínio e custo de operação puxam a
              margem. O ponto é que nenhum fator isolado resolve: um studio com diária média e
              ocupação alta pode render mais que um com diária alta e ocupação baixa, e um
              condomínio barato em bairro bom pode compensar uma diária menor. É a composição que
              decide.
            </p>
            <p className="bwa-gi-link-line">
              <a href="/conteudos/quanto-rende-studio-short-stay-sao-paulo">
                Quanto rende um studio no short stay em São Paulo em 2026
              </a>{" "}
              ·{" "}
              <a href="/conteudos/short-stay-ou-long-stay-studio-compacto">
                Short stay ou aluguel de longa duração: qual rende mais
              </a>
            </p>
          </div>
        </section>

        <section className="bwa-gi-section" id="performance">
          <div className="bwa-shell">
            <h2>O que faz um studio performar?</h2>
            <p>
              Seis fatores aparecem repetidamente na diferença entre um studio que enche e um que
              fica parado.
            </p>
            <ol>
              <li>
                <strong>Limpeza.</strong> É o critério mais citado por hóspedes na escolha e o que
                mais aparece nas avaliações negativas.
              </li>
              <li>
                <strong>Check-in sem atrito.</strong> Fechadura digital ou key box eliminam
                espera. Hóspede corporativo chega tarde — check-in autônomo é decisivo.
              </li>
              <li>
                <strong>Precisão do anúncio.</strong> Fotos reais, descrição honesta, expectativa
                alinhada. Anúncio que entrega o que promete gera menos cancelamento.
              </li>
              <li>
                <strong>Avaliações e nota.</strong> Acima de 4,8 a unidade entra no topo das
                buscas; as primeiras 5 a 10 avaliações definem a posição inicial.
              </li>
              <li>
                <strong>Segurança e acessibilidade.</strong> Portaria 24h, câmeras em áreas
                comuns, boa iluminação.
              </li>
              <li>
                <strong>Ambiente de trabalho e entretenimento.</strong> Wi-Fi rápido, mesa de
                trabalho, smart TV e boa acústica — em estadias de 3+ dias o setup define a
                experiência.
              </li>
            </ol>
          </div>
        </section>

        <section className="bwa-gi-section" id="reforma">
          <div className="bwa-shell">
            <h2>Reforma inteligente: onde investir e onde não mexer?</h2>

            <h3>O que priorizar</h3>
            <p>
              Iluminação gera impacto visual desproporcional ao custo: transforma as fotos, eleva
              a percepção de qualidade e custa bem menos que a troca de bancada. Priorize
              iluminação. Marcenaria vem logo depois — é o que aparece no anúncio. Armários
              fechados protegem os itens dos hóspedes; nichos abertos com iluminação fotografam
              melhor. O equilíbrio entre os dois é uma decisão de projeto, não de gosto.
            </p>

            <h3>Piso vinílico ou porcelanato?</h3>
            <p>
              Para short stay, o vinílico costuma vencer no custo-benefício: é mais barato por m²,
              instala em 1 a 2 dias contra 3 a 5 do porcelanato, é visualmente indistinguível nas
              fotos do anúncio, mais silencioso e mais fácil de reparar — basta trocar a régua
              danificada. O porcelanato faz sentido em áreas molhadas, onde a resistência à água é
              crítica, e em studios de alto padrão, onde a diária mais alta compensa o
              investimento. E se o imóvel já veio com porcelanato em bom estado, não troque:
              aproveite.
            </p>
            <p className="bwa-gi-link-line">
              <a href="/conteudos/piso-vinilico-ou-porcelanato-studio">
                Piso vinílico ou porcelanato no studio para alugar
              </a>
              .
            </p>

            <h3>Anti-checklist — o que NÃO fazer</h3>
            <ul>
              <li>
                <strong>Não troque bancadas novas.</strong> Trocar bancadas em bom estado custa
                milhares de reais e raramente muda a percepção do hóspede. Troque só se estiverem
                danificadas ou com padrão muito datado.
              </li>
              <li>
                <strong>Cuidado com integração de sacada.</strong> Custo alto e risco com as
                regras do condomínio. Avalie se o ganho de espaço justifica, e verifique a
                convenção antes.
              </li>
              <li>
                <strong>Não mexa no revestimento do banheiro.</strong> Remover o revestimento
                original pode comprometer a impermeabilização, cuja garantia costuma ser de cinco
                anos. Risco de infiltração e custo imprevisível.
              </li>
              <li>
                <strong>Evite demolições e mudança de instalações.</strong> Prefira resolver com
                marcenaria e layout. Mover pontos hidráulicos ou elétricos encarece e atrasa.
              </li>
            </ul>
            <p>
              Evitar demolições desnecessárias e priorizar marcenaria e layout libera orçamento
              para decoração e fotos, onde o retorno é mais direto.
            </p>

            <h3>Quando demolir faz sentido?</h3>
            <p>
              Apenas quando o layout atual impede a funcionalidade básica do studio — cozinha
              inacessível, banheiro sem ventilação mínima — e quando a conta fecha. Antes de
              decidir, faça a matemática: se a demolição custa R$ 10.000 e o ganho mensal
              projetado é R$ 300, o payback passa de 33 meses. Consulte um arquiteto com
              experiência em short stay antes.
            </p>
            <p className="bwa-gi-link-line">
              <a href="/conteudos/quanto-custa-reformar-studio-short-stay-sao-paulo">
                Quanto custa reformar um studio em São Paulo em 2026
              </a>{" "}
              ·{" "}
              <a href="/conteudos/cronograma-reforma-studio-60-dias-uteis">
                Cronograma de uma reforma de studio: 60 dias úteis, semana a semana
              </a>{" "}
              · <a href="/conteudos/nbr-16280-reforma-studio-condominio">NBR 16280 na prática</a>
            </p>
          </div>
        </section>

        <section className="bwa-gi-section" id="decoracao">
          <div className="bwa-shell">
            <h2>Decoração e fotos: o que muda a diária?</h2>
            <p>
              A decoração de um studio de short stay não é decoração residencial. Ela responde a
              três exigências ao mesmo tempo: fotografar bem, resistir ao uso intenso e caber no
              orçamento.
            </p>
            <ul>
              <li>
                <strong>Fotos profissionais</strong> são o maior retorno por real investido: a
                primeira imagem concentra a maior parte dos cliques no anúncio. Fotografe com luz
                natural, enquadramento amplo, mostrando o ambiente inteiro.
              </li>
              <li>
                <strong>Identidade visual consistente.</strong> Um conceito definido (paleta,
                materiais, uma peça marcante) diferencia o anúncio de dezenas de studios iguais no
                mesmo bairro.
              </li>
              <li>
                <strong>Colchão e enxoval padrão hotel.</strong> Sono é um dos maiores
                determinantes de avaliação. Colchão de qualidade, dois tipos de travesseiro,
                protetor impermeável, jogo de cama reserva.
              </li>
              <li>
                <strong>Cortina blackout de verdade</strong>, com vedação lateral.
              </li>
              <li>
                <strong>Wi-Fi rápido e mesa de trabalho.</strong> Para estadia de trabalho remoto,
                é filtro de busca.
              </li>
              <li>
                <strong>Materiais que resistem ao uso intenso</strong> — o custo de manutenção
                aparece no segundo ano.
              </li>
            </ul>
            <p className="bwa-gi-link-line">
              <a href="/conteudos/preparar-studio-airbnb-checklist">
                Como preparar um studio para Airbnb: o que muda na diária
              </a>
              .
            </p>
          </div>
        </section>

        <section className="bwa-gi-section" id="anuncio">
          <div className="bwa-shell">
            <h2>Como estruturar o anúncio e a precificação?</h2>

            <h3>Anúncio</h3>
            <ul>
              <li>
                <strong>Título com localização e diferencial.</strong> O título aparece na busca:
                inclua bairro, metrô próximo e o diferencial principal.
              </li>
              <li>
                <strong>Descrição orientada a benefício.</strong> Não liste features — mostre como
                cada item resolve uma necessidade real. "Wi-Fi 300 Mbps, ideal para trabalho
                remoto" vale mais que "tem Wi-Fi". Evite superlativos genéricos.
              </li>
              <li>
                <strong>Amenidades completas.</strong> Cada amenidade é um possível filtro do
                hóspede. Marque todas as reais, inclusive as óbvias.
              </li>
              <li>
                <strong>Foto de capa irresistível.</strong> Luz natural, enquadramento amplo, um
                elemento memorável.
              </li>
            </ul>

            <h3>Precificação</h3>
            <ul>
              <li>
                <strong>Comece pelo volume.</strong> Nas primeiras semanas, priorize reservas e
                avaliações: elas definem a posição no algoritmo.
              </li>
              <li>
                <strong>Suba gradualmente.</strong> Com avaliações positivas, aumentos
                escalonados, monitorando a taxa de conversão. Se cair, volte um degrau.
              </li>
              <li>
                <strong>Preço dinâmico.</strong> Ferramentas de precificação automática capturam
                picos que ninguém monitora manualmente. Defina piso, teto e regras por temporada.
              </li>
              <li>
                <strong>Estadia mínima inteligente.</strong> Mínimos maiores em fim de semana e
                alta temporada reduzem viradas e custo de limpeza.
              </li>
              <li>
                <strong>Datas-chave de São Paulo.</strong> Carnaval, F1, festivais, feriados
                prolongados e eventos corporativos: antecipe a precificação.
              </li>
            </ul>
            <p className="bwa-gi-link-line">
              <a href="/conteudos/airbnb-ou-booking">Airbnb ou Booking? Onde anunciar seu studio</a>{" "}
              ·{" "}
              <a href="/conteudos/gestao-propria-vs-gestora">
                Gestão própria vs. gestora profissional
              </a>
            </p>
          </div>
        </section>

        <section className="bwa-gi-section" id="checklist">
          <div className="bwa-shell">
            <h2>Checklist do investidor</h2>
            <p>Dez itens que precisam estar resolvidos antes de assinar a compra.</p>
            <ol>
              {CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bwa-gi-section bwa-gi-faq" id="faq">
          <div className="bwa-shell">
            <h2>Perguntas frequentes</h2>
            {FAQ_ITEMS.map((item, i) => (
              <details key={item.q} open={i === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bwa-gi-section">
          <div className="bwa-shell">
            <div className="bwa-gi-tools">
              <h2>Ferramentas interativas do guia</h2>
              <p>
                As versões interativas (simulador de receita, mapa de bairros e comparador de
                cenários) ficam no app do Guia do Investidor.
              </p>
              <ul>
                <li>
                  <a
                    href="https://shortstay-guide.lovable.app/#simulador"
                    target="_blank"
                    rel="noopener"
                  >
                    Simulador de receita
                  </a>
                </li>
                <li>
                  <a
                    href="https://shortstay-guide.lovable.app/#mapa-bairros"
                    target="_blank"
                    rel="noopener"
                  >
                    Mapa de bairros de São Paulo
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bwa-gi-cta">
          <div className="bwa-shell">
            <h2>Quer avaliar o seu studio?</h2>
            <p>
              A Bewild faz projeto, reforma, marcenaria e mobiliário do studio em um contrato só,
              com escopo, preço e prazo fechados antes do início da obra.
            </p>
            <a className="bwa-button" href="/orcamento">
              Solicitar orçamento
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section className="bwa-gi-disclaimer">
          <div className="bwa-shell">
            <p className="bwa-mono">
              As faixas e percentuais deste guia são referências de mercado coletadas pela Bewild
              a partir de bases do setor, com médias trimestrais da edição 2026. Não constituem
              promessa nem projeção de rendimento. Resultados reais dependem de localização,
              produto, execução da reforma, qualidade das fotos, gestão operacional, sazonalidade
              e concorrência. A Bewild não garante renda, ocupação ou rentabilidade.
            </p>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
