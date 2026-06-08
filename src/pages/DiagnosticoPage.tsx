/**
 * DiagnosticoPage — /diagnostico
 * Formulário de qualificação de lead com roteamento por estágio do imóvel.
 */
import { useState } from "react";
import { useSeo } from "../lib/useSeo";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import FloatingWhatsAppButton from "../components/landing/FloatingWhatsAppButton";
import { whatsappHref } from "../components/landing/content";
import { ArrowRight, CheckCircle } from "lucide-react";

type Estagio = "cru" | "reformando" | "pronto" | "ja-alugando" | "nao-sei" | "";
type Objetivo = "preparar" | "operar" | "jornada-completa" | "entender-potencial" | "";
type Timing = "agora" | "30-dias" | "60-90-dias" | "sem-prazo" | "";

interface FormData {
  nome: string;
  whatsapp: string;
  temImovel: string;
  estagio: Estagio;
  bairro: string;
  tipo: string;
  objetivo: Objetivo;
  timing: Timing;
}

const INITIAL: FormData = {
  nome: "",
  whatsapp: "",
  temImovel: "",
  estagio: "",
  bairro: "",
  tipo: "",
  objetivo: "",
  timing: "",
};

// Roteamento de mensagem WhatsApp por estágio
function buildWhatsappMessage(data: FormData): string {
  const estagioMap: Record<Estagio, string> = {
    cru: "cru ou recém-entregue pela construtora",
    reformando: "em reforma",
    pronto: "pronto mas ainda não alugando",
    "ja-alugando": "já alugando por temporada",
    "nao-sei": "em estágio que preciso avaliar",
    "": "",
  };
  const objMap: Record<Objetivo, string> = {
    preparar: "preparar o imóvel com Be Wild",
    operar: "colocar para operar com BeWild Host Care",
    "jornada-completa": "fazer a jornada completa (Be Wild Reformas + BeWild Host Care)",
    "entender-potencial": "entender o potencial do imóvel para short stay",
    "": "",
  };

  return `Olá! Me chamo ${data.nome || "..."} e quero um diagnóstico Bwild para meu imóvel.

Situação:
• Imóvel: ${data.tipo || "—"} em ${data.bairro || "—"}
• Estágio atual: ${estagioMap[data.estagio] || "—"}
• Objetivo: ${objMap[data.objetivo] || "—"}
• Quando quer começar: ${data.timing || "—"}

Aguardo orientação sobre o melhor caminho: Be Wild Reformas, BeWild Host Care ou jornada completa.`;
}

export default function DiagnosticoPage() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [enviado, setEnviado] = useState(false);

  useSeo({
    title: "Diagnóstico Bwild — Avalie seu imóvel para short stay",
    description:
      "Conte em que estágio está seu imóvel. A Bwild indica o caminho certo: preparar com Be Wild, operar com BeWild Host Care ou fazer a jornada completa.",
    canonicalPath: "/diagnostico",
    ogType: "website",
  });

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSubmit =
    form.nome.trim() &&
    form.whatsapp.trim() &&
    form.estagio &&
    form.objetivo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const msg = buildWhatsappMessage(form);
    window.open(whatsappHref(msg), "_blank", "noopener,noreferrer");
    setEnviado(true);
  };

  return (
    <div className="bewild min-h-screen bg-bewild-ink font-body text-bewild-ink antialiased">
      <Header />
      <main>
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
          <div className="absolute inset-0 bg-gradient-to-br from-bewild-blue/10 via-transparent to-transparent" />
          <div className="relative mx-auto w-full max-w-wrap px-5 sm:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 lg:items-start">
              {/* Texto lateral */}
              <div className="max-w-lg">
                <p className="mb-4 font-mono text-xs uppercase tracking-widest text-bewild-blue-400">
                  Diagnóstico Bwild do Ativo
                </p>
                <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
                  Descubra qual caminho faz sentido para o seu imóvel.
                </h1>
                <p className="mb-8 text-lg text-white/65 leading-relaxed">
                  Não sabe se precisa reformar, ajustar ou colocar para operar? Conte o estágio
                  do seu imóvel. A Bwild te orienta: Be Wild Reformas, BeWild Host Care ou jornada completa.
                </p>

                <div className="space-y-4">
                  {[
                    { label: "Be Wild", desc: "Imóvel cru, vazio, recém-entregue ou mal aproveitado. Precisa de projeto, obra e setup para operar." },
                    { label: "BeWild Host Care", desc: "Imóvel pronto ou quase pronto. Precisa de gestão profissional: anúncio, hóspedes, limpeza e repasse." },
                    { label: "Jornada completa", desc: "Imóvel que precisa de preparação E operação. A Bwild cuida do ciclo inteiro." },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-bewild-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-white text-sm">{item.label}</p>
                        <p className="text-sm text-white/55 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulário */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                {enviado ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-bewild-blue-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-3">Diagnóstico enviado!</h2>
                    <p className="text-white/65 text-sm leading-relaxed">
                      Você será redirecionado para o WhatsApp com suas informações preenchidas.
                      Nossa equipe entrará em contato para orientar o próximo passo.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-white/80">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={form.nome}
                        onChange={(e) => update("nome", e.target.value)}
                        placeholder="Seu nome"
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-bewild-blue/60 focus:ring-1 focus:ring-bewild-blue/30 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-white/80">
                        WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={form.whatsapp}
                        onChange={(e) => update("whatsapp", e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-bewild-blue/60 focus:ring-1 focus:ring-bewild-blue/30 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-white/80">
                        Você já tem o imóvel?
                      </label>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {[
                          { val: "sim", label: "Sim, tenho" },
                          { val: "comprando", label: "Estou comprando" },
                          { val: "pesquisando", label: "Ainda pesquisando" },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => update("temImovel", opt.val)}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                              form.temImovel === opt.val
                                ? "border-bewild-blue bg-bewild-blue/20 text-white"
                                : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-white/80">
                        Estágio do imóvel *
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          { val: "cru", label: "Cru / recém-entregue" },
                          { val: "reformando", label: "Em reforma" },
                          { val: "pronto", label: "Pronto, mas não opera" },
                          { val: "ja-alugando", label: "Já alugo por temporada" },
                          { val: "nao-sei", label: "Não sei avaliar" },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => update("estagio", opt.val as Estagio)}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition-all ${
                              form.estagio === opt.val
                                ? "border-bewild-blue bg-bewild-blue/20 text-white"
                                : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-white/80">
                          Bairro / região
                        </label>
                        <input
                          type="text"
                          value={form.bairro}
                          onChange={(e) => update("bairro", e.target.value)}
                          placeholder="Ex: Pinheiros, SP"
                          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-bewild-blue/60 focus:ring-1 focus:ring-bewild-blue/30 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-white/80">
                          Tipo do imóvel
                        </label>
                        <select
                          value={form.tipo}
                          onChange={(e) => update("tipo", e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-bewild-ink px-4 py-3 text-sm text-white/80 outline-none focus:border-bewild-blue/60 focus:ring-1 focus:ring-bewild-blue/30 transition-colors"
                        >
                          <option value="">Selecione</option>
                          <option value="Studio">Studio</option>
                          <option value="Apartamento 1 dorm">Apartamento 1 dorm</option>
                          <option value="Apartamento 2 dorm">Apartamento 2 dorm</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-white/80">
                        Objetivo *
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          { val: "preparar", label: "Preparar meu imóvel" },
                          { val: "operar", label: "Colocar para operar" },
                          { val: "jornada-completa", label: "Jornada completa" },
                          { val: "entender-potencial", label: "Entender o potencial" },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => update("objetivo", opt.val as Objetivo)}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left transition-all ${
                              form.objetivo === opt.val
                                ? "border-bewild-blue bg-bewild-blue/20 text-white"
                                : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-white/80">
                        Quando quer começar?
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          { val: "agora", label: "Agora" },
                          { val: "30-dias", label: "Em 30 dias" },
                          { val: "60-90-dias", label: "Em 60–90 dias" },
                          { val: "sem-prazo", label: "Sem prazo definido" },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => update("timing", opt.val as Timing)}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                              form.timing === opt.val
                                ? "border-bewild-blue bg-bewild-blue/20 text-white"
                                : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-bewild-blue px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
                      Receber diagnóstico Bwild <ArrowRight className="h-4 w-4" />
                    </button>

                    <p className="text-center text-xs text-white/35">
                      Você será direcionado ao WhatsApp com suas informações. Não enviamos spam.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
