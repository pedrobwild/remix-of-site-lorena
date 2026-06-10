/**
 * SimuladorPage — /simulador
 * Re-skin completo (Prompt 9). Lógica de cálculo preservada.
 */
import { useEffect, useRef, useState } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { ArrowRight, Calculator, AlertTriangle } from "lucide-react";
import "../styles/simulador.css";

// ─── Dados de referência de mercado ─────────────────────────────────────────
interface BairroConfig {
  label: string;
  adr_min: number; adr_max: number;
  occ_min: number; occ_max: number;
  nota: string;
}
const BAIRROS: Record<string, BairroConfig> = {
  pinheiros: { label: "Pinheiros", adr_min: 220, adr_max: 380, occ_min: 55, occ_max: 72, nota: "Alta demanda. Perfil viajante corporativo e lazer." },
  itaim: { label: "Itaim Bibi", adr_min: 260, adr_max: 420, occ_min: 58, occ_max: 75, nota: "Demanda corporativa forte. Diária acima da média." },
  vila_olimpia: { label: "Vila Olímpia", adr_min: 240, adr_max: 400, occ_min: 55, occ_max: 72, nota: "Bairro empresarial com boa demanda de mid-week." },
  brooklin: { label: "Brooklin", adr_min: 220, adr_max: 360, occ_min: 52, occ_max: 68, nota: "Crescimento consistente. Boa relação custo-benefício." },
  vila_madalena: { label: "Vila Madalena", adr_min: 200, adr_max: 340, occ_min: 50, occ_max: 68, nota: "Perfil lazer/cultural. Sazonalidade mais pronunciada." },
  consolacao: { label: "Consolação / Bela Vista", adr_min: 180, adr_max: 300, occ_min: 48, occ_max: 65, nota: "Central. Boa tração com gestão profissional de anúncio." },
  vila_mariana: { label: "Vila Mariana", adr_min: 180, adr_max: 310, occ_min: 48, occ_max: 65, nota: "Perfil misto residencial e viajante. Custo de imóvel menor." },
  moema: { label: "Moema / Ibirapuera", adr_min: 220, adr_max: 370, occ_min: 52, occ_max: 70, nota: "Bairro nobre com demanda qualificada." },
  outro: { label: "Outro bairro de SP", adr_min: 160, adr_max: 300, occ_min: 45, occ_max: 62, nota: "Estimativa conservadora. Diagnóstico define o potencial real." },
};

interface TipoConfig { label: string; multiplicador: number; nota: string; }
const TIPOS: Record<string, TipoConfig> = {
  studio: { label: "Studio (até 35m²)", multiplicador: 1.0, nota: "Produto mais líquido para short stay em SP." },
  quarto_sala: { label: "1 dorm / quarto e sala (36–55m²)", multiplicador: 1.25, nota: "Boa relação ocupação × diária." },
  dois_quartos: { label: "2 dormitórios (56–80m²)", multiplicador: 1.55, nota: "Demanda familiar e grupos." },
  tres_quartos: { label: "3+ dormitórios (80m²+)", multiplicador: 1.9, nota: "Menor liquidez, diária mais alta." },
};

interface EstadoConfig { label: string; desc: string; fator: number; caminho: string; }
const ESTADOS_IMOVEL: Record<string, EstadoConfig> = {
  pronto: { label: "Pronto e mobiliado para short stay", desc: "Pode iniciar operação rapidamente.", fator: 1.0, caminho: "Be Wild Host Care" },
  bom_estado: { label: "Bom estado, precisaria de ajustes menores", desc: "Pequenos ajustes antes de anunciar.", fator: 0.85, caminho: "Ajustes + Host Care" },
  precisa_reforma: { label: "Precisa de reforma ou readequação", desc: "Be Wild Reformas recomendado antes de operar.", fator: 0.7, caminho: "Be Wild Reformas → Host Care" },
  cru: { label: "Imóvel cru / vazio / recém-entregue", desc: "Jornada completa: Be Wild Reformas + Be Wild Host Care.", fator: 0.55, caminho: "Jornada completa" },
};

function calcular(bairroKey: string, tipoKey: string, estadoKey: string) {
  const b = BAIRROS[bairroKey]; const t = TIPOS[tipoKey]; const e = ESTADOS_IMOVEL[estadoKey];
  if (!b || !t || !e) return null;
  const adrMin = Math.round(b.adr_min * t.multiplicador * e.fator);
  const adrMax = Math.round(b.adr_max * t.multiplicador * e.fator);
  const diasMin = 30 * (b.occ_min / 100);
  const diasMax = 30 * (b.occ_max / 100);
  const minMes = Math.round((adrMin * diasMin) / 100) * 100;
  const maxMes = Math.round((adrMax * diasMax) / 100) * 100;
  return { adrMin, adrMax, occMin: b.occ_min, occMax: b.occ_max, minMes, maxMes };
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
function fmtBRLk(v: number) {
  // 12300 → 12,3k
  const k = v / 1000;
  return `R$ ${k.toFixed(1).replace(".", ",")}k`;
}

// ─── Counter animado ─────────────────────────────────────────────────────────
function useCounter(target: number, run: boolean, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) { setVal(target); return; }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setVal(target); return; }
    let raf = 0; const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return val;
}

// ─── Reveals on scroll ───────────────────────────────────────────────────────
function useReveals(root: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const node = root.current; if (!node) return;
    const els = Array.from(node.querySelectorAll<HTMLElement>("[data-reveal], .mask"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { (e.target as HTMLElement).classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [root]);
}

// ─── Radio card group acessível ──────────────────────────────────────────────
function RadioCards({ value, onChange, options }: {
  value: string;
  onChange: (k: string) => void;
  options: { key: string; title: string; desc: string }[];
}) {
  const refs = useRef<(HTMLLabelElement | null)[]>([]);
  const onKey = (i: number) => (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault(); const n = (i + 1) % options.length;
      onChange(options[n].key); refs.current[n]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault(); const n = (i - 1 + options.length) % options.length;
      onChange(options[n].key); refs.current[n]?.focus();
    }
  };
  return (
    <div className="rcards" role="radiogroup" aria-label="Estado atual do imóvel">
      {options.map((o, i) => {
        const selected = value === o.key;
        return (
          <label
            key={o.key}
            ref={(el) => (refs.current[i] = el)}
            className={`rcard${selected ? " is-selected" : ""}`}
            tabIndex={selected || (!value && i === 0) ? 0 : -1}
            role="radio"
            aria-checked={selected}
            onKeyDown={onKey(i)}
            style={{ position: "relative" }}
          >
            <input
              type="radio" name="estado" value={o.key}
              checked={selected} onChange={() => onChange(o.key)}
            />
            <span className="dot" aria-hidden="true" />
            <span>
              <span className="rc-title">{o.title}</span>
              <span className="rc-desc">{o.desc}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function SimuladorPage() {
  useSeo({
    title: "Simulador de potencial short stay SP — Be Wild",
    description:
      "Estime o potencial de renda do seu imóvel para short stay em São Paulo. Estimativas de referência baseadas em dados de mercado — sem promessa de rentabilidade.",
    canonicalPath: "/simulador",
    ogType: "website",
  });

  const rootRef = useRef<HTMLDivElement>(null);
  useReveals(rootRef);

  const [bairro, setBairro] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [calculado, setCalculado] = useState(false);

  const podeCalcular = !!(bairro && tipo && estado);
  const resultado = calculado ? calcular(bairro, tipo, estado) : null;

  // Counters
  const adrMinC = useCounter(resultado?.adrMin ?? 0, !!resultado);
  const adrMaxC = useCounter(resultado?.adrMax ?? 0, !!resultado);
  const occMinC = useCounter(resultado?.occMin ?? 0, !!resultado);
  const occMaxC = useCounter(resultado?.occMax ?? 0, !!resultado);
  const minMesC = useCounter(resultado?.minMes ?? 0, !!resultado);
  const maxMesC = useCounter(resultado?.maxMes ?? 0, !!resultado);

  const onCalcular = () => { if (podeCalcular) setCalculado(true); };
  const onReset = () => { setBairro(""); setTipo(""); setEstado(""); setCalculado(false); };

  const caminho = estado ? ESTADOS_IMOVEL[estado].caminho : "Be Wild Host Care";

  return (
    <div className="bewild-simulador min-h-screen" ref={rootRef}>
      <Header forceSolid />
      <main>
        {/* HERO */}
        <section className="hero">
          <div className="container">
            <p className="eyebrow" data-reveal>Simulador de potencial · São Paulo</p>
            <h1>
              <span className="mask" data-delay="1"><span>Quanto pode render seu</span></span>
              <span className="mask it" data-delay="1"><span>imóvel no short stay?</span></span>
            </h1>
            <p className="lead" data-reveal data-delay="2">
              Uma estimativa de referência baseada em dados reais de mercado para São Paulo.
              Preencha os campos abaixo e veja a faixa de potencial para o seu imóvel.
            </p>
            <div className="alert" data-reveal data-delay="3">
              <AlertTriangle className="alert__icon" strokeWidth={1.4} />
              <p>
                Estimativas de referência. Resultados reais dependem de sazonalidade,
                qualidade do anúncio, precificação, concorrência e gestão.
                Não constituem garantia ou promessa de rentabilidade.
              </p>
            </div>
          </div>
        </section>

        {/* CALCULADORA */}
        <section className="calc">
          <div className="container">
            <div className="calc__grid">
              {/* FORM */}
              <div className="card" data-reveal>
                <p className="card__title">
                  <Calculator strokeWidth={1.4} />
                  Dados do imóvel
                </p>

                <div className="field">
                  <label htmlFor="sim-bairro">Bairro / região</label>
                  <select
                    id="sim-bairro" className="select"
                    value={bairro}
                    onChange={(e) => { setBairro(e.target.value); setCalculado(false); }}
                  >
                    <option value="">Ex: Pinheiros, SP</option>
                    {Object.entries(BAIRROS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="sim-tipo">Tipo / metragem</label>
                  <select
                    id="sim-tipo" className="select"
                    value={tipo}
                    onChange={(e) => { setTipo(e.target.value); setCalculado(false); }}
                  >
                    <option value="">Selecione o tipo</option>
                    {Object.entries(TIPOS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Estado atual do imóvel</label>
                  <RadioCards
                    value={estado}
                    onChange={(k) => { setEstado(k); setCalculado(false); }}
                    options={Object.entries(ESTADOS_IMOVEL).map(([key, v]) => ({
                      key, title: v.label, desc: v.desc,
                    }))}
                  />
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={!podeCalcular}
                  aria-disabled={!podeCalcular}
                  onClick={onCalcular}
                >
                  ↗ Estimar potencial
                </button>
              </div>

              {/* RESULTADO */}
              <div>
                {!resultado ? (
                  <div className="empty" data-reveal data-delay="1" key="empty">
                    <Calculator strokeWidth={1.2} />
                    <p>
                      Preencha os campos ao lado para ver a estimativa de potencial do seu imóvel
                      para short stay em São Paulo.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="panel" key="panel">
                      <div className="panel__bar">
                        <span className="dot3" /><span className="dot3" /><span className="dot3" />
                        <span className="label">Estimativa de potencial · São Paulo</span>
                      </div>
                      <div className="kpis">
                        <div className="kpi">
                          <div className="kpi__label">Diária de referência</div>
                          <div className="kpi__value">
                            {fmtBRL(adrMinC)}–{fmtBRL(adrMaxC)}
                          </div>
                        </div>
                        <div className="kpi">
                          <div className="kpi__label">Ocupação de referência</div>
                          <div className="kpi__value">{occMinC}–{occMaxC}%</div>
                        </div>
                        <div className="kpi">
                          <div className="kpi__label">Receita bruta/mês</div>
                          <div className="kpi__value">
                            {fmtBRLk(minMesC)}–{fmtBRLk(maxMesC)}
                          </div>
                        </div>
                      </div>
                      <div className="panel__path">
                        <div className="label">Caminho indicado</div>
                        <div className="value">{caminho}</div>
                      </div>
                      <div className="panel__foot">
                        Estimativa de referência · Não constitui garantia ou promessa de rentabilidade
                      </div>
                    </div>

                    <button className="result-cta" onClick={() => navigate("/diagnostico")}>
                      Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
                    </button>
                    <div>
                      <button className="reset" onClick={onReset}>← Fazer nova simulação</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FATORES */}
        <section className="fatores">
          <div className="container">
            <div className="fatores__head">
              <p className="eyebrow" data-reveal>O que move o resultado</p>
              <h2 data-reveal data-delay="1">
                O potencial é o ponto de partida.{" "}
                <span className="it">A operação é o que chega lá.</span>
              </h2>
            </div>
            <div className="fatores__grid">
              {[
                { nivel: "Alto", titulo: "Qualidade do anúncio", desc: "Foto profissional, título otimizado e descrição completa impactam diretamente a taxa de conversão." },
                { nivel: "Alto", titulo: "Precificação dinâmica", desc: "Preço fixo deixa receita na mesa. Ajuste por demanda, sazonalidade e eventos maximiza o resultado." },
                { nivel: "Médio-alto", titulo: "Preparação do imóvel", desc: "Imóvel sem mobília adequada, fotos ruins ou problemas de manutenção reduzem ocupação e diária." },
                { nivel: "Médio", titulo: "Gestão de avaliações", desc: "Imóveis com média alta nas plataformas têm prioridade no algoritmo e convertem mais." },
              ].map((f, i) => (
                <article key={f.titulo} className="fcard" data-reveal data-delay={(i + 1).toString()}>
                  <span className="pill">{f.nivel}</span>
                  <h3 className="title">{f.titulo}</h3>
                  <p className="desc">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="final">
          <div className="container">
            <h2 data-reveal>
              A estimativa é <span className="it">só o começo.</span>
            </h2>
            <p data-reveal data-delay="1">
              O diagnóstico da Be Wild avalia bairro, imóvel, estágio e objetivo, e indica qual
              caminho faz sentido para transformar potencial em resultado real.
            </p>
            <button
              className="btn-primary"
              style={{ width: "auto", display: "inline-flex" }}
              onClick={() => navigate("/diagnostico")}
              data-reveal data-delay="2"
            >
              Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
