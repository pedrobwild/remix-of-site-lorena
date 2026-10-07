import { useEffect, useRef, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import FormPrivacyNote from "@/components/FormPrivacyNote";
import { whatsappHref } from "@/components/landing/content";
import { trackEvent } from "@/lib/ga4";
import type { LeadPayload } from "@/lib/leadDelivery";
import {
  LEAD_CHAVES,
  buildLeadMessage,
  fieldErrorId,
  fieldErrorProps,
  firstInvalidField,
  isValidEmail,
  touchAll,
  type FieldErrors,
  type LeadObjetivo,
} from "@/lib/leadForm";
import { formatBrPhone, isValidBrPhone, normalizeBrPhoneDigits } from "@/lib/phone";
import { useCtaClickTracking } from "@/lib/trackCta";
import { scrollBehavior } from "@/lib/reducedMotion";
import {
  browserUserAgent,
  collectLeadAttribution,
  focusField,
  useLeadSubmit,
} from "@/lib/useLeadSubmit";
import { useSeo } from "@/lib/useSeo";
import "./contato.css";
import "./servico-reforma.css";
import "./orcamento.css";
import fotoObra from "@/assets/orcamento/obra-bewild.webp";
import {
  AREA_SLIDER,
  ESTADOS_IMOVEL,
  ETAPAS,
  FAQ,
  OBJETIVOS,
  type EstadoImovel,
} from "@/content/pages/orcamento";

type Campo = "bairro" | "nome" | "whats" | "mail";
type Chaves = (typeof LEAD_CHAVES)[number];

/** O valor enviado é o canônico do CRM (LEAD_CHAVES); só o rótulo muda aqui. */
const ROTULO_CHAVES: Record<Chaves, string> = {
  Sim: "Sim",
  "Ainda não": "Ainda não",
  "Estou comprando": "Estou comprando o imóvel",
};

const CAMPO_ID: Record<Campo, string> = {
  bairro: "orc-bairro",
  nome: "orc-nome",
  whats: "orc-whats",
  mail: "orc-mail",
};

/** Campos validados em cada etapa (as etapas 02 e 03 não têm obrigatório). */
const CAMPOS_DA_ETAPA: ReadonlyArray<readonly Campo[]> = [["bairro"], [], [], ["nome", "whats", "mail"]];
const ULTIMA = ETAPAS.length - 1;

function validar(v: Record<Campo, string>): FieldErrors<Campo> {
  const e: FieldErrors<Campo> = {};
  if (v.bairro.trim().length < 2) e.bairro = "Informe o bairro.";
  if (v.nome.trim().length < 2) e.nome = "Informe seu nome.";
  if (!isValidBrPhone(v.whats)) e.whats = "Informe um número com DDD.";
  if (!v.mail.trim()) e.mail = "Informe seu e-mail.";
  else if (!isValidEmail(v.mail)) e.mail = "Confira o e-mail digitado.";
  return e;
}

/** Primeira etapa, de `de` até antes de `ate`, com campo obrigatório inválido. */
function etapaInvalida(errors: FieldErrors<Campo>, de: number, ate: number): number | null {
  for (let i = de; i < ate; i++) {
    if (firstInvalidField(CAMPOS_DA_ETAPA[i], errors)) return i;
  }
  return null;
}


/**
 * OrcamentoPage — /orcamento
 *
 * Pedido de orçamento em 4 etapas curtas (imóvel, objetivo, situação,
 * contato), com a foto da obra ao lado. Entrega no mesmo canal
 * do /contato (edge function `notify-lead`, via `sendLead`), marcado com
 * `form_path: "/orcamento"`; `landing_path` segue a atribuição da sessão.
 *
 * GA4: `orcamento_step` (step 1–4) a cada etapa concluída, para ver onde o
 * visitante desiste; `generate_lead` continua saindo do `useLeadSubmit`.
 */
export default function OrcamentoPage() {
  useCtaClickTracking("orcamento");

  const [step, setStep] = useState(0);
  const [vista, setVista] = useState(0); // etapa mais avançada já aberta
  const [bairro, setBairro] = useState("");
  const [area, setArea] = useState<number>(AREA_SLIDER.padrao);
  const [objetivo, setObjetivo] = useState<LeadObjetivo>("Short stay");
  const [chaves, setChaves] = useState<Chaves | "">("");
  const [estado, setEstado] = useState<EstadoImovel | "">("");
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [mail, setMail] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [ligacao, setLigacao] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Campo, boolean>>>({});
  // Estado final mostrado no lugar das etapas ("Refazer simulação" limpa).
  const [final, setFinal] = useState<"delivered" | "timedOut" | null>(null);
  // WhatsApp com os dados do pedido — saída quando a entrega não é confirmada.
  const [whatsLink, setWhatsLink] = useState<string | null>(null);

  const topoRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const perguntaRef = useRef<HTMLHeadingElement | null>(null);
  const resultadoRef = useRef<HTMLDivElement | null>(null);
  // Troca de etapa pedida pelo visitante: foco no H2 (ou no campo inválido).
  const focoPendente = useRef<"pergunta" | Campo | null>(null);

  const { sending: enviando, outcome, submit, isMounted } = useLeadSubmit({ method: "orcamento_form" });

  const errors = validar({ bairro, nome, whats, mail });
  const erro = (k: Campo) => (touched[k] ? errors[k] : undefined);
  const touch = (k: Campo) => setTouched((t) => ({ ...t, [k]: true }));

  useEffect(() => {
    const alvo = focoPendente.current;
    if (!alvo) return;
    focoPendente.current = null;
    if (alvo === "pergunta") {
      perguntaRef.current?.focus({ preventScroll: true });
      // No celular a etapa nova começa fora da tela: volta ao início do formulário (progresso), sem repetir a abertura.
      if (typeof window !== "undefined" && window.matchMedia?.("(max-width: 820px)").matches) {
        (formRef.current ?? topoRef.current)?.scrollIntoView?.({ block: "start", behavior: scrollBehavior() });
      }
    } else {
      focusField(CAMPO_ID[alvo]);
    }
  }, [step]);

  useEffect(() => {
    if (final) resultadoRef.current?.focus();
  }, [final]);

  function irPara(n: number, foco: "pergunta" | Campo = "pergunta") {
    focoPendente.current = foco;
    setStep(n);
    setVista((v) => Math.max(v, n));
  }

  /** Mostra os erros da etapa `i`; devolve false se ela tiver campo inválido. */
  function conferir(i: number): boolean {
    const campos = CAMPOS_DA_ETAPA[i];
    const primeiro = firstInvalidField(campos, errors);
    if (!primeiro) return true;
    setTouched((t) => ({ ...t, ...touchAll(campos) }));
    if (i === step) focusField(CAMPO_ID[primeiro]);
    else irPara(i, primeiro);
    return false;
  }

  /** Clique na barra de progresso: volta livre; avança só por etapas válidas. */
  function clicarEtapa(i: number) {
    if (i === step || i > vista) return;
    if (i < step) return irPara(i);
    const parada = etapaInvalida(errors, step, i);
    if (parada !== null) conferir(parada);
    else irPara(i);
  }

  function continuar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando || !conferir(step)) return;
    if (step === ULTIMA) {
      // Etapas anteriores podem ter sido reabertas e apagadas pelo progresso.
      const parada = etapaInvalida(errors, 0, ULTIMA);
      if (parada !== null) return void conferir(parada);
    }
    trackEvent("orcamento_step", { step: step + 1 });
    if (step < ULTIMA) irPara(step + 1);
    else void enviar();
  }

  async function enviar() {
    const area_txt = String(area);
    setWhatsLink(
      whatsappHref(
        buildLeadMessage("Olá! Quero um orçamento de reforma para o meu apartamento.", [
          ["Nome", nome],
          ["WhatsApp", whats],
          ["E-mail", mail],
          ["Bairro", bairro],
          ["Metragem (m²)", area_txt],
          ["Objetivo", OBJETIVOS.find((o) => o.value === objetivo)?.label ?? objetivo],
          ["Chaves", chaves],
          ["Estado", estado],
          ["Atendimento prioritário", urgente ? "sim, tenho urgência" : ""],
          ["Prefere ligação", ligacao ? "sim" : ""],
        ]),
      ),
    );

    const payload: LeadPayload = {
      name: nome.trim(),
      whatsapp: normalizeBrPhoneDigits(whats),
      email: mail.trim(),
      // Estado do imóvel, urgência e preferência por ligação não têm coluna no CRM; vão na mensagem.
      message:
        [
          estado && `Estado: ${estado}`,
          urgente && "Atendimento prioritário: tem urgência",
          ligacao && "Prefere atendimento por ligação",
        ]
          .filter(Boolean)
          .join("\n") || null,
      location: bairro.trim(),
      area_m2: area,
      objetivo,
      chaves: chaves || null,
      planta: null,
      ...collectLeadAttribution(),
      user_agent: browserUserAgent(),
      form_path: "/orcamento",
    };

    const resultado = await submit(payload, {
      params: { objetivo, location: bairro.trim() || undefined },
    });
    if (isMounted() && (resultado === "delivered" || resultado === "timedOut")) setFinal(resultado);
  }

  function refazer() {
    setFinal(null);
    irPara(0);
  }

  useSeo({
    title: "Orçamento de reforma turnkey em São Paulo | Bewild",
    description:
      "Peça o orçamento da reforma turnkey do seu studio ou apartamento em São Paulo: faixa de investimento em 1 dia útil, projeto 3D, preço fechado e prazo em contrato.",
    keywords:
      "orçamento de projeto de arquitetura, quanto custa um projeto de arquitetura em São Paulo, orçamento de reforma de studio, quanto custa reformar um studio em São Paulo, custo de reforma de studio, prazo de reforma de studio, orçamento de reforma de apartamento, orçamento de reforma em SP, preço e prazo de reforma São Paulo, reforma de studio para short stay, Bewild",
    canonicalPath: "/orcamento",
    ogType: "website",
  });

  const primeiroNome = nome.trim().split(" ")[0];
  const etapa = ETAPAS[step];
  const falhou = outcome === "failed" && !enviando && step === ULTIMA;

  return (
    <div className="bwa-contact-page bwa-orc-page">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-orc" id="formulario">
          <div className="bwa-shell bwa-orc-grid">
            <div className="bwa-orc-main" ref={topoRef}>
              <p className="bwa-orc-kicker">Orçamento · São Paulo</p>
              {/* H1 com a palavra-chave (rodada 3 de SEO). */}
              <h1 className="bwa-orc-h1">Orçamento de reforma turnkey de apartamento em SP.</h1>
              <p className="bwa-orc-sub">
                <strong>São só as informações iniciais para conhecermos o seu imóvel.</strong> Com elas, um
                especialista da Bewild entra em contato pelo WhatsApp em até um dia útil para entender o
                projeto mais a fundo para que seu orçamento personalizado seja elaborado.
              </p>

              {final === "delivered" ? (
                <div className="bwa-orc-done" role="status" tabIndex={-1} ref={resultadoRef}>
                  <p className="bwa-orc-kicker bwa-orc-kicker--ok">Pedido recebido</p>
                  <h2 className="bwa-orc-h2">Obrigado, {primeiroNome}.</h2>
                  <p>
                    Nosso time analisa o apartamento e responde pelo WhatsApp {whats} em até um dia
                    útil. Se quiser adiantar, fale com a gente agora.
                  </p>
                  <div className="bwa-orc-actions">
                    <a
                      className="bwa-orc-btn"
                      href={whatsappHref("Olá, acabei de pedir um orçamento pelo site da Bewild")}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cta="orcamento-whatsapp-obrigado"
                    >
                      Falar no WhatsApp <span aria-hidden="true">→</span>
                    </a>
                    <button className="bwa-orc-btn bwa-orc-btn--ghost" type="button" onClick={refazer}>
                      Refazer simulação
                    </button>
                  </div>
                </div>
              ) : final === "timedOut" ? (
                <div className="bwa-orc-done" role="status" tabIndex={-1} ref={resultadoRef}>
                  <p className="bwa-orc-kicker">Envio sem confirmação</p>
                  <h2 className="bwa-orc-h2">Seu pedido pode já ter chegado, {primeiroNome}.</h2>
                  <p>
                    A confirmação demorou mais que o normal. Para garantir, mande o pedido pelo
                    WhatsApp — a mensagem já vai com os seus dados. Se já tivermos recebido, é só
                    ignorar.
                  </p>
                  {whatsLink && (
                    <div className="bwa-orc-actions">
                      <a className="bwa-orc-btn" href={whatsLink} target="_blank" rel="noopener noreferrer">
                        Enviar pelo WhatsApp <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <form className="bwa-orc-form" ref={formRef} onSubmit={continuar} noValidate aria-label="Pedido de orçamento">
                  <ol className="bwa-orc-progress">
                    {ETAPAS.map((et, i) => (
                      <li key={et.rotulo}>
                        <button
                          type="button"
                          className={i <= step ? "is-done" : undefined}
                          aria-current={i === step ? "step" : undefined}
                          disabled={i > vista}
                          onClick={() => clicarEtapa(i)}
                        >
                          <span className="bwa-orc-progress-bar" aria-hidden="true" />
                          <span className="bwa-orc-progress-n">{String(i + 1).padStart(2, "0")}</span>{" "}
                          <span>{et.rotulo}</span>
                        </button>
                      </li>
                    ))}
                  </ol>

                  <h2 className="bwa-orc-h2" id="orc-pergunta" tabIndex={-1} ref={perguntaRef}>
                    <span className="sr-only">
                      Etapa {step + 1} de {ETAPAS.length}:{" "}
                    </span>
                    {etapa.pergunta}
                  </h2>

                  {step === 0 && (
                    <div className="bwa-orc-fields">
                      <div className="bwa-orc-field">
                        <label htmlFor="orc-bairro">Bairro do apartamento</label>
                        <input
                          id="orc-bairro"
                          type="text"
                          value={bairro}
                          maxLength={120}
                          placeholder="Vila Olímpia, São Paulo-SP"
                          autoComplete="address-level2"
                          enterKeyHint="next"
                          required
                          onChange={(e) => setBairro(e.target.value)}
                          onBlur={() => touch("bairro")}
                          {...fieldErrorProps("orc-bairro", erro("bairro"))}
                        />
                        {erro("bairro") && <em id={fieldErrorId("orc-bairro")}>{erro("bairro")}</em>}
                      </div>

                      <div className="bwa-orc-field">
                        <label htmlFor="orc-area">Metragem privativa</label>
                        <output className="bwa-orc-area-value" htmlFor="orc-area" aria-hidden="true">
                          {area} m²
                        </output>
                        <input
                          id="orc-area"
                          className="bwa-orc-range"
                          type="range"
                          min={AREA_SLIDER.min}
                          max={AREA_SLIDER.max}
                          step={1}
                          value={area}
                          aria-valuetext={`${area} m²`}
                          onChange={(e) => setArea(Number(e.target.value))}
                        />
                        <div className="bwa-orc-range-legend" aria-hidden="true">
                          <span>{AREA_SLIDER.min} m²</span>
                          <span>studio</span>
                          <span>compacto</span>
                          <span>2 dorm.</span>
                          <span>{AREA_SLIDER.max} m²</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="bwa-orc-radios" role="radiogroup" aria-labelledby="orc-pergunta">
                      {OBJETIVOS.map((o) => (
                        <label key={o.value} className="bwa-orc-radio">
                          <input
                            type="radio"
                            name="orc-objetivo"
                            value={o.value}
                            checked={objetivo === o.value}
                            onChange={() => setObjetivo(o.value)}
                          />
                          <span>{o.label}</span>
                          {o.dica && <small>{o.dica}</small>}
                        </label>
                      ))}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="bwa-orc-fields">
                      <fieldset className="bwa-orc-seg">
                        <legend>Já tem as chaves?</legend>
                        <div>
                          {LEAD_CHAVES.map((c) => (
                            <label key={c}>
                              <input
                                type="radio"
                                name="orc-chaves"
                                value={c}
                                checked={chaves === c}
                                onChange={() => setChaves(c)}
                              />
                              <span>{ROTULO_CHAVES[c]}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <fieldset className="bwa-orc-seg">
                        <legend>Estado do imóvel</legend>
                        <div>
                          {ESTADOS_IMOVEL.map((s) => (
                            <label key={s}>
                              <input
                                type="radio"
                                name="orc-estado"
                                value={s}
                                checked={estado === s}
                                onChange={() => setEstado(s)}
                              />
                              <span>{s}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <p className="bwa-orc-note">
                        Sem as chaves ainda? É o melhor momento: projeto e proposta saem pela planta e
                        pelo memorial da construtora.
                      </p>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="bwa-orc-fields">
                      <div className="bwa-orc-field">
                        <label htmlFor="orc-nome">Nome</label>
                        <input
                          id="orc-nome"
                          type="text"
                          value={nome}
                          maxLength={120}
                          autoComplete="name"
                          enterKeyHint="next"
                          required
                          onChange={(e) => setNome(e.target.value)}
                          onBlur={() => touch("nome")}
                          {...fieldErrorProps("orc-nome", erro("nome"))}
                        />
                        {erro("nome") && <em id={fieldErrorId("orc-nome")}>{erro("nome")}</em>}
                      </div>
                      <div className="bwa-orc-field">
                        <label htmlFor="orc-whats">WhatsApp</label>
                        <input
                          id="orc-whats"
                          type="tel"
                          inputMode="tel"
                          enterKeyHint="next"
                          value={whats}
                          autoComplete="tel"
                          placeholder="(11) 90000-0000"
                          required
                          onChange={(e) => setWhats(formatBrPhone(e.target.value))}
                          onBlur={() => touch("whats")}
                          {...fieldErrorProps("orc-whats", erro("whats"))}
                        />
                        {erro("whats") && <em id={fieldErrorId("orc-whats")}>{erro("whats")}</em>}
                      </div>
                      <div className="bwa-orc-field">
                        <label htmlFor="orc-mail">E-mail</label>
                        <input
                          id="orc-mail"
                          type="email"
                          value={mail}
                          maxLength={180}
                          autoComplete="email"
                          inputMode="email"
                          enterKeyHint="send"
                          required
                          onChange={(e) => setMail(e.target.value)}
                          onBlur={() => touch("mail")}
                          {...fieldErrorProps("orc-mail", erro("mail"))}
                        />
                        {erro("mail") && <em id={fieldErrorId("orc-mail")}>{erro("mail")}</em>}
                      </div>
                      <div className="bwa-orc-checks">
                        <label className="bwa-orc-check">
                          <input
                            id="orc-urgente"
                            type="checkbox"
                            checked={urgente}
                            onChange={(e) => setUrgente(e.target.checked)}
                          />
                          <span>Desejo atendimento prioritário, tenho urgência</span>
                        </label>
                        <label className="bwa-orc-check">
                          <input
                            id="orc-ligacao"
                            type="checkbox"
                            checked={ligacao}
                            onChange={(e) => setLigacao(e.target.checked)}
                          />
                          <span>Gosto de atendimento por ligação</span>
                        </label>
                      </div>
                      <FormPrivacyNote platforms="meta-google" className="bwa-orc-privacy">
                        Usamos seus dados para responder ao seu pedido de orçamento.
                      </FormPrivacyNote>
                    </div>
                  )}

                  {falhou && (
                    <div className="bwa-orc-error" role="alert">
                      <p>
                        Não conseguimos enviar seu pedido agora. Tente de novo ou mande pelo WhatsApp —
                        a mensagem já vai com os seus dados.
                      </p>
                      {whatsLink && (
                        <a className="bwa-contact-link" href={whatsLink} target="_blank" rel="noopener noreferrer">
                          Enviar pelo WhatsApp <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="bwa-orc-actions">
                    {/* Habilitado com campos pendentes: o clique mostra os erros e leva o foco ao primeiro. */}
                    <button
                      className="bwa-orc-btn"
                      type="submit"
                      data-cta={step === ULTIMA ? "orcamento-enviar" : `orcamento-etapa-${step + 1}`}
                      disabled={enviando}
                    >
                      {step < ULTIMA
                        ? "Continuar"
                        : enviando
                          ? "Enviando…"
                          : falhou
                            ? "Tentar de novo"
                            : "Pedir orçamento"}
                      <span aria-hidden="true">→</span>
                    </button>
                    {step > 0 && (
                      <button
                        className="bwa-orc-back"
                        type="button"
                        onClick={() => irPara(step - 1)}
                        disabled={enviando}
                      >
                        <span aria-hidden="true">←</span> Voltar
                      </button>
                    )}
                    <p className="bwa-orc-free">Sem custo e sem compromisso</p>
                  </div>
                </form>
              )}
            </div>

            {/* Foto decorativa da coluna da direita; no celular some (o formulário vem primeiro). */}
            <div className="bwa-orc-foto" aria-hidden="true">
              <img src={fotoObra} alt="" width={712} height={1400} decoding="async" />
            </div>
          </div>
        </section>

        <section className="bwa-servico-block" aria-labelledby="faq-orcamento">
          <div className="bwa-shell">
            <h2 className="bwa-servico-h2" id="faq-orcamento">
              Perguntas frequentes sobre o orçamento
            </h2>
            <div className="bwa-servico-faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
            <p className="bwa-servico-text" style={{ marginTop: 24 }}>
              Pronto para pedir? <a href="#formulario">Volte ao formulário</a> ou{" "}
              <a href={whatsappHref("Olá, quero um orçamento de reforma para meu apartamento")} target="_blank" rel="noopener noreferrer">
                fale no WhatsApp
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
