import { useState, type FormEvent } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Container, SectionHeading } from "./primitives";
import { OBJETIVO_OPTIONS, whatsappHref } from "./content";

const FIELD =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-bewild-blue-400 focus:bg-white/[0.07]";
const LABEL = "mb-1.5 block text-xs font-medium text-white/65";

export default function FinalCTA() {
  const [form, setForm] = useState({
    nome: "",
    whatsapp: "",
    email: "",
    local: "",
    metragem: "",
    objetivo: "",
    chaves: "",
    planta: "",
    mensagem: "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Sem backend: compõe uma mensagem de WhatsApp com os dados do formulário.
  // 👉 Para integrar com CRM/e-mail, troque o handler por uma chamada de API.
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const lines = [
      "Olá, quero um diagnóstico para meu imóvel.",
      form.nome && `Nome: ${form.nome}`,
      form.whatsapp && `WhatsApp: ${form.whatsapp}`,
      form.email && `E-mail: ${form.email}`,
      form.local && `Localização: ${form.local}`,
      form.metragem && `Metragem: ${form.metragem} m²`,
      form.objetivo && `Objetivo: ${form.objetivo}`,
      form.chaves && `Já recebeu as chaves? ${form.chaves}`,
      form.planta && `Tem planta? ${form.planta}`,
      form.mensagem && `Mensagem: ${form.mensagem}`,
    ].filter(Boolean);
    window.open(whatsappHref(lines.join("\n")), "_blank", "noopener,noreferrer");
  }

  return (
    <section
      id="diagnostico"
      className="relative scroll-mt-20 overflow-hidden bg-bewild-night py-20 sm:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(800px 460px at 80% 0%, rgba(30,91,184,0.3), transparent 60%)",
        }}
      />
      <Container className="relative">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Diagnóstico"
              title="Quer transformar seu imóvel em um ativo pronto para operar?"
              subtitle="Envie os dados do seu studio e receba uma análise inicial de escopo, projeto e próximos passos."
              tone="light"
            />
            <p className="max-w-md text-sm leading-relaxed text-white/60">
              Sem compromisso. A análise inicial ajuda a entender escopo, prioridades e viabilidade
              antes de avançar para orçamento.
            </p>
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
            >
              <MessageCircle className="h-4 w-4" /> Prefiro falar com um especialista
            </a>
          </div>

          {/* Formulário */}
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-7"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="nome">
                  Nome
                </label>
                <input
                  id="nome"
                  className={FIELD}
                  value={form.nome}
                  onChange={(e) => set("nome")(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="whatsapp">
                  WhatsApp
                </label>
                <input
                  id="whatsapp"
                  className={FIELD}
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp")(e.target.value)}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  className={FIELD}
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  placeholder="voce@email.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="local">
                  Localização do imóvel
                </label>
                <input
                  id="local"
                  className={FIELD}
                  value={form.local}
                  onChange={(e) => set("local")(e.target.value)}
                  placeholder="Bairro, cidade"
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="metragem">
                  Metragem (m²)
                </label>
                <input
                  id="metragem"
                  className={FIELD}
                  value={form.metragem}
                  onChange={(e) => set("metragem")(e.target.value)}
                  placeholder="Ex.: 22"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="objetivo">
                  Objetivo
                </label>
                <select
                  id="objetivo"
                  className={`${FIELD} appearance-none`}
                  value={form.objetivo}
                  onChange={(e) => set("objetivo")(e.target.value)}
                >
                  <option value="" className="bg-bewild-night">
                    Selecione
                  </option>
                  {OBJETIVO_OPTIONS.map((o) => (
                    <option key={o} value={o} className="bg-bewild-night">
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="chaves">
                  Já recebeu as chaves?
                </label>
                <select
                  id="chaves"
                  className={`${FIELD} appearance-none`}
                  value={form.chaves}
                  onChange={(e) => set("chaves")(e.target.value)}
                >
                  <option value="" className="bg-bewild-night">
                    Selecione
                  </option>
                  <option value="Sim" className="bg-bewild-night">
                    Sim
                  </option>
                  <option value="Não" className="bg-bewild-night">
                    Não
                  </option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="planta">
                  Tem planta?
                </label>
                <select
                  id="planta"
                  className={`${FIELD} appearance-none`}
                  value={form.planta}
                  onChange={(e) => set("planta")(e.target.value)}
                >
                  <option value="" className="bg-bewild-night">
                    Selecione
                  </option>
                  <option value="Sim" className="bg-bewild-night">
                    Sim
                  </option>
                  <option value="Não" className="bg-bewild-night">
                    Não
                  </option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="mensagem">
                  Mensagem
                </label>
                <textarea
                  id="mensagem"
                  rows={3}
                  className={`${FIELD} resize-none`}
                  value={form.mensagem}
                  onChange={(e) => set("mensagem")(e.target.value)}
                  placeholder="Conte um pouco sobre o imóvel e o que você precisa."
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bewild-blue px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-bewild-blue-600 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bewild-blue-400"
            >
              Solicitar diagnóstico <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-center text-xs text-white/45">
              Ao enviar, abrimos uma conversa no WhatsApp com seus dados preenchidos.
            </p>
          </form>
        </div>
      </Container>
    </section>
  );
}
