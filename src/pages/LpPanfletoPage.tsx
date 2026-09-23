/**
 * LpPanfletoPage — /p · página fantasma (destino do QR do panfleto).
 *
 * Requisitos críticos:
 *  - noindex (robots), sem nav global, sem footer global.
 *  - Acessível apenas via URL direta (QR).
 *  - Mesmo pipeline de lead da DiagnosticoPage (`sendLead` → notify-lead,
 *    `form_path: "/p"`), com o WhatsApp aberto dentro do gesto do envio.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useSeo } from "@/lib/useSeo";
import { whatsappHref } from "@/components/landing/content";
import { trackEvent } from "@/lib/ga4";
import type { LeadPayload } from "@/lib/leadDelivery";
import {
  LEAD_CHAVES,
  LEAD_OBJETIVOS,
  buildLeadMessage,
  fieldErrorId,
  fieldErrorProps,
  firstInvalidField,
  isValidAreaM2,
  isValidEmail,
  parseAreaM2,
  sanitizeAreaInput,
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

const OBJETIVOS = LEAD_OBJETIVOS;
const CHAVES = LEAD_CHAVES;

/** Atribuição padrão da peça impressa (a URL do QR pode sobrescrever campo a campo). */
const UTM_PADRAO: QrUtmDefaults = { utm_source: "qr", utm_medium: "panfleto", utm_campaign: "panfleto" };

type Campo = "nome" | "whats" | "email" | "local" | "chaves" | "objetivo" | "metragem";
const CAMPOS: readonly Campo[] = ["nome", "whats", "email", "local", "chaves", "objetivo", "metragem"];
const CAMPO_ID: Record<Campo, string> = {
  nome: "p-nome",
  whats: "p-whats",
  email: "p-email",
  local: "p-local",
  chaves: "p-chaves",
  objetivo: "p-objetivo",
  metragem: "p-m2",
};

function validar(v: Record<Campo, string>): FieldErrors<Campo> {
  const e: FieldErrors<Campo> = {};
  if (v.nome.trim().length < 2) e.nome = "Informe seu nome.";
  if (!isValidBrPhone(v.whats)) e.whats = "Informe um WhatsApp com DDD.";
  if (!isValidEmail(v.email)) e.email = v.email.trim() ? "Confira o e-mail digitado." : "Informe seu e-mail.";
  if (v.local.trim().length < 2) e.local = "Informe o bairro do imóvel.";
  if (!v.chaves) e.chaves = "Selecione uma opção.";
  if (!v.objetivo) e.objetivo = "Selecione o objetivo.";
  if (!isValidAreaM2(parseAreaM2(v.metragem))) {
    e.metragem = v.metragem.trim() ? "Confira a metragem (em m²)." : "Informe a metragem aproximada.";
  }
  return e;
}

export default function LpPanfletoPage() {
  const params =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const bairroRaw = params?.get("bairro")?.trim() || "";
  const bairro = bairroRaw || null;
  const bairroUp = bairro ? bairro.toUpperCase() : "";
  const videoArqRef = useVideoAutoplayInView();
  const videoObraRef = useVideoAutoplayInView();

  useSeo({
    title: "Bewild · diagnóstico do seu studio",
    description: "Página do panfleto Bewild. Solicite o diagnóstico do seu studio.",
    canonicalPath: "/p",
    noindex: true,
  });

  // Form
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [email, setEmail] = useState("");
  const [local, setLocal] = useState(bairro || "");
  const [chaves, setChaves] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [metragem, setMetragem] = useState("");
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  // WhatsApp COM os dados — reusado no aviso quando a entrega não é confirmada.
  const [waLeadUrl, setWaLeadUrl] = useState<string | null>(null);
  const lastPayload = useRef<LeadPayload | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);
  const { sending, outcome, submit } = useLeadSubmit({ method: "lp_panfleto_form" });

  const errors = validar({ nome, whats, email, local, chaves, objetivo, metragem });
  const erro = (k: Campo) => (touched[k] ? errors[k] : undefined);
  const touch = (k: Campo) => setTouched((t) => ({ ...t, [k]: true }));

  // O formulário some quando há resultado: o foco vai para o aviso.
  useEffect(() => {
    if (outcome) successRef.current?.focus();
  }, [outcome]);

  const messageText = useMemo(
    () =>
      buildLeadMessage("[PANFLETO] Olá! Quero o diagnóstico do meu studio.", [
        ["Nome", nome],
        ["WhatsApp", whats],
        ["E-mail", email],
        ["Bairro", local],
        ["Chaves", chaves],
        ["Objetivo", objetivo],
        ["Metragem (m²)", metragem],
      ]),
    [nome, whats, email, local, chaves, objetivo, metragem],
  );

  function enviar(payload: LeadPayload, abrirWhatsapp?: string) {
    void submit(payload, {
      beforeSend: abrirWhatsapp ? () => openWhatsapp(abrirWhatsapp) : undefined,
      handedToWhatsapp: true,
      params: {
        objetivo: payload.objetivo || undefined,
        chaves: payload.chaves || undefined,
        location: payload.location || undefined,
      },
    });
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
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
      location: local.trim() || null,
      // Decimal de verdade ("32,5" → 32.5); `fitLeadPayload` arredonda para a coluna INTEGER.
      area_m2: parseAreaM2(metragem),
      objetivo: objetivo || null,
      chaves: chaves || null,
      planta: null,
      message: null,
      ...attribution,
      user_agent: browserUserAgent(),
      form_path: "/p",
    };
    lastPayload.current = payload;

    // WhatsApp abre ANTES de qualquer await: depois dele o Safari/Chrome
    // mobile bloqueiam o popup. O aviso só diz "recebemos" com confirmação.
    const url = whatsappHref(`${messageText}\n(origem: ${attribution.utm_campaign})`);
    setWaLeadUrl(url);
    enviar(payload, url);
  };

  const reenviar = () => {
    // Só em falha confirmada (nada gravado); o WhatsApp já foi aberto uma vez.
    if (lastPayload.current && !sending) enviar(lastPayload.current);
  };

  const openWhatsRaw = () => {
    const campanha = collectLeadAttribution(UTM_PADRAO).utm_campaign;
    trackEvent("click_whatsapp", { category: "lp_panfleto", label: campanha });
    const bairroTxt = bairro ? ` no bairro ${bairro}` : "";
    const msg = `[PANFLETO] Olá! Recebi o panfleto da Bewild e quero o diagnóstico do meu studio${bairroTxt}. (origem: ${campanha})`;
    openWhatsapp(whatsappHref(msg));
  };

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document
      .getElementById("diagnostico")
      ?.scrollIntoView({ behavior: scrollBehavior() });
  };

  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sheetNo = bairro ? `SHEET · PANFLETO ${bairroUp}` : "SHEET · PANFLETO";

  return (
    <div className="bw-lp">
      <div className="bw-grain" aria-hidden="true" />
      <div className="bw-frame" aria-hidden="true">
        <i className="tk tl" /><i className="tk tr" /><i className="tk bl" /><i className="tk br" />
      </div>
      <div className="bw-titleblock" aria-hidden="true">
        BEWILD<br /><b>BW-PANFLETO</b><br />SÃO PAULO · BR
      </div>
      <div className="bw-sheetno" aria-hidden="true">{sheetNo}</div>

      {/* HERO */}
      <section className="hero" aria-label="Reforma turn-key Bewild">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-top">
          <BewildLogo className="hero-logo" />
          <div className="hero-eyebrow">
            <span className="mono tag">Reforma turn-key de studios · São Paulo</span>
          </div>
          <h1>
            Seu studio pronto pra render.
            <span className="lo">Sem você virar gerente de obra.</span>
          </h1>
          <p className="sub">
            Projeto, obra, marcenaria, mobília e decoração em um único contrato.
            Você acompanha tudo pelo portal. O trabalho fica com a gente.
          </p>
          <div className="cta">
            <a className="btn btn-cyan" href="#diagnostico" onClick={scrollToForm}>
              <span>Solicitar orçamento</span><span className="ar">→</span>
            </a>
            <button className="btn btn-ghost" type="button" onClick={openWhatsRaw}>
              <span>Falar no WhatsApp</span>
            </button>
          </div>
        </div>

        <div className="hero-data">
          <div className="cell"><b>+160</b><span>reformas entregues · +200 projetos</span></div>
          <div className="cell"><b>60</b><span>dias úteis · a partir de</span></div>
          <div className="cell"><b>05</b><span>anos de garantia</span></div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="trk">
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
          <span>CONSTRUÍDO POR QUEM NÃO ACEITA O ÓBVIO <i>/</i> BUILT BY THE WILD ONES <i>/</i> </span>
        </div>
      </div>

      {/* 01 — DIAGNÓSTICO */}
      <section className="paper" id="diagnostico" aria-label="Diagnóstico do studio">
        <div className="sec-mark"><span className="n">01</span><span className="t">Diagnóstico</span><span className="ln" /></div>

        <div className="form-wrap">
          <div className="pitch">
            <h2>Começa com um <i>diagnóstico.</i></h2>
            <p>
              Você manda os dados do imóvel. A gente devolve uma leitura de escopo,
              projeto e próximos passos. Sem compromisso.
            </p>
            <div className="trust"><b>✓</b> +160 reformas entregues · +200 projetos</div>
          </div>

          <form
            className={`formcard${outcome ? " done" : ""}`}
            onSubmit={onSubmit}
            noValidate
            aria-label="Diagnóstico Bewild"
          >
            <div className="eye">Diagnóstico Bewild</div>
            <div className="form-body">
              <div className="fld">
                <label htmlFor="p-nome">Nome <span className="req" aria-hidden="true">*</span></label>
                <input id="p-nome" type="text" autoComplete="name" value={nome} maxLength={120}
                  onChange={(e) => setNome(e.target.value)}
                  onBlur={() => touch("nome")} required
                  {...fieldErrorProps("p-nome", erro("nome"))} />
                {erro("nome") && <p className="fld-err" id={fieldErrorId("p-nome")}>{erro("nome")}</p>}
              </div>
              <div className="frow">
                <div className="fld">
                  <label htmlFor="p-whats">WhatsApp <span className="req" aria-hidden="true">*</span></label>
                  <input id="p-whats" type="tel" inputMode="tel" placeholder="(11) 99999-9999"
                    autoComplete="tel" value={whats}
                    onChange={(e) => setWhats(formatBrPhone(e.target.value))}
                    onBlur={() => touch("whats")} required
                    {...fieldErrorProps("p-whats", erro("whats"))} />
                  {erro("whats") && <p className="fld-err" id={fieldErrorId("p-whats")}>{erro("whats")}</p>}
                </div>
                <div className="fld">
                  <label htmlFor="p-email">E-mail <span className="req" aria-hidden="true">*</span></label>
                  <input id="p-email" type="email" autoComplete="email" placeholder="voce@email.com"
                    value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => touch("email")} required
                    {...fieldErrorProps("p-email", erro("email"))} />
                  {erro("email") && <p className="fld-err" id={fieldErrorId("p-email")}>{erro("email")}</p>}
                </div>
              </div>
              <div className="fld">
                <label htmlFor="p-local">Bairro do imóvel <span className="req" aria-hidden="true">*</span></label>
                <input id="p-local" type="text" placeholder="Ex: Pinheiros, Itaim, Butantã"
                  value={local} maxLength={120} onChange={(e) => setLocal(e.target.value)}
                  onBlur={() => touch("local")} required
                  {...fieldErrorProps("p-local", erro("local"))} />
                {erro("local") && <p className="fld-err" id={fieldErrorId("p-local")}>{erro("local")}</p>}
              </div>

              <fieldset className="chips" id="p-chaves" aria-describedby={erro("chaves") ? fieldErrorId("p-chaves") : undefined}>
                <legend>Já tem as chaves do imóvel? <span className="req" aria-hidden="true">*</span></legend>
                <div className="opts">
                  {CHAVES.map((opt) => (
                    <button key={opt} type="button" aria-pressed={chaves === opt}
                      className={`opt${chaves === opt ? " sel" : ""}`}
                      onClick={() => { setChaves(chaves === opt ? "" : opt); touch("chaves"); }}>{opt}</button>
                  ))}
                </div>
                {erro("chaves") && <p className="fld-err" id={fieldErrorId("p-chaves")}>{erro("chaves")}</p>}
              </fieldset>

              <fieldset className="chips" id="p-objetivo" aria-describedby={erro("objetivo") ? fieldErrorId("p-objetivo") : undefined}>
                <legend>Objetivo <span className="req" aria-hidden="true">*</span></legend>
                <div className="opts">
                  {OBJETIVOS.map((opt) => (
                    <button key={opt} type="button" aria-pressed={objetivo === opt}
                      className={`opt${objetivo === opt ? " sel" : ""}`}
                      onClick={() => { setObjetivo(objetivo === opt ? "" : opt); touch("objetivo"); }}>{opt}</button>
                  ))}
                </div>
                {erro("objetivo") && <p className="fld-err" id={fieldErrorId("p-objetivo")}>{erro("objetivo")}</p>}
              </fieldset>

              <div className="fld">
                <label htmlFor="p-m2">Metragem (m²) <span className="req" aria-hidden="true">*</span></label>
                <input id="p-m2" type="text" inputMode="decimal" placeholder="32"
                  value={metragem}
                  onChange={(e) => setMetragem(sanitizeAreaInput(e.target.value))}
                  onBlur={() => touch("metragem")} required
                  {...fieldErrorProps("p-m2", erro("metragem"))} />
                {erro("metragem") && <p className="fld-err" id={fieldErrorId("p-m2")}>{erro("metragem")}</p>}
              </div>

              {/* Habilitado com campos pendentes: o clique mostra os erros e leva o foco ao primeiro. */}
              <button type="submit" className="btn btn-cyan submit" disabled={sending}>
                <span>{sending ? "Enviando…" : "Solicitar orçamento"}</span><span className="ar" aria-hidden="true">→</span>
              </button>
              <p className="guarantee">Sem compromisso · a gente só liga se você pedir</p>

              <div className="or"><span>ou</span></div>

              <button type="button" className="btn btn-line" onClick={openWhatsRaw}>
                <span>Prefiro falar no WhatsApp</span>
              </button>
            </div>
            <div className="success" role="status" tabIndex={-1} ref={successRef}>
              {outcome && (
                <div className="ok" aria-hidden="true">{outcome === "delivered" ? "✓" : "!"}</div>
              )}
              {outcome === "delivered" && (
                <>
                  <h3>Recebemos seus dados.</h3>
                  <p>Nosso time comercial vai falar com você no WhatsApp.</p>
                </>
              )}
              {outcome === "failed" && (
                <>
                  <h3>Abrimos o WhatsApp com seus dados.</h3>
                  <p>
                    Não conseguimos registrar os dados pelo site. Envie a mensagem que já está
                    pronta no WhatsApp para garantir o atendimento.
                  </p>
                </>
              )}
              {outcome === "timedOut" && (
                <>
                  <h3>Seus dados podem já ter chegado.</h3>
                  <p>
                    A confirmação demorou mais que o normal. Para garantir, envie a mensagem que já
                    está pronta no WhatsApp — se já tivermos recebido, é só ignorar.
                  </p>
                </>
              )}
              {outcome && outcome !== "delivered" && waLeadUrl && (
                <div className="success-act">
                  <a className="btn btn-line" href={waLeadUrl} target="_blank" rel="noopener noreferrer">
                    <span>Abrir o WhatsApp de novo</span><span className="ar" aria-hidden="true">→</span>
                  </a>
                  {outcome === "failed" && (
                    <button type="button" className="skip" onClick={reenviar} disabled={sending}>
                      {sending ? "Enviando…" : "Tentar enviar de novo"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* 02 — RESULTADO REAL */}
      <section className="sec sec-dark" aria-label="Resultado real Vivian">
        <div className="sec-mark"><span className="n">02</span><span className="t">Resultado real</span><span className="ln" /></div>
        <figure className="raf-quote">
          <blockquote>“Esses studios serão um negócio pra mim. Renda vitalícia.”</blockquote>
          <figcaption>Vivian · cliente Bewild · studio na Vila Olímpia · 98% de ocupação em setembro</figcaption>
        </figure>
        <p className="raf-note">Resultado de um cliente real. Ocupação e diária variam conforme imóvel, região e operação.</p>
      </section>

      {/* 03 — QUEM FAZ */}
      <section className="lp-quem" aria-label="Quem faz">
        <div className="sec-mark"><span className="n">03</span><span className="t">Quem faz</span><span className="ln" /></div>
        <div className="lp-quem-head">
          <h2>Quem constrói o seu studio. <i>Time próprio, do projeto à entrega.</i></h2>
          <p className="lead">Projeto, obra, marcenaria, mobília e decoração em um único contrato. Já somamos +160 reformas entregues · +200 projetos, prontos para receber hóspedes.</p>
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
          <a className="btn btn-cyan" href="#diagnostico" onClick={scrollToForm}>
            <span>Solicitar orçamento</span><span className="ar">→</span>
          </a>
        </div>
      </section>



      {/* FOOTER MÍNIMO */}
      <footer className="lp-foot">
        {/* Mesma linha técnica do rodapé da home e das páginas internas. */}
        BEWILD · SÃO PAULO, BRASIL · CNPJ 47.350.338/0001-37 · RESP. TÉCNICO · THIAGO DANTAS DO AMOR · CAU A162437-7
        <span>© 2026 Bewild</span>
      </footer>

      {/* STICKY MOBILE */}
      <div className={`sticky${showSticky ? " show" : ""}`} aria-hidden={!showSticky}>
        <a
          className="btn btn-cyan"
          href="#diagnostico"
          tabIndex={showSticky ? 0 : -1}
          onClick={scrollToForm}
        >
          <span>Solicitar orçamento</span><span className="ar">→</span>
        </a>
      </div>
    </div>
  );
}
