/**
 * LpObraPage — /o · página fantasma (destino do QR da placa de obra).
 * Fluxo (definido com o Rodrigo): gate (nome + telefone + e-mail) ->
 * salva o lead -> redireciona pro PORTAL NAVEGÁVEL real (Bwild Workflow),
 * o mesmo demo linkado no orçamento público, com o sufixo ?cta=placa pra
 * diferenciar do link usado nos orçamentos do Pedro (o CTA no portal é
 * renderizado no app do Workflow só quando esse flag está presente).
 *  - noindex, sem nav/footer global, acessível só por URL direta (QR).
 *  - Lead via `sendLead` (notify-lead, `form_path: "/o"`), mesmo pipeline
 *    da DiagnosticoPage.
 *  - O redirecionamento só acontece DEPOIS que o envio termina (navegar antes
 *    abortava a requisição). Sem confirmação, o visitante vê um aviso com o
 *    WhatsApp já preenchido em vez de ser levado embora em silêncio.
 */
import { useEffect, useRef, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import { whatsappHref } from "@/components/landing/content";
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
import "@/styles/bw-lp.css";

/**
 * Vitrine dedicada do portal (Bwild Workflow) — rota /vitrine/:projectId.
 * Marca a sessão como "vitrine da placa" (ativa o CTA comercial no portal) e
 * encaminha pro mesmo demo público. O link dos orçamentos do Pedro vai direto
 * pro /auth, sem vitrine, então lá o CTA não aparece.
 *
 * ⚠️ GO-LIVE: hoje aponta pro PREVIEW do Workflow (funciona sem publicar).
 * Antes de publicar o site em produção: (1) publique o app do Workflow e
 * (2) troque esta URL pela de produção abaixo.
 *   Produção: https://bwildworkflow.com/vitrine/ecf601c3-87f9-4824-9fb3-26a96d120761
 */
const WORKFLOW_DEMO_URL =
  "https://id-preview--c9754542-d1f4-4007-9ead-4212e17bb44e.lovable.app/vitrine/ecf601c3-87f9-4824-9fb3-26a96d120761";

/** Atribuição padrão da placa (a URL do QR pode sobrescrever campo a campo). */
const UTM_PADRAO: QrUtmDefaults = { utm_source: "qr", utm_medium: "placa", utm_campaign: "obra-placa" };

type Campo = "nome" | "whats" | "email";
const CAMPOS: readonly Campo[] = ["nome", "whats", "email"];
const CAMPO_ID: Record<Campo, string> = { nome: "g-nome", whats: "g-whats", email: "g-email" };

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

  // form → (envio) → opening (entregue: redireciona) | fallback (sem confirmação)
  const [stage, setStage] = useState<"form" | "opening" | "fallback">("form");
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  // WhatsApp com os dados do gate — saída quando a entrega não é confirmada.
  const [waLeadUrl, setWaLeadUrl] = useState<string | null>(null);
  const lastPayload = useRef<LeadPayload | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const { sending: submitting, outcome, submit, isMounted } = useLeadSubmit({ method: "lp_obra_gate" });

  const errors = validar({ nome, whats, email });
  const erro = (k: Campo) => (touched[k] ? errors[k] : undefined);
  const touch = (k: Campo) => setTouched((t) => ({ ...t, [k]: true }));

  // O formulário é trocado pelo aviso: o foco vai junto.
  useEffect(() => {
    if (stage !== "form") cardRef.current?.focus();
  }, [stage]);

  const goPortal = () => {
    window.location.assign(WORKFLOW_DEMO_URL);
  };

  const continuarParaPortal = () => {
    trackEvent("open_portal_demo", { category: "lp_obra", label: lastPayload.current?.utm_campaign });
    goPortal();
  };

  async function enviar(payload: LeadPayload) {
    const result = await submit(payload, { params: { location: bairro || undefined } });
    // null = envio já em andamento; página desmontada = o visitante saiu
    // (voltar do navegador) e não deve ser arrastado para o portal.
    if (!result || !isMounted()) return;
    if (result === "delivered") {
      trackEvent("open_portal_demo", { category: "lp_obra", label: payload.utm_campaign });
      setStage("opening");
      // A requisição já terminou: navegar agora não aborta a gravação do lead.
      goPortal();
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
          <BewildLogo className="hero-logo" />
          <div className="hero-eyebrow">
            <span className="mono tag">{eyebrowText}</span>
          </div>
          <h1>
            Você parou em frente a uma obra.
            <span className="lo">Veja como ela anda por dentro.</span>
          </h1>
          <p className="sub">
            Atrás dessa placa, um studio está virando renda, sem o dono entrar na
            obra. Deixe seu contato pra abrir o portal navegável que o cliente
            Bewild usa pra acompanhar a obra, do primeiro dia à entrega.
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
              <h3>Veja a obra por dentro</h3>
              <p>Deixe seu contato para abrir o portal navegável que nossos clientes usam para acompanhar a obra, do primeiro dia até a entrega.</p>
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
                <span>{submitting ? "Abrindo…" : "Ver portal"}</span><span className="ar" aria-hidden="true">→</span>
              </button>
              <button type="button" className="skip" onClick={openWhats}>Prefiro falar no WhatsApp</button>
            </form>
          ) : stage === "opening" ? (
            <div id="gate-card" className="gate-card" tabIndex={-1} ref={cardRef}>
              <div className="eye">Portal de acompanhamento</div>
              <h3>Abrindo o portal…</h3>
              <p>Você está sendo levado pro portal navegável da Bewild. Se não abrir em alguns segundos, use o botão abaixo.</p>
              <button type="button" className="btn btn-cyan submit" onClick={goPortal}>
                <span>Abrir o portal</span><span className="ar" aria-hidden="true">→</span>
              </button>
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
                  <p>Mande seus dados pelo WhatsApp — a mensagem já vai pronta — ou tente de novo. O portal continua liberado.</p>
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
                {outcome === "failed" ? "Ver o portal mesmo assim" : "Continuar para o portal"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 01 — QUEM FAZ */}
      <section className="lp-quem" aria-label="Quem faz essa obra">
        <div className="sec-mark"><span className="n">01</span><span className="t">Quem faz essa obra</span><span className="ln" /></div>
        <div className="lp-quem-head">
          <h2>A Bewild constrói studios pra render. <i>Este é um deles.</i></h2>
          <p className="lead">Projeto, obra, marcenaria, mobília e decoração em um único contrato. Já somamos +160 reformas entregues · +200 projetos, prontos para receber hóspedes.</p>
        </div>
        <div className="lp-quem-data">
          <div className="cell"><b>+160</b><span>reformas entregues · +200 projetos</span></div>
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
            <video ref={videoArqRef} src="/videos/arquiteta-medicao.mp4" poster="/videos/arquiteta-medicao-poster.jpg" muted loop playsInline preload="metadata" aria-label="Arquiteta da Bewild fazendo a medição do imóvel" />
          </div>
        </div>

        <div className="vblock invertido">
          <div className="vframe">
            <video ref={videoObraRef} src="/videos/time-obra.mp4" poster="/videos/time-obra-poster.jpg" muted loop playsInline preload="metadata" aria-label="Time de obra da Bewild a caminho da reforma" />
          </div>
          <div className="vtext">
            <p className="vtag">e quem executa tem rosto</p>
            <h3>A obra que você não toca tem <em>time próprio.</em></h3>
            <p>Quem reforma trabalha na Bewild, não é um terceiro que aparece e some. O dono acompanha tudo à distância pelo portal.</p>
          </div>
        </div>

        <div className="lp-quem-cta">
          <a className="btn btn-cyan" href="#gate-card" onClick={scrollToGate}>
            <span>Ver esta obra por dentro</span><span className="ar">→</span>
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
