import { useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { CONTACT } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { isLeadDelivered, timeoutAfter } from "@/lib/leadDelivery";
import { trackEvent } from "@/lib/ga4";
import { useCtaClickTracking } from "@/lib/trackCta";
import { breadcrumbJsonLd, faqJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import "./faq-page.css";
import "./contato.css";
import "./parceiros.css";

/* ============================================================
 * ParceirosPage — /parceiros
 * Corretores, imobiliárias e incorporadoras.
 * A página não vende reforma: vende remoção de objeção de venda
 * imobiliária ("e depois, quem reforma isso?"). Estrutura de 12
 * blocos conforme a especificação de 22/09/2026.
 *
 * Decisões travadas com o dono:
 * - Comissão SEM percentual público — só as regras do contrato.
 * - Leal Moreira citado com autorização (selo + bloco de prova).
 * ============================================================ */

const INDICACAO_URL = "https://forms.gle/vG9n5bWb4Rc7vEV56";

const TIPOS = [
  "Corretor autônomo",
  "Imobiliária",
  "Incorporadora",
  "Arquiteto(a)",
  "Administradora de locação",
];

const RAZOES = [
  {
    n: "01",
    t: "O studio de 20 a 35 m² é o centro, não a exceção",
    d: "Outras reformadoras cortam abaixo de 60 m² ou de R$ 100 mil. O corretor que vende studio fica sem fornecedor — e o comprador trava na pergunta “quem reforma isso?”. A Bewild existe exatamente para esse imóvel.",
  },
  {
    n: "02",
    t: "O comprador mora longe e decide à distância",
    d: "Quase metade dos nossos clientes mora fora da capital. Quem vende lançamento para investidor de outro estado precisa de um executante que o cliente acompanha de onde estiver — com foto, etapa e registro no Bwild Workflow.",
  },
  {
    n: "03",
    t: "Preço e prazo em contrato, com 5 anos de garantia",
    d: "O corretor não precisa prometer nada do próprio bolso. O que está no contrato Bewild é da Bewild: escopo, valor, prazo e garantia. A promessa que segura a assinatura da venda não é sua — é nossa.",
  },
  {
    n: "04",
    t: "O imóvel sai da obra pronto para anunciar",
    d: "Projeto, obra, marcenaria e mobília em um único contrato. O apartamento é entregue mobiliado e fotografável — pronto para morar, para o anúncio de locação ou para a primeira reserva de curta temporada.",
  },
];

const PASSOS = [
  {
    n: "01",
    t: "Cadastro de parceiro",
    d: "Dois minutos, no formulário desta página. Tipo de atuação, região e volume — o suficiente para priorizarmos quem indica com frequência.",
    tempo: "2 min",
  },
  {
    n: "02",
    t: "Registro da indicação",
    d: "Cada cliente indicado entra no formulário oficial de indicação. O registro vale por 12 meses: se o cliente fechar nesse período, a indicação é sua.",
    tempo: "2 min",
  },
  {
    n: "03",
    t: "Primeira conversa com o cliente",
    d: "Nossa equipe chama o indicado em até 1 dia útil, se apresenta como Bewild e conduz o diagnóstico do imóvel. Você é informado do andamento.",
    tempo: "até 1 dia útil",
  },
  {
    n: "04",
    t: "Proposta e contrato",
    d: "O cliente recebe escopo, preço e prazo fechados. Se assinar, a obra entra no Bwild Workflow — e você acompanha o status no relatório mensal.",
    tempo: "conforme o cliente",
  },
  {
    n: "05",
    t: "Comissão após o recebimento",
    d: "A comissão é calculada sobre o que o cliente efetivamente pagou, dentro dos prazos do termo de parceria. Sem adiantamento e sem letra miúda.",
    tempo: "regras abaixo",
  },
];

// Regras do contrato de parceria, sem o percentual (decisão do dono:
// o número fica para o termo individual, a página publica as regras).
const REGRAS_COMISSAO = [
  {
    regra: "Base de cálculo líquida",
    detalhe:
      "A comissão incide sobre o valor líquido do contrato: fora da base entram impostos (ISS, PIS, COFINS, IRPJ, CSLL), descontos, glosas e devoluções.",
  },
  {
    regra: "Contrato à vista",
    detalhe:
      "Parcela única de comissão em até 30 dias corridos do recebimento do valor pelo cliente.",
  },
  {
    regra: "Contrato parcelado",
    detalhe:
      "A comissão é dividida a partir da 2ª parcela e paga em até 10 dias úteis após cada recebimento.",
  },
  {
    regra: "Só sobre o efetivamente recebido",
    detalhe: "Não há adiantamento de comissão: ela acompanha o que o cliente pagou, quando pagou.",
  },
  {
    regra: "Aditivo não entra na base",
    detalhe:
      "Serviços complementares contratados depois (aditivos) não alteram a comissão da indicação original.",
  },
  {
    regra: "Indicação válida por 12 meses",
    detalhe:
      "Registrada a indicação, ela vale por 12 meses. Se o cliente fechar nesse período, a comissão é devida.",
  },
  {
    regra: "Cliente já em negociação não comissiona",
    detalhe:
      "Não há comissão para cliente que já estava em negociação com a Bewild ou chegou por canal próprio.",
  },
  {
    regra: "Distrato devolve proporcionalmente",
    detalhe:
      "Se o contrato for distratado, a comissão sobre valores devolvidos ao cliente é restituída ou compensada nas parcelas seguintes.",
  },
  {
    regra: "Parceria não exclusiva",
    detalhe:
      "Você continua livre para indicar outros fornecedores — e a Bewild continua livre para receber indicações de outros parceiros.",
  },
  {
    regra: "Nota fiscal como condição de pagamento",
    detalhe:
      "O pagamento da comissão é feito contra nota fiscal de intermediação, como previsto no termo de parceria.",
  },
  {
    regra: "Relatório mensal",
    detalhe:
      "Todo mês você recebe o status de cada indicação: contratos, recebimentos e comissões, linha a linha.",
  },
];

const FAQ_PARCEIRO = [
  {
    q: "Qual é o percentual de comissão?",
    a: "O percentual é definido no termo de parceria, por perfil e volume de indicações. O que é público são as regras — base líquida, prazos de pagamento, validade de 12 meses e relatório mensal — reproduzidas nesta página, linha a linha, para você saber exatamente como a comissão é calculada antes de assinar qualquer coisa.",
  },
  {
    q: "Como registro uma indicação e por quanto tempo ela vale?",
    a: "Pelo formulário oficial de indicação, linkado nesta página. São 2 minutos: dados do cliente e do imóvel. O registro vale por 12 meses — se o cliente fechar contrato nesse período, a indicação é sua, mesmo que ele volte a falar com a Bewild meses depois.",
  },
  {
    q: "E se o cliente já estiver falando com a Bewild?",
    a: "Clientes já em negociação ou vindos de canal próprio não geram comissão — essa regra protege os dois lados de disputa de origem. Por isso o registro formal da indicação vem sempre antes da primeira conversa.",
  },
  {
    q: "Quem fala com o cliente depois da indicação?",
    a: "A Bewild, sempre em nome próprio. Não usamos o nome do corretor, da imobiliária ou da incorporadora em nenhuma etapa, e não acessamos a sua carteira: atendemos apenas o cliente indicado, no assunto indicado.",
  },
  {
    q: "Quando a comissão é paga?",
    a: "Sobre o que o cliente efetivamente pagou. Contrato à vista: parcela única em até 30 dias corridos do recebimento. Contrato parcelado: a partir da 2ª parcela, em até 10 dias úteis por recebimento. Sem adiantamento — e com relatório mensal mostrando cada valor.",
  },
  {
    q: "Preciso de CNPJ para ser parceiro?",
    a: "O pagamento da comissão é feito contra nota fiscal de intermediação. Na prática, isso pede um CNPJ ativo — inclusive o de corretor autônomo. Se você atua como pessoa física, fale com a gente antes de cadastrar: avaliamos o formato caso a caso.",
  },
  {
    q: "A Bewild disputa meus clientes ou vende para a minha carteira?",
    a: "Não. A Bewild executa reforma — não vende imóvel, não capta cliente de venda e não fala em seu nome. Os dados do indicado são usados só para atender a indicação, conforme a LGPD, e o relacionamento comercial do cliente continua sendo seu.",
  },
  {
    q: "O que acontece se o cliente desistir depois de assinar?",
    a: "Distrato gera devolução proporcional: a comissão referente aos valores devolvidos ao cliente é restituída ou compensada nas parcelas seguintes. A regra é a mesma para os dois lados — comissão existe sobre o que ficou no contrato.",
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (v: string) => v.replace(/\D+/g, "");

function maskPhone(v: string) {
  const d = digits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function ParceirosPage() {
  useCtaClickTracking("parceiros");
  const { settings } = useSiteSettings();
  const email = settings?.contact_email || CONTACT.email;
  const [faqAberto, setFaqAberto] = useState(0);

  const [tipo, setTipo] = useState("");
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [documento, setDocumento] = useState("");
  const [whats, setWhats] = useState("");
  const [mail, setMail] = useState("");
  const [regiao, setRegiao] = useState("");
  const [unidades, setUnidades] = useState("");
  const [origem, setOrigem] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const tipoOk = tipo !== "";
  const nomeOk = nome.trim().length >= 2;
  const whatsOk = digits(whats).length >= 10;
  const mailOk = mail.trim() === "" || EMAIL_RE.test(mail.trim());
  const regiaoOk = regiao.trim().length >= 2;
  const podeEnviar = tipoOk && nomeOk && whatsOk && mailOk && regiaoOk && !enviando;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ tipo: true, nome: true, whats: true, mail: true, regiao: true });
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);

    const linhas = [
      `Tipo de parceiro: ${tipo}`,
      empresa.trim() ? `Empresa: ${empresa.trim()}` : null,
      documento.trim() ? `CRECI/CNPJ: ${documento.trim()}` : null,
      unidades.trim() ? `Unidades vendidas por mês: ${unidades.trim()}` : null,
    ].filter(Boolean);

    const payload = {
      name: nome.trim(),
      whatsapp: digits(whats),
      email: mail.trim() || null,
      message: linhas.join("\n"),
      location: regiao.trim(),
      area_m2: null,
      objetivo: `Parceria comercial — ${tipo}`,
      chaves: null,
      planta: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      landing_path: "/parceiros",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      lead_source: origem.trim() || null,
    };

    let delivered = false;
    try {
      const result = await Promise.race([
        supabase.functions.invoke("notify-lead", { body: payload }),
        timeoutAfter(8000),
      ]);
      delivered = isLeadDelivered(result);
    } catch (err) {
      console.error("[notify-lead] invoke failed", err);
    }

    setEnviando(false);
    if (delivered) {
      setEnviado(true);
      trackEvent("generate_lead", { method: "parceiros_form" });
    } else {
      setErro(
        "Não conseguimos enviar seu cadastro agora. Tente novamente ou fale com a gente no WhatsApp.",
      );
    }
  }

  useSeo({
    title: "Parcerias em reforma de apartamento em SP: corretores e imobiliárias | Bewild",
    description:
      "Você vende o imóvel, a Bewild entrega pronto: reforma de apartamento em SP completa, com preço e prazo em contrato e 5 anos de garantia. Programa de indicação para corretores, imobiliárias e incorporadoras.",
    keywords:
      "escritório de arquitetura e engenharia em SP, reforma de apartamento em SP, parceria corretor reforma, indicação reforma comissão, reforma de studio para investidor, reforma apartamento compacto São Paulo, incorporadora reforma pós-chaves, custo de reforma, Bewild parceiros",
    canonicalPath: "/parceiros",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Parceiros", path: "/parceiros" },
          ]),
          faqJsonLd(FAQ_PARCEIRO.map((i) => ({ q: i.q, a: i.a }))),
        ]
      : undefined,
  });

  return (
    <div className="bwa-parceiros">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        {/* 01 · Hero + faixa de fatos + selo de parceria vigente */}
        <section className="bwa-parc-hero">
          <div className="bwa-shell bwa-parc-hero-grid">
            <div>
              <p className="bwa-label">Parceiros · corretores, imobiliárias e incorporadoras</p>
              <h1>
                Você vende o imóvel. <em>A Bewild entrega pronto.</em>
              </h1>
              <p className="bwa-parc-lead">
                Toda venda de studio trava na mesma pergunta: “e depois, quem reforma isso?”.
                A Bewild é a resposta que destrava a assinatura — projeto, obra, marcenaria e
                mobília em um único contrato, com preço e prazo fechados.
              </p>
              <div className="bwa-parc-hero-actions">
                <a className="bwa-button" href="#cadastro" data-cta="parceiros-hero-cadastro">
                  Quero ser parceiro <span aria-hidden="true">→</span>
                </a>
                <a
                  className="bwa-parc-ghost"
                  href={INDICACAO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta="parceiros-hero-indicacao"
                >
                  Já sou parceiro — registrar indicação <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <aside className="bwa-parc-seal" aria-label="Parceria vigente">
              <p className="bwa-label">Parceria vigente</p>
              <strong>Bewild × Leal Moreira</strong>
              <p>
                Programa de indicações em operação com a Leal Moreira, com termo assinado,
                regras públicas e relatório mensal de comissões.
              </p>
            </aside>
          </div>
          <div className="bwa-shell">
            <ul className="bwa-parc-facts">
              <li><strong>+160</strong> reformas entregues</li>
              <li><strong>20 a 35 m²</strong> studios como centro</li>
              <li><strong>~60 dias úteis</strong> da obra à entrega</li>
              <li><strong>5 anos</strong> de garantia</li>
              <li><strong>30 de 62</strong> clientes fora da capital</li>
            </ul>
          </div>
        </section>

        {/* 02 · Dois caminhos */}
        <section className="bwa-parc-section" id="caminhos">
          <div className="bwa-shell">
            <p className="bwa-label">02 · Dois caminhos</p>
            <h2>Quem vende o imóvel e quem entrega o empreendimento.</h2>
            <div className="bwa-parc-two">
              <article className="bwa-parc-card">
                <h3>Corretores e imobiliárias</h3>
                <p>
                  O comprador gostou do studio, mas travou no “quem reforma?”. Você indica a
                  Bewild, registra a indicação em 2 minutos e segue a venda. A reforma deixa de
                  ser objeção e vira argumento de fechamento — com comissão de indicação e
                  relatório mensal.
                </p>
                <a href="#cadastro" data-cta="parceiros-caminho-corretor">
                  Cadastrar como corretor ou imobiliária <span aria-hidden="true">→</span>
                </a>
              </article>
              <article className="bwa-parc-card">
                <h3>Incorporadoras</h3>
                <p>
                  O empreendimento entrega o apartamento; a Bewild entrega ele pronto para morar
                  ou render. Atuamos antes das chaves (padrão de acabamento e decorado) e depois
                  delas (reforma dos compradores e investidores), sem disputar a venda e sem
                  falar em nome da incorporadora.
                </p>
                <a href="#incorporadoras" data-cta="parceiros-caminho-incorporadora">
                  Ver o modelo para incorporadoras <span aria-hidden="true">→</span>
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* 03 · Quatro razões ligadas à venda dele */}
        <section className="bwa-parc-section bwa-parc-section--alt" id="razoes">
          <div className="bwa-shell">
            <p className="bwa-label">03 · Por que indicar a Bewild</p>
            <h2>4 razões que aparecem na sua venda, não na nossa.</h2>
            <div className="bwa-parc-grid4">
              {RAZOES.map((r) => (
                <article className="bwa-parc-reason" key={r.n}>
                  <span className="bwa-parc-num">{r.n}</span>
                  <h3>{r.t}</h3>
                  <p>{r.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 04 · Como funciona a indicação */}
        <section className="bwa-parc-section" id="como-funciona">
          <div className="bwa-shell">
            <p className="bwa-label">04 · Como funciona a indicação</p>
            <h2>5 passos, com o tempo de cada um declarado.</h2>
            <ol className="bwa-parc-steps">
              {PASSOS.map((p) => (
                <li className="bwa-parc-step" key={p.n}>
                  <span className="bwa-parc-num">{p.n}</span>
                  <div>
                    <h3>{p.t}</h3>
                    <p>{p.d}</p>
                  </div>
                  <span className="bwa-parc-step-time">{p.tempo}</span>
                </li>
              ))}
            </ol>
            <p className="bwa-parc-note">
              Já é parceiro?{" "}
              <a
                href={INDICACAO_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="parceiros-passos-indicacao"
              >
                Registre a indicação aqui
              </a>{" "}
              — o registro vale por 12 meses a partir do envio.
            </p>
          </div>
        </section>

        {/* 05 · A comissão, sem letra miúda (regras, sem percentual) */}
        <section className="bwa-parc-section bwa-parc-section--alt" id="comissao">
          <div className="bwa-shell">
            <p className="bwa-label">05 · A comissão, sem letra miúda</p>
            <h2>As regras são públicas. O percentual fica no termo.</h2>
            <p className="bwa-parc-lead2">
              O que corretor experiente desconfia é de “excelente comissão” sem regra. Então a
              página publica as regras do nosso termo de parceria, linha a linha — o percentual
              é definido por perfil e volume, no termo individual.
            </p>
            <div className="bwa-parc-table-wrap">
              <table className="bwa-parc-table">
                <caption className="sr-only">Regras de comissionamento da parceria Bewild</caption>
                <thead>
                  <tr>
                    <th scope="col">Regra</th>
                    <th scope="col">Como funciona</th>
                  </tr>
                </thead>
                <tbody>
                  {REGRAS_COMISSAO.map((r) => (
                    <tr key={r.regra}>
                      <th scope="row">{r.regra}</th>
                      <td>{r.detalhe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 06 · O que o cliente recebe */}
        <section className="bwa-parc-section" id="entrega">
          <div className="bwa-shell">
            <p className="bwa-label">06 · O que o seu cliente recebe</p>
            <h2>A indicação protege a sua reputação — ou não vale nada.</h2>
            <div className="bwa-parc-grid4">
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">01</span>
                <h3>Escopo completo em 1 contrato</h3>
                <p>
                  Projeto, obra, marcenaria e mobília com preço e prazo fechados. O cliente não
                  coordena pedreiro, marceneiro e loja — e não volta para você com problema de obra.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">02</span>
                <h3>Bwild Workflow</h3>
                <p>
                  O cliente acompanha cada etapa com foto e registro, de onde estiver. Para quem
                  mora fora da capital — quase metade dos nossos clientes — é o que torna a obra
                  possível.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">03</span>
                <h3>~60 dias úteis de obra</h3>
                <p>
                  Prazo de referência declarado antes de assinar, com cronograma em contrato.
                  O investidor sabe quando o imóvel começa a render.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <span className="bwa-parc-num">04</span>
                <h3>5 anos de garantia</h3>
                <p>
                  Garantia formal da execução. Se algo falha depois da entrega, quem responde é a
                  Bewild — não o corretor que indicou.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 07 · Bloco B2B incorporadoras */}
        <section className="bwa-parc-section bwa-parc-section--dark" id="incorporadoras">
          <div className="bwa-shell">
            <p className="bwa-label">07 · Para incorporadoras</p>
            <h2>Antes das chaves e depois delas.</h2>
            <div className="bwa-parc-two">
              <article className="bwa-parc-card bwa-parc-card--dark">
                <h3>Antes das chaves</h3>
                <p>
                  Padrão de acabamento e unidade decorada de studios e compactos, desenhados para
                  o comprador investidor. O decorado mostra o imóvel pronto para render — e vende
                  o estoque de unidades compactas que mais trava na prateleira.
                </p>
              </article>
              <article className="bwa-parc-card bwa-parc-card--dark">
                <h3>Depois das chaves</h3>
                <p>
                  Quase metade dos compradores de studio mora fora da capital e precisa de quem
                  entregue o apartamento pronto à distância. A Bewild executa a reforma dos
                  compradores do empreendimento com preço, prazo e garantia em contrato — sem
                  disputar a venda e sem falar em nome da incorporadora.
                </p>
              </article>
            </div>
            <a className="bwa-button bwa-button-light" href="#cadastro" data-cta="parceiros-b2b-cta">
              Conversar sobre o empreendimento <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        {/* 08 · Prova */}
        <section className="bwa-parc-section" id="prova">
          <div className="bwa-shell">
            <p className="bwa-label">08 · Prova, não promessa</p>
            <h2>Parceria e resultado com nome e número.</h2>
            <div className="bwa-parc-two">
              <article className="bwa-parc-card">
                <h3>Bewild × Leal Moreira</h3>
                <p>
                  Programa de indicações vigente com a Leal Moreira, formalizado em termo de
                  parceria: registro de indicação com validade de 12 meses, comissão sobre valor
                  líquido recebido e relatório mensal de status, contratos e comissões.
                </p>
              </article>
              <article className="bwa-parc-card">
                <h3>Vivian · Vila Olímpia · 99% de ocupação em setembro</h3>
                <p>
                  A Vivian comprou um studio na Vila Olímpia para renda de curta temporada e mora fora
                  de São Paulo. A Bewild entregou projeto, obra, marcenaria e mobília à distância —
                  e o imóvel opera com cerca de 99% de ocupação em setembro.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 09 · Regras de convivência */}
        <section className="bwa-parc-section bwa-parc-section--alt" id="convivencia">
          <div className="bwa-shell">
            <p className="bwa-label">09 · Regras de convivência</p>
            <h2>O que a Bewild nunca faz com a sua carteira.</h2>
            <div className="bwa-parc-grid3">
              <article className="bwa-parc-reason">
                <h3>Não disputamos sua carteira</h3>
                <p>
                  A Bewild executa reforma. Não vende imóvel, não capta cliente de venda e não
                  intermedeia locação. O relacionamento comercial do cliente continua sendo seu.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <h3>Não falamos em seu nome</h3>
                <p>
                  Do primeiro contato à entrega, nos apresentamos como Bewild. Seu nome, sua
                  imobiliária ou sua incorporadora não aparecem em nenhuma promessa de obra.
                </p>
              </article>
              <article className="bwa-parc-reason">
                <h3>LGPD na indicação</h3>
                <p>
                  Os dados do indicado são usados apenas para atender a indicação, com base na
                  LGPD. Nada de lista compartilhada, campanha cruzada ou contato fora do escopo.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* 10 · FAQ do parceiro */}
        <section className="bwa-parc-section" id="faq">
          <div className="bwa-shell">
            <p className="bwa-label">10 · Perguntas de quem indica</p>
            <h2>8 respostas diretas, sem rodeio.</h2>
            <div className="bwa-faq-list" itemScope itemType="https://schema.org/FAQPage">
              {FAQ_PARCEIRO.map((item, i) => {
                const open = faqAberto === i;
                return (
                  <article
                    key={item.q}
                    className={`bwa-faq-item${open ? " bwa-open" : ""}`}
                    itemScope
                    itemProp="mainEntity"
                    itemType="https://schema.org/Question"
                  >
                    <h3 className="bwa-faqpage-q">
                      <button
                        className="bwa-faq-question"
                        type="button"
                        aria-expanded={open}
                        aria-controls={`parceiros-resposta-${i}`}
                        onClick={() => setFaqAberto(open ? -1 : i)}
                      >
                        <span className="bwa-faq-num">{String(i + 1).padStart(2, "0")}</span>
                        <strong itemProp="name">{item.q}</strong>
                        <span className="bwa-faq-icon" aria-hidden="true" />
                      </button>
                    </h3>
                    <div
                      id={`parceiros-resposta-${i}`}
                      className="bwa-faq-answer"
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <p itemProp="text">{item.a}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* 11 · Cadastro de parceiro + porta de indicação */}
        <section className="bwa-contact-form-sec" id="cadastro">
          <div className="bwa-shell bwa-contact-form-grid">
            <div className="bwa-contact-form-intro">
              <p className="bwa-label">11 · Cadastro de parceiro</p>
              <h2>Duas portas, dois formulários.</h2>
              <p>
                <strong>Quero ser parceiro:</strong> cadastro aqui ao lado — tipo de atuação,
                região e volume. Nossa equipe responde pelo WhatsApp com o termo de parceria.
              </p>
              <p>
                <strong>Já sou parceiro:</strong> o registro de cada cliente indicado é no
                formulário oficial do contrato, com validade de 12 meses.
              </p>
              <a
                className="bwa-contact-link"
                href={INDICACAO_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cta="parceiros-form-indicacao"
              >
                Registrar uma indicação <span aria-hidden="true">↗</span>
              </a>
              <p>
                Prefere e-mail? <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>

            {enviado ? (
              <div className="bwa-contact-form-done" role="status">
                <p className="bwa-label">Cadastro recebido</p>
                <h3>Obrigado, {nome.trim().split(" ")[0]}.</h3>
                <p>
                  Nossa equipe analisa seu perfil e responde pelo WhatsApp informado com o termo
                  de parceria. Se já tem um cliente para indicar, registre agora — a validade de
                  12 meses conta a partir do registro.
                </p>
                <a
                  className="bwa-button"
                  href={INDICACAO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Registrar indicação <span aria-hidden="true">↗</span>
                </a>
              </div>
            ) : (
              <form className="bwa-contact-form" onSubmit={enviar} noValidate>
                <label className="bwa-contact-field">
                  <span>Tipo de parceiro</span>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, tipo: true }))}
                    aria-invalid={touched.tipo && !tipoOk}
                  >
                    <option value="">Selecione</option>
                    {TIPOS.map((tp) => (
                      <option key={tp} value={tp}>
                        {tp}
                      </option>
                    ))}
                  </select>
                  {touched.tipo && !tipoOk && <em>Selecione o tipo de atuação.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>Nome</span>
                  <input
                    type="text"
                    value={nome}
                    maxLength={120}
                    autoComplete="name"
                    onChange={(e) => setNome(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
                    aria-invalid={touched.nome && !nomeOk}
                  />
                  {touched.nome && !nomeOk && <em>Informe seu nome.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>Empresa (opcional)</span>
                  <input
                    type="text"
                    value={empresa}
                    maxLength={120}
                    autoComplete="organization"
                    placeholder="Imobiliária, incorporadora ou escritório"
                    onChange={(e) => setEmpresa(e.target.value)}
                  />
                </label>

                <label className="bwa-contact-field">
                  <span>CRECI ou CNPJ (opcional)</span>
                  <input
                    type="text"
                    value={documento}
                    maxLength={24}
                    placeholder="CRECI 00000-F ou 00.000.000/0000-00"
                    onChange={(e) => setDocumento(e.target.value)}
                  />
                </label>

                <label className="bwa-contact-field">
                  <span>WhatsApp</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={whats}
                    autoComplete="tel"
                    placeholder="(11) 90000-0000"
                    onChange={(e) => setWhats(maskPhone(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, whats: true }))}
                    aria-invalid={touched.whats && !whatsOk}
                  />
                  {touched.whats && !whatsOk && <em>Informe um número com DDD.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>E-mail (opcional)</span>
                  <input
                    type="email"
                    value={mail}
                    maxLength={180}
                    autoComplete="email"
                    onChange={(e) => setMail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, mail: true }))}
                    aria-invalid={touched.mail && !mailOk}
                  />
                  {touched.mail && !mailOk && <em>Confira o e-mail digitado.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>Região ou empreendimentos</span>
                  <input
                    type="text"
                    value={regiao}
                    maxLength={180}
                    placeholder="Pinheiros e Vila Olímpia · ou nomes dos empreendimentos"
                    onChange={(e) => setRegiao(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, regiao: true }))}
                    aria-invalid={touched.regiao && !regiaoOk}
                  />
                  {touched.regiao && !regiaoOk && <em>Informe a região ou os empreendimentos.</em>}
                </label>

                <label className="bwa-contact-field">
                  <span>Unidades vendidas por mês (opcional)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={unidades}
                    maxLength={4}
                    placeholder="Ex.: 6"
                    onChange={(e) => setUnidades(e.target.value.replace(/\D+/g, ""))}
                  />
                </label>

                <label className="bwa-contact-field bwa-contact-field--full">
                  <span>Como conheceu a Bewild (opcional)</span>
                  <input
                    type="text"
                    value={origem}
                    maxLength={180}
                    placeholder="Indicação, Instagram, Google, evento…"
                    onChange={(e) => setOrigem(e.target.value)}
                  />
                </label>

                {erro && (
                  <p className="bwa-contact-form-error" role="alert">
                    {erro}
                  </p>
                )}

                <div className="bwa-contact-form-actions">
                  <button
                    className="bwa-button"
                    type="submit"
                    data-cta="parceiros-enviar"
                    disabled={!podeEnviar}
                  >
                    {enviando ? "Enviando…" : "Cadastrar como parceiro"}
                    <span aria-hidden="true">→</span>
                  </button>
                  <p>
                    Seus dados são usados apenas para responder ao cadastro, conforme a LGPD.
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* 12 · Rodapé com assinatura (BwaFooter já traz “Seu desejo é uma obra.”) */}
      </main>

      <BwaFooter />
    </div>
  );
}
