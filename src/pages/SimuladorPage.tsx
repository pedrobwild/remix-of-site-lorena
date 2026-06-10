/**
 * SimuladorPage — /simulador
 * Estimativa responsável de potencial de renda para short stay em SP.
 *
 * IMPORTANTE — Disclaimers éticos:
 * - Valores são estimativas de referência baseadas em dados de mercado públicos.
 * - Não representam garantia, projeção ou promessa de rentabilidade.
 * - Resultados reais dependem de sazonalidade, qualidade do anúncio,
 *   precificação, concorrência e gestão profissional.
 * - Fonte de referência: dados de mercado de short stay em São Paulo (2025/2026).
 */
import { useState } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import { MobileBottomCTA } from "../components/landing/MobileBottomCTA";
import { StickyDiagnosticPanel } from "../components/landing/StickyDiagnosticPanel";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { navigate } from "../lib/useHashRoute";
import { whatsappHref } from "../components/landing/content";
import {
  ArrowRight,
  Calculator,
  Info,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

// ─── Dados de referência de mercado ─────────────────────────────────────────
// Baseados em dados públicos de plataformas e relatórios de mercado (SP, 2025/2026).
// Não constituem garantia de rentabilidade.

interface BairroConfig {
  label: string;
  adr_min: number; // Diária mínima estimada (R$)
  adr_max: number; // Diária máxima estimada (R$)
  occ_min: number; // Ocupação mínima estimada (%)
  occ_max: number; // Ocupação máxima estimada (%)
  nota: string;
}

const BAIRROS: Record<string, BairroConfig> = {
  pinheiros: {
    label: "Pinheiros",
    adr_min: 220, adr_max: 380,
    occ_min: 55, occ_max: 72,
    nota: "Alta demanda. Perfil viajante corporativo e lazer.",
  },
  itaim: {
    label: "Itaim Bibi",
    adr_min: 260, adr_max: 420,
    occ_min: 58, occ_max: 75,
    nota: "Demanda corporativa forte. Diária acima da média.",
  },
  vila_olimpia: {
    label: "Vila Olímpia",
    adr_min: 240, adr_max: 400,
    occ_min: 55, occ_max: 72,
    nota: "Bairro empresarial com boa demanda de mid-week.",
  },
  brooklin: {
    label: "Brooklin",
    adr_min: 220, adr_max: 360,
    occ_min: 52, occ_max: 68,
    nota: "Crescimento consistente. Boa relação custo-benefício.",
  },
  vila_madalena: {
    label: "Vila Madalena",
    adr_min: 200, adr_max: 340,
    occ_min: 50, occ_max: 68,
    nota: "Perfil lazer/cultural. Sazonalidade mais pronunciada.",
  },
  consolacao: {
    label: "Consolação / Bela Vista",
    adr_min: 180, adr_max: 300,
    occ_min: 48, occ_max: 65,
    nota: "Central. Boa tração com gestão profissional de anúncio.",
  },
  vila_mariana: {
    label: "Vila Mariana",
    adr_min: 180, adr_max: 310,
    occ_min: 48, occ_max: 65,
    nota: "Perfil misto residencial e viajante. Custo de imóvel menor.",
  },
  moema: {
    label: "Moema / Ibirapuera",
    adr_min: 220, adr_max: 370,
    occ_min: 52, occ_max: 70,
    nota: "Bairro nobre com demanda qualificada.",
  },
  outro: {
    label: "Outro bairro de SP",
    adr_min: 160, adr_max: 300,
    occ_min: 45, occ_max: 62,
    nota: "Estimativa conservadora. Diagnóstico define o potencial real.",
  },
};

interface TipoConfig {
  label: string;
  multiplicador: number;
  nota: string;
}

const TIPOS: Record<string, TipoConfig> = {
  studio: { label: "Studio (até 35m²)", multiplicador: 1.0, nota: "Produto mais líquido para short stay em SP." },
  quarto_sala: { label: "1 dorm / quarto e sala (36–55m²)", multiplicador: 1.25, nota: "Boa relação ocupação × diária." },
  dois_quartos: { label: "2 dormitórios (56–80m²)", multiplicador: 1.55, nota: "Demanda familiar e grupos." },
  tres_quartos: { label: "3+ dormitórios (80m²+)", multiplicador: 1.9, nota: "Menor liquidez, diária mais alta." },
};

interface EstadoConfig {
  label: string;
  fator: number;
  nota: string;
}

const ESTADOS_IMOVEL: Record<string, EstadoConfig> = {
  pronto: { label: "Pronto e mobiliado para short stay", fator: 1.0, nota: "Pode iniciar operação rapidamente." },
  bom_estado: { label: "Bom estado, precisaria de ajustes menores", fator: 0.85, nota: "Pequenos ajustes antes de anunciar." },
  precisa_reforma: { label: "Precisa de reforma ou readequação", fator: 0.7, nota: "Be Wild Reformas recomendado antes de operar." },
  cru: { label: "Imóvel cru / vazio / recém-entregue", fator: 0.55, nota: "Jornada completa: Be Wild Reformas + BeWild Host Care." },
};

// ─── Calculadora ─────────────────────────────────────────────────────────────

function calcularPotencial(
  bairroKey: string,
  tipoKey: string,
  estadoKey: string
): { minMes: number; maxMes: number; minAnual: number; maxAnual: number; diasMedMin: number; diasMedMax: number } | null {
  const b = BAIRROS[bairroKey];
  const t = TIPOS[tipoKey];
  const e = ESTADOS_IMOVEL[estadoKey];
  if (!b || !t || !e) return null;

  const adrMin = b.adr_min * t.multiplicador * e.fator;
  const adrMax = b.adr_max * t.multiplicador * e.fator;
  const diasMin = 30 * (b.occ_min / 100);
  const diasMax = 30 * (b.occ_max / 100);

  const minMes = Math.round(adrMin * diasMin / 100) * 100;
  const maxMes = Math.round(adrMax * diasMax / 100) * 100;

  return {
    minMes,
    maxMes,
    minAnual: minMes * 12,
    maxAnual: maxMes * 12,
    diasMedMin: Math.round(diasMin),
    diasMedMax: Math.round(diasMax),
  };
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function SimuladorPage() {
  useSeo({
    title: "Simulador de potencial short stay SP — Be Wild",
    description:
      "Estime o potencial de renda do seu imóvel para short stay em São Paulo. Estimativas de referência baseadas em dados de mercado — sem promessa de rentabilidade.",
    canonicalPath: "/simulador",
    ogType: "website",
  });

  const [bairro, setBairro] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [calculado, setCalculado] = useState(false);

  const resultado = calculado ? calcularPotencial(bairro, tipo, estado) : null;
  const podeCalcular = bairro && tipo && estado;

  const bairroConfig = BAIRROS[bairro];
  const tipoConfig = TIPOS[tipo];

  const handleCalcular = () => {
    if (podeCalcular) setCalculado(true);
  };

  const handleReset = () => {
    setBairro("");
    setTipo("");
    setEstado("");
    setCalculado(false);
  };

  return (
    <div className="bwild-light min-h-screen bg-bewild-cream font-body text-bewild-text-body antialiased">
      <Header />
      <main>

        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
          <div className="absolute inset-0 bg-gradient-to-br from-bewild-gold/4 via-transparent to-transparent pointer-events-none" />
          <div className="relative mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                Simulador de Potencial · São Paulo
              </p>
              <h1 className="mb-5 text-4xl font-bold leading-tight text-bewild-ink sm:text-5xl">
                Quanto pode render seu imóvel no short stay?
              </h1>
              <p className="mb-5 text-lg text-bewild-text-body leading-relaxed">
                Uma estimativa de referência baseada em dados reais de mercado para São Paulo.
                Preencha os campos abaixo e veja a faixa de potencial para o seu imóvel.
              </p>
              {/* Disclaimer ético — antes da calculadora */}
              <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-50 p-4">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  Estimativas de referência. Resultados reais dependem de sazonalidade,
                  qualidade do anúncio, precificação, concorrência e gestão.
                  Não constituem garantia ou promessa de rentabilidade.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Calculadora */}
        <section className="border-t border-bewild-cream-200 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:items-start">

              {/* Formulário */}
              <div className="rounded-2xl border border-bewild-cream-200 bg-white p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-8">
                  <Calculator className="h-5 w-5 text-bewild-gold-accessible" />
                  <p className="font-semibold text-bewild-ink">Dados do imóvel</p>
                </div>

                <div className="space-y-6">
                  {/* Bairro */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-bewild-text-muted">
                      Bairro / região
                    </label>
                    <select
                      value={bairro}
                      onChange={(e) => { setBairro(e.target.value); setCalculado(false); }}
                      className="w-full rounded-xl border border-bewild-cream-200 bg-white px-4 py-3 text-sm text-bewild-text-body placeholder-bewild-text-muted focus:border-bewild-blue/50 focus:outline-none focus:ring-1 focus:ring-bewild-blue/30 transition-all"
                    >
                      <option value="" disabled className="bg-gray-900">Selecione o bairro</option>
                      {Object.entries(BAIRROS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-gray-900">{v.label}</option>
                      ))}
                    </select>
                    {bairroConfig && (
                      <p className="mt-1.5 text-xs text-bewild-text-muted flex gap-1.5 items-start">
                        <Info className="h-3 w-3 shrink-0 mt-0.5" />{bairroConfig.nota}
                      </p>
                    )}
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-bewild-text-muted">
                      Tipo / metragem
                    </label>
                    <select
                      value={tipo}
                      onChange={(e) => { setTipo(e.target.value); setCalculado(false); }}
                      className="w-full rounded-xl border border-bewild-cream-200 bg-white px-4 py-3 text-sm text-bewild-text-body placeholder-bewild-text-muted focus:border-bewild-blue/50 focus:outline-none focus:ring-1 focus:ring-bewild-blue/30 transition-all"
                    >
                      <option value="" disabled className="bg-gray-900">Selecione o tipo</option>
                      {Object.entries(TIPOS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-gray-900">{v.label}</option>
                      ))}
                    </select>
                    {tipoConfig && (
                      <p className="mt-1.5 text-xs text-bewild-text-muted flex gap-1.5 items-start">
                        <Info className="h-3 w-3 shrink-0 mt-0.5" />{tipoConfig.nota}
                      </p>
                    )}
                  </div>

                  {/* Estado atual */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-bewild-text-muted">
                      Estado atual do imóvel
                    </label>
                    <div className="space-y-2.5">
                      {Object.entries(ESTADOS_IMOVEL).map(([k, v]) => (
                        <label
                          key={k}
                          className={`flex items-start gap-3 cursor-pointer rounded-xl border p-3.5 transition-all ${
                            estado === k
                              ? "border-bewild-blue/40 bg-bewild-blue/6"
                              : "border-bewild-cream-200 bg-white hover:border-bewild-cream-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="estado"
                            value={k}
                            checked={estado === k}
                            onChange={() => { setEstado(k); setCalculado(false); }}
                            className="mt-0.5 accent-bewild-blue shrink-0"
                          />
                          <div>
                            <p className="text-sm font-medium text-bewild-text-body">{v.label}</p>
                            <p className="text-xs text-bewild-text-muted mt-0.5">{v.nota}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCalcular}
                    aria-disabled={!podeCalcular}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-bewild-blue px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Estimar potencial
                  </button>
                </div>
              </div>

              {/* Resultado */}
              <div>
                {!calculado && (
                  <div className="rounded-2xl border border-bewild-cream-200 bg-white p-8 text-center">
                    <Calculator className="h-10 w-10 text-bewild-cream-200 mx-auto mb-4" />
                    <p className="text-bewild-text-muted text-sm leading-relaxed">
                      Preencha os campos ao lado para ver a estimativa de potencial do seu imóvel
                      para short stay em São Paulo.
                    </p>
                  </div>
                )}

                {calculado && resultado && (
                  <div className="space-y-5">
                    {/* Card principal */}
                    <div className="rounded-2xl border border-bewild-gold/30 bg-bewild-parchment p-6 sm:p-8">
                      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                        Estimativa de referência · São Paulo
                      </p>
                      <p className="mb-6 text-sm text-bewild-text-muted">
                        {bairroConfig?.label} · {tipoConfig?.label}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-[0.65rem] font-mono uppercase tracking-wider text-bewild-text-muted mb-1">
                            Potencial mensal
                          </p>
                          <p className="text-2xl font-bold text-bewild-ink">
                            {formatBRL(resultado.minMes)}
                          </p>
                          <p className="text-sm text-bewild-text-muted">até {formatBRL(resultado.maxMes)}</p>
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-mono uppercase tracking-wider text-bewild-text-muted mb-1">
                            Potencial anual
                          </p>
                          <p className="text-2xl font-bold text-bewild-ink">
                            {formatBRL(resultado.minAnual)}
                          </p>
                          <p className="text-sm text-bewild-text-muted">até {formatBRL(resultado.maxAnual)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-5 border-t border-bewild-cream-200">
                        <div>
                          <p className="text-[0.65rem] font-mono uppercase tracking-wider text-bewild-text-muted mb-1">
                            Noites/mês estimadas
                          </p>
                          <p className="text-lg font-semibold text-bewild-text-muted">
                            {resultado.diasMedMin}–{resultado.diasMedMax} noites
                          </p>
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-mono uppercase tracking-wider text-bewild-text-muted mb-1">
                            Ocupação de referência
                          </p>
                          <p className="text-lg font-semibold text-bewild-text-muted">
                            {bairroConfig?.occ_min}–{bairroConfig?.occ_max}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="flex gap-3 rounded-xl border border-bewild-cream-200 bg-white p-4">
                      <AlertTriangle className="h-4 w-4 text-amber-400/70 shrink-0 mt-0.5" />
                      <p className="text-xs text-bewild-text-muted leading-relaxed">
                        Estimativa baseada em dados de mercado de São Paulo (2025/2026).
                        Valores brutos antes de taxas das plataformas e custos operacionais.
                        Resultados reais variam conforme qualidade do anúncio, gestão, sazonalidade
                        e concorrência. Não constitui garantia ou promessa de rentabilidade.
                      </p>
                    </div>

                    {/* CTA contextual por estado */}
                    <div className="rounded-2xl border border-bewild-cream-200 bg-white p-6">
                      <p className="mb-2 font-semibold text-bewild-ink text-sm">
                        {estado === "pronto"
                          ? "Seu imóvel pode começar a operar rapidamente."
                          : estado === "bom_estado"
                          ? "Com pequenos ajustes, seu imóvel está próximo de operar."
                          : "Seu imóvel precisa de preparação antes de operar."}
                      </p>
                      <p className="mb-5 text-sm text-bewild-text-muted leading-relaxed">
                        {estado === "pronto"
                          ? "O BeWild Host Care pode assumir a gestão e colocar o imóvel no mercado. O diagnóstico define o cronograma."
                          : estado === "bom_estado"
                          ? "Um diagnóstico define quais ajustes fazem sentido antes do lançamento no Airbnb/Booking."
                          : "O Be Wild Reformas prepara o ativo para competir no short stay. A seguir, o BeWild Host Care opera."}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate("/diagnostico")}
                          className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
                        >
                          Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
                        </button>
                        <a
                          href={whatsappHref("Olá, usei o simulador da Be Wild e quero entender melhor o potencial do meu imóvel.")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-bewild-cream-200 px-5 py-2.5 text-sm font-semibold text-bewild-ink transition-all hover:border-bewild-ink/40"
                        >
                          Falar com especialista
                        </a>
                      </div>
                    </div>

                    <button
                      onClick={handleReset}
                      className="text-xs text-bewild-text-muted hover:text-bewild-ink transition-colors"
                    >
                      ← Fazer nova simulação
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Contexto: o que impacta o resultado */}
        <section className="border-t border-bewild-cream-200 py-16 sm:py-20 bg-white">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="mb-10 max-w-2xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-bewild-gold-accessible">
                O que determina o resultado real
              </p>
              <h2 className="text-2xl font-bold text-bewild-ink sm:text-3xl">
                A estimativa é o teto. A gestão define se você chega lá.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { fator: "Qualidade do anúncio", impacto: "Alto", desc: "Foto profissional, título otimizado e descrição completa impactam diretamente a taxa de conversão." },
                { fator: "Precificação dinâmica", impacto: "Alto", desc: "Preço fixo deixa receita na mesa. Ajuste por demanda, sazonalidade e eventos maximiza o resultado." },
                { fator: "Preparação do imóvel", impacto: "Médio-alto", desc: "Imóvel sem mobília adequada, fotos ruins ou problemas de manutenção reduzem ocupação e diária." },
                { fator: "Gestão de avaliações", impacto: "Médio", desc: "Imóveis com média alta nas plataformas têm prioridade no algoritmo e convertem mais." },
              ].map((item) => (
                <div key={item.fator} className="rounded-xl border border-bewild-cream-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-bewild-ink">{item.fator}</p>
                    <span className="text-[0.6rem] font-mono uppercase tracking-wider text-bewild-gold-accessible border border-bewild-blue/20 rounded-full px-2 py-0.5">
                      {item.impacto}
                    </span>
                  </div>
                  <p className="text-xs text-bewild-text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-bewild-cream-200 py-20 sm:py-28">
          <div className="mx-auto w-full max-w-wrap px-5 sm:px-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-bewild-ink sm:text-4xl">
              A estimativa é só o começo.
            </h2>
            <p className="mb-8 text-bewild-text-muted max-w-xl mx-auto leading-relaxed">
              O diagnóstico da Be Wild avalia bairro, imóvel, estágio e objetivo — e indica
              qual caminho faz sentido para transformar potencial em resultado real.
            </p>
            <button
              onClick={() => navigate("/diagnostico")}
              className="inline-flex items-center gap-2 rounded-full bg-bewild-blue px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5"
            >
              Diagnosticar meu imóvel <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

      </main>
      <MobileBottomCTA />
      <StickyDiagnosticPanel />
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
