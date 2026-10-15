/**
 * LpObraPage — /o · página fantasma (destino do QR da placa de obra).
 * Fluxo: gate (nome + telefone + e-mail) -> salva o lead -> abre, NESTA
 * página, a demonstração do portal: a mesma réplica ilustrativa da home, com
 * dados fictícios (`src/components/workflow-replica`).
 *  - noindex, sem nav/footer global, acessível só por URL direta (QR).
 *  - Lead via `sendLead` (notify-lead, `form_path: "/o"`), mesmo pipeline
 *    do /orcamento.
 *  - A demonstração só abre DEPOIS que o envio termina. Sem confirmação, o
 *    visitante vê um aviso com o WhatsApp já preenchido e pode seguir para a
 *    demonstração mesmo assim.
 *  - NUNCA levar o visitante ao portal real (bwildworkflow.com): lá só há
 *    obras de verdade, com dados de clientes. Até 15/10/2026 o gate mandava
 *    para a "vitrine" do portal, que entrava sozinha numa conta de
 *    demonstração e abria uma obra completa. Guardado por
 *    `src/__tests__/sitePublicoSemPortalReal.test.ts`.
 */
import { PROJETOS, PROVA_CURTA, REFORMAS_ENTREGUES } from "@/content/provas";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import { whatsappHref } from "@/components/landing/content";
import { reportContact } from "@/lib/conversions";
import { trackEvent } from "@/lib/ga4";
import type { LeadPayload } from "@/lib/leadDelivery";
import {
  buildLeadMessage,
  fieldErrorId,
  fieldErrorProps,
  firstInvalidField,
  isValidEmail,
  touchAll,
  type FieldErrors,
  type QrUtmDefaults,
} from "@/lib/leadForm";
import { formatBrPhone, isValidBrPhone, normalizeBrPhoneDigits } from "@/lib/phone";
import { scrollBehavior } from "@/lib/reducedMotion";
import {
  browserUserAgent,
  collectLeadAttribution,
  focusField,
  openWhatsapp,
  useLeadSubmit,
} from "@/lib/useLeadSubmit";
import { useVideoAutoplayInView } from "@/lib/useVideoAutoplayInView";
import BewildLogo from "@/components/BewildLogo";
import FormPrivacyNote from "@/components/FormPrivacyNote";
import "@/styles/bw-lp.css";

/**
 * Demonstração do portal: réplica com dados fictícios (a mesma da home).
 * Carrega só depois do gate, para não pesar a primeira tela do QR.
 */
const WorkflowPortalReplica = lazy(() => import("@/components/workflow-replica/WorkflowPortalReplica"));

/** Atribuição padrão da placa (a URL do QR pode sobrescrever campo a campo). */
const UTM_PADRAO: QrUtmDefaults = { utm_source: "qr", utm_medium: "placa", utm_campaign: "obra-placa" };

type Campo = "nome" | "whats" | "email";
const CAMPOS: readonly Campo[] = ["nome", "whats", "email"];
const CAMPO_ID: Record<Campo, string> = { nome: "g-nome", whats: "g-whats", email: "g-email" };

/** Leva foco e rolagem até a demonstração (jsdom não tem scrollIntoView). */
function focarDemo(alvo: HTMLElement | null) {
  if (!alvo) return;
  alvo.focus({ preventScroll: true });
  if (typeof alvo.scrollIntoView === "function") {
    alvo.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
  }
}

function validar(v: Record<Campo, string>): FieldErrors<Campo> {
  const e: FieldErrors<Campo> = {};
  if (v.nome.trim().length < 2) e.nome = "Informe seu nome.";
  if (!isValidBrPhone(v.whats)) e.whats = "Informe um telefone com DDD.";
  if (!isValidEmail(v.email)) e.email = v.email.trim() ? "Confira o e-mail digitado." : "Informe seu e-mail.";
  return e;
}

export default function LpObraPage() {
  const params =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const bairroRaw = params?.get("bairro")?.trim() || "";
  const bairro = bairroRaw || null;
  const bairroUp = bairro ? bairro.toUpperCase() : "";
  const videoArqRef = useVideoAutoplayInView();
  const videoObraRef = useVideoAutoplayInView();

  useSeo({
    title: "Obra Bewild · acompanhamento",
    description: "Página da placa de obra Bewild. Veja o portal de acompanhamento do studio.",
    canonicalPath: "/o",
    noindex: true,
  });

  // form → (envio) → portal (entregue: abre a demonstração aqui) | fallback (sem confirmação)
  const [stage, setStage] = useState<"form" | "portal" | "fallback">("form");
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  // WhatsApp com os dados do gate — saída quando a entrega não é confirmada.
  const [waLeadUrl, setWaLeadUrl] = useState<string | null>(null);
  const lastPayload = useRef<LeadPayload | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const portalRef = useRef<HTMLElement | null>(null);
  const { sending: submitting, outcome, submit, isMounted } = useLeadSubmit({ method: "lp_obra_gate" });

  const errors = validar({ nome, whats, email });
  const erro = (k: Campo) => (touched[k] ? errors[k] : undefined);
  const touch = (k: Campo) => setTouched((t) => ({ ...t, [k]: true }));

  // O formulário é trocado pelo aviso: o foco vai junto. Quando a
  // demonstração abre, foco e rolagem vão para ela.
  useEffect(() => {
    if (stage === "portal") focarDemo(portalRef.current);
    else if (stage !== "form") cardRef.current?.focus();
  }, [stage]);

  const irParaDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    focarDemo(portalRef.current);
  };

  /** Abre a demonstração (dados fictícios) nesta página — nunca o portal real. */
  const abrirDemo = (campanha: LeadPayload["utm_campaign"] | undefined) => {
    trackEvent("open_portal_demo", { category: "lp_obra", label: campanha });
    setStage("portal");
  };

  const continuarParaPortal = () => abrirDemo(lastPayload.current?.utm_campaign);

  async function enviar(payload: LeadPayload) {
    const result = await submit(payload, { params: { location: bairro || undefined } });
    // null = envio já em andamento; página desmontada = o visitante saiu
    // (voltar do navegador) e não deve ser arrastado para o portal.
    if (!result || !isMounted()) return;
    if (result === "delivered") {
      abrirDemo(payload.utm_campaign);
    } else {
      setStage("fallback");
    }
  }

  const onGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const primeiro = firstInvalidField(CAMPOS, errors);
    if (primeiro) {
      setTouched(touchAll(CAMPOS));
      focusField(CAMPO_ID[primeiro]);
      return;
    }

    const attribution = collectLeadAttribution(UTM_PADRAO);
    const payload: LeadPayload = {
      name: nome.trim(),
      whatsapp: normalizeBrPhoneDigits(whats),
      email: email.trim() || null,
      location: bairro,
      area_m2: null,
      objetivo: null,
      chaves: null,
      planta: null,
      message: "Lead via QR da placa de obra",
      ...attribution,
      user_agent: browserUserAgent(),
      form_path: "/o",
    };
    lastPayload.current = payload;
    const bairroTxt = bairro ? ` em ${bairro}` : "";
    setWaLeadUrl(
      whatsappHref(
        buildLeadMessage(
          `[PLACA DE OBRA] Olá! Vi a placa da obra da Bewild${bairroTxt} e quero ver o portal de acompanhamento.`,
          [
            ["Nome", nome],
            ["Telefone", whats],
            ["E-mail", email],
          ],
          `(origem: ${attribution.utm_campaign})`,
        ),
      ),
    );
    void enviar(payload);
  };

  const reenviar = () => {
    // Só em falha confirmada (nada gravado): reenviar não duplica.
    if (lastPayload.current && !submitting) void enviar(lastPayload.current);
  };

  const openWhats = () => {
    const campanha = collectLeadAttribution(UTM_PADRAO).utm_campaign;
    trackEvent("click_whatsapp", { category: "lp_obra_gate", label: campanha });
    reportContact("whatsapp", "lp_obra_gate");
    const bairroTxt = bairro ? ` em ${bairro}` : "";
    const msg = `[PLACA DE OBRA] Olá! Vi a placa da obra da Bewild${bairroTxt} e quero saber como transformar meu studio em renda. (origem: ${campanha})`;
    openWhatsapp(whatsappHref(msg));
  };

  const scrollToGate = (e: React.MouseEvent) => {
    e.preventDefault();
    document
      .getElementById("gate-card")
      ?.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
  };

  const eyebrowText = bairro ? `Obra Bewild · ${bairro}` : "Obra Bewild · São Paulo";
  const sheetNo = bairro ? `SHEET · OBRA ${bairroUp}` : "SHEET · OBRA";

  return (
    <div className="bw-lp">
      <div className="bw-grain" aria-hidden="true" />
      <div className="bw-frame" aria-hidden="true">
        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
      </div>
      <div className="bw-titleblock" aria-hidden="true">
        BEWILD<br /><b>BW-OBRA / PLACA</b><br />SÃO PAULO · BR
      </div>
      <div className="bw-sheetno" aria-hidden="true">{sheetNo}</div>

      <section className="hero is-gate" aria-label="Obra Bewild">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-top">
          <BewildLogo className="hero-logo" variant="white" />
          <div className="hero-eyebrow">
            <span className="mono tag">{eyebrowText}</span>
          </div>
          <h1>
            Você parou em frente a uma obra.
            <span className="lo">Veja como a Bewild acompanha cada uma.</span>
          </h1>
          <p className="sub">
            Atrás dessa placa, um studio está virando renda, sem o dono entrar na
            obra. Deixe seu contato pra abrir uma demonstração do portal que o
            cliente Bewild usa pra acompanhar a obra, do primeiro dia à entrega.
          </p>
          <p className="sub">
            A Bewild transforma studios crus em imóveis prontos para alugar por
            temporada. Projeto, obra, marcenaria, mobília e decoração em um único
            contrato, com time próprio, em cerca de 60 dias úteis. O dono
            acompanha tudo à distância e recebe as chaves com o anúncio pronto
            para publicar.
          </p>


          {stage === "form" ? (
            <form id="gate-card" className="gate-card" onSubmit={onGateSubmit} noValidate aria-label="Acesso ao portal de acompanhamento">
              <div className="eye">Acesso ao portal de acompanhamento</div>
              <h3>Veja o portal por dentro</h3>
              <p>Deixe seu contato para abrir uma demonstração do portal que nossos clientes usam para acompanhar a obra, do primeiro dia até a entrega.</p>
              <div className="fld">
                <label htmlFor="g-nome">Nome <span className="req" aria-hidden="true">*</span></label>
                <input id="g-nome" type="text" autoComplete="name" value={nome} maxLength={120}
                  onChange={(e) => setNome(e.target.value)} onBlur={() => touch("nome")} required
                  {...fieldErrorProps("g-nome", erro("nome"))} />
                {erro("nome") && <p className="fld-err" id={fieldErrorId("g-nome")}>{erro("nome")}</p>}
              </div>
              <div className="fld">
                <label htmlFor="g-whats">Telefone / WhatsApp <span className="req" aria-hidden="true">*</span></label>
                <input id="g-whats" type="tel" inputMode="tel" placeholder="(11) 99999-9999" autoComplete="tel" value={whats}
                  onChange={(e) => setWhats(formatBrPhone(e.target.value))} onBlur={() => touch("whats")} required
                  {...fieldErrorProps("g-whats", erro("whats"))} />
                {erro("whats") && <p className="fld-err" id={fieldErrorId("g-whats")}>{erro("whats")}</p>}
              </div>
              <div className="fld">
                <label htmlFor="g-email">E-mail <span className="req" aria-hidden="true">*</span></label>
                <input id="g-email" type="email" inputMode="email" placeholder="voce@email.com" autoComplete="email" value={email} maxLength={254}
                  onChange={(e) => setEmail(e.target.value)} onBlur={() => touch("email")} required
                  {...fieldErrorProps("g-email", erro("email"))} />
                {erro("email") && <p className="fld-err" id={fieldErrorId("g-email")}>{erro("email")}</p>}
              </div>
              {/* Habilitado com campos pendentes: o clique mostra os erros e leva o foco ao primeiro. */}
              <button type="submit" className="btn btn-cyan submit" disabled={submitting}>
                <span>{submitting ? "Abrindo…" : "Ver demonstração"}</span><span className="ar" aria-hidden="true">→</span>
              </button>
              <button type="button" className="skip" onClick={openWhats}>Prefiro falar no WhatsApp</button>
              <FormPrivacyNote platforms="meta-google" className="form-privacy">
                Usamos seus dados para liberar a demonstração e para o atendimento da Bewild.
              </FormPrivacyNote>
            </form>
          ) : stage === "portal" ? (
            <div id="gate-card" className="gate-card">
              <div className="eye">Portal de acompanhamento</div>
              <h3>Demonstração liberada.</h3>
              <p>Logo abaixo está uma demonstração do portal que o cliente Bewild usa para acompanhar a obra, com dados fictícios.</p>
              <a className="btn btn-cyan submit" href="#portal-demo" onClick={irParaDemo}>
                <span>Ver a demonstração</span><span className="ar" aria-hidden="true">→</span>
              </a>
            </div>
          ) : (
            <div id="gate-card" className="gate-card" tabIndex={-1} ref={cardRef}>
              <div className="eye">Portal de acompanhamento</div>
              {outcome === "timedOut" ? (
                <>
                  <h3>Seu contato pode já ter chegado.</h3>
                  <p>A confirmação demorou mais que o normal. Para garantir, mande seus dados pelo WhatsApp — a mensagem já vai pronta. Se já tivermos recebido, é só ignorar.</p>
                </>
              ) : (
                <>
                  <h3>Não conseguimos registrar seu contato.</h3>
                  <p>Mande seus dados pelo WhatsApp — a mensagem já vai pronta — ou tente de novo. A demonstração continua liberada.</p>
                </>
              )}
              {waLeadUrl && (
                <a className="btn btn-cyan submit" href={waLeadUrl} target="_blank" rel="noopener noreferrer">
                  <span>Enviar pelo WhatsApp</span><span className="ar" aria-hidden="true">→</span>
                </a>
              )}
              {outcome === "failed" && (
                <button type="button" className="skip" onClick={reenviar} disabled={submitting}>
                  {submitting ? "Enviando…" : "Tentar enviar de novo"}
                </button>
              )}
              <button type="button" className="skip" onClick={continuarParaPortal}>
                {outcome === "failed" ? "Ver a demonstração mesmo assim" : "Continuar para a demonstração"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* DEMONSTRAÇÃO — réplica com dados fictícios, só depois do gate */}
      {stage === "portal" && (
        <section
          id="portal-demo"
          className="lp-portalview"
          ref={portalRef}
          tabIndex={-1}
          aria-labelledby="portal-demo-titulo"
        >
          <div className="lp-demo-head">
            <p className="mono tag">Demonstração · dados fictícios</p>
            <h2 id="portal-demo-titulo">O portal que o cliente Bewild usa para acompanhar a obra.</h2>
            <p className="lead">Cronograma, evolução e relatórios semanais, do primeiro dia à entrega. Navegue pelas abas.</p>
          </div>
          <div className="lp-demo-frame">
            <Suspense fallback={<p className="lp-demo-note">Carregando a demonstração…</p>}>
              <WorkflowPortalReplica />
            </Suspense>
            <p className="lp-demo-note">Interface ilustrativa do portal de acompanhamento, com dados fictícios.</p>
          </div>
          <div className="lp-portal-cta">
            <h3>Quer acompanhar a sua obra assim?</h3>
            <p>Fale com a Bewild pelo WhatsApp e peça o orçamento do seu studio ou apartamento.</p>
            <div className="act">
              <button type="button" className="btn btn-cyan" onClick={openWhats}>
                <span>Falar no WhatsApp</span><span className="ar" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 01 — QUEM FAZ */}
      <section className="lp-quem" aria-label="Quem faz essa obra">
        <div className="sec-mark"><span className="n">01</span><span className="t">Quem faz essa obra</span><span className="ln" /></div>
        <div className="lp-quem-head">
          <h2>A Bewild constrói studios pra render. <i>Este é um deles.</i></h2>
          <p className="lead">Projeto, obra, marcenaria, mobília e decoração em um único contrato. Já somamos {PROVA_CURTA}, prontos para receber hóspedes.</p>
        </div>
        <div className="lp-quem-data">
          <div className="cell"><b>+{REFORMAS_ENTREGUES}</b><span>reformas entregues · +{PROJETOS} projetos</span></div>
          <div className="cell"><b>60</b><span>dias úteis · a partir de</span></div>
          <div className="cell"><b>05</b><span>anos de garantia</span></div>
        </div>

        <div className="vblock">
          <div className="vtext">
            <p className="vtag">antes de qualquer parede</p>
            <h3>Quem projeta o seu studio mede ele <em>pessoalmente.</em></h3>
            <p>A arquiteta vai até o imóvel e decide ali o que muda na diária: circulação, iluminação e o layout que valoriza as fotos do anúncio.</p>
          </div>
          <div className="vframe">
            <video ref={videoArqRef} src="/videos/arquiteta-medicao.mp4" poster="/videos/arquiteta-medicao-poster.jpg" muted loop playsInline preload="none" aria-label="Arquiteta da Bewild fazendo a medição do imóvel" />
          </div>
        </div>

        <div className="vblock invertido">
          <div className="vframe">
            <video ref={videoObraRef} src="/videos/time-obra.mp4" poster="/videos/time-obra-poster.jpg" muted loop playsInline preload="none" aria-label="Time de obra da Bewild a caminho da reforma" />
          </div>
          <div className="vtext">
            <p className="vtag">e quem executa tem rosto</p>
            <h3>A obra que você não toca tem <em>time próprio.</em></h3>
            <p>Quem reforma trabalha na Bewild, não é um terceiro que aparece e some. O dono acompanha tudo à distância pelo portal.</p>
          </div>
        </div>

        <div className="lp-quem-cta">
          <a className="btn btn-cyan" href="#gate-card" onClick={scrollToGate}>
            <span>Ver o portal por dentro</span><span className="ar">→</span>
          </a>
          <button type="button" className="btn btn-ghost" onClick={openWhats}>
            <span>Falar no WhatsApp</span>
          </button>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="trk">
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
        </div>
      </div>

      <footer className="lp-foot">
        {/* Mesma linha técnica do rodapé da home e das páginas internas. */}
        BEWILD · SÃO PAULO, BRASIL · CNPJ 47.350.338/0001-37 · RESP. TÉCNICO · THIAGO DANTAS DO AMOR · CAU A162437-7
        <span>Portal de acompanhamento · Bwild Workflow</span>
        <span>© 2026 Bewild</span>
      </footer>
    </div>
  );
}
