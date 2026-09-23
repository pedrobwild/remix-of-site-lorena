import { useRef, useState } from "react";
import BwaFooter from "@/components/BwaFooter";
import BwaNav from "@/components/BwaNav";
import { whatsappHref } from "@/components/landing/content";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import { breadcrumbJsonLd, useSeo } from "@/lib/useSeo";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { scrollBehavior } from "@/lib/reducedMotion";
import "./escopo.css";

/* ============================================================
 * EscopoPage — /escopo
 * O proprietário descreve o apartamento e o objetivo da reforma;
 * a edge function `scope-plan` gera, via Lovable AI, uma
 * recomendação de escopo + próximos passos. Sem orçamento
 * fechado: tudo é apresentado como referência.
 * ============================================================ */

const OBJETIVOS = [
  "Short stay",
  "Locação tradicional",
  "Uso misto",
  "Moradia",
  "Ainda avaliando",
];

type EscopoItem = {
  titulo: string;
  detalhe: string;
  prioridade: string;
};

type Recomendacao = {
  resumo: string;
  escopo: EscopoItem[];
  prazo_referencia: string;
  faixa_investimento: string;
  atencao: string[];
  proximos_passos: string[];
};

export default function EscopoPage() {
  const { settings } = useSiteSettings();
  const [descricao, setDescricao] = useState("");
  const [objetivo, setObjetivo] = useState(OBJETIVOS[0]);
  const [area, setArea] = useState("");
  const [local, setLocal] = useState("");
  const [orcamento, setOrcamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [recomendacao, setRecomendacao] = useState<Recomendacao | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useSeo({
    title: "Escopo de arquitetura e reforma para apartamento em SP | Bewild",
    description:
      "Descreva seu apartamento e seu objetivo e receba na hora uma recomendação de escopo de arquitetura, engenharia e reforma, prazo de referência e próximos passos com a Bewild.",
    canonicalPath: "/escopo",
    ogType: "website",
    jsonLd: settings
      ? [
          breadcrumbJsonLd(settings, [
            { name: "Início", path: "/" },
            { name: "Escopo com IA", path: "/escopo" },
          ]),
        ]
      : undefined,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (descricao.trim().length < 20) {
      setErro("Conte um pouco mais sobre o apartamento (pelo menos 20 caracteres).");
      return;
    }
    setErro(null);
    setLoading(true);
    trackEvent("scope_plan_request", { objetivo });

    try {
      const { data, error } = await supabase.functions.invoke("scope-plan", {
        body: {
          descricao: descricao.trim(),
          objetivo,
          area: area.trim(),
          local: local.trim(),
          orcamento: orcamento.trim(),
        },
      });

      const payload = data as { recomendacao?: Recomendacao; error?: string } | null;
      if (error || !payload?.recomendacao) {
        setErro(
          payload?.error ||
            "Não conseguimos gerar a recomendação agora. Tente novamente em instantes ou fale com a gente no WhatsApp.",
        );
        return;
      }

      setRecomendacao(payload.recomendacao);
      trackEvent("scope_plan_result", { objetivo });
      window.setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      }, 60);
    } catch {
      setErro("Não conseguimos gerar a recomendação agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bwa-scope-page">
      <BwaNav />

      <main id="main" tabIndex={-1}>
        <section className="bwa-scope-intro">
          <div className="bwa-shell">
            <p className="bwa-label">Escopo com IA · São Paulo</p>
            <h1>Descreva seu apartamento e receba um escopo de reforma sob medida.</h1>
            <p className="bwa-scope-lead">
              Conte como é o imóvel e o que você quer alcançar. Em segundos, você recebe uma
              recomendação de escopo, prazo de referência e os próximos passos. É uma orientação
              inicial — o orçamento fechado vem depois, com nosso time.
            </p>
          </div>
        </section>

        <section className="bwa-scope-content">
          <div className="bwa-shell bwa-scope-grid">
            <form className="bwa-scope-form" onSubmit={onSubmit} noValidate>
              <div className="bwa-scope-field">
                <label htmlFor="escopo-objetivo">Objetivo da reforma</label>
                <select
                  id="escopo-objetivo"
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                >
                  {OBJETIVOS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bwa-scope-row">
                <div className="bwa-scope-field">
                  <label htmlFor="escopo-area">Metragem aproximada</label>
                  <input
                    id="escopo-area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ex.: 28 m²"
                    inputMode="text"
                  />
                </div>
                <div className="bwa-scope-field">
                  <label htmlFor="escopo-local">Bairro ou cidade</label>
                  <input
                    id="escopo-local"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex.: Pinheiros, São Paulo"
                  />
                </div>
              </div>

              <div className="bwa-scope-field">
                <label htmlFor="escopo-orcamento">Investimento pretendido (opcional)</label>
                <input
                  id="escopo-orcamento"
                  value={orcamento}
                  onChange={(e) => setOrcamento(e.target.value)}
                  placeholder="Ex.: até R$ 70 mil"
                />
              </div>

              <div className="bwa-scope-field">
                <label htmlFor="escopo-descricao">Como é o apartamento e o que você deseja</label>
                <textarea
                  id="escopo-descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex.: studio de 26 m² entregue pela construtora, sem marcenaria, com piso cerâmico. Quero deixar pronto para alugar por temporada, com cozinha equipada e uma boa cama."
                  maxLength={4000}
                  required
                  aria-describedby="escopo-dica escopo-aviso-ia"
                />
                <p className="bwa-scope-hint" id="escopo-dica">
                  Quanto mais detalhes (estado atual, ambientes, prioridades), melhor a recomendação.
                </p>
              </div>

              {erro && (
                <p className="bwa-scope-error" role="alert">
                  {erro}
                </p>
              )}

              <button className="bwa-button bwa-scope-submit" type="submit" disabled={loading}>
                {loading ? "Gerando recomendação…" : "Gerar recomendação"}
              </button>
              <p className="bwa-scope-hint" id="escopo-aviso-ia">
                Recomendação gerada por inteligência artificial com base na experiência da Bewild.
                Não substitui visita técnica nem proposta comercial. O texto que você escreve é
                enviado a um provedor de IA só para gerar a recomendação: não inclua nome, telefone
                ou endereço completo. <a href="/privacidade">Política de privacidade</a>.
              </p>
            </form>

            <div ref={resultRef} aria-live="polite">
              {!recomendacao && !loading && (
                <div className="bwa-scope-empty">
                  Sua recomendação aparece aqui: escopo por prioridade, prazo de referência, faixa
                  de investimento, pontos de atenção e próximos passos.
                </div>
              )}

              {loading && (
                <div className="bwa-scope-empty">
                  Analisando a descrição do seu apartamento e montando o escopo…
                </div>
              )}

              {recomendacao && !loading && (
                <article className="bwa-scope-result">
                  <h2>Recomendação para o seu apartamento</h2>
                  <p>{recomendacao.resumo}</p>

                  <div className="bwa-scope-meta">
                    <div>
                      <span>Prazo de referência</span>
                      <strong>{recomendacao.prazo_referencia}</strong>
                    </div>
                    <div>
                      <span>Faixa estimada</span>
                      <strong>{recomendacao.faixa_investimento}</strong>
                    </div>
                  </div>

                  <p className="bwa-scope-block-title">Escopo sugerido</p>
                  <ul className="bwa-scope-items">
                    {recomendacao.escopo?.map((item, i) => (
                      <li className="bwa-scope-item" key={`${item.titulo}-${i}`}>
                        <span className="bwa-scope-tag">{item.prioridade}</span>
                        <h3>{item.titulo}</h3>
                        <p>{item.detalhe}</p>
                      </li>
                    ))}
                  </ul>

                  {recomendacao.atencao?.length > 0 && (
                    <>
                      <p className="bwa-scope-block-title">Pontos de atenção</p>
                      <ul className="bwa-scope-list">
                        {recomendacao.atencao.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {recomendacao.proximos_passos?.length > 0 && (
                    <>
                      <p className="bwa-scope-block-title">Próximos passos</p>
                      <ol className="bwa-scope-list">
                        {recomendacao.proximos_passos.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ol>
                    </>
                  )}

                  <div className="bwa-scope-actions">
                    <a className="bwa-button" href="/diagnostico" data-cta="escopo-diagnostico">
                      Solicitar orçamento
                    </a>
                    <a
                      className="bwa-button bwa-button-ghost"
                      href={whatsappHref("Olá! Gerei uma recomendação de escopo no site e quero falar sobre meu apartamento.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cta="escopo-whatsapp"
                    >
                      Falar no WhatsApp
                    </a>
                  </div>
                </article>
              )}
            </div>
          </div>
        </section>
      </main>

      <BwaFooter />
    </div>
  );
}
