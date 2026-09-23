import { motion } from "framer-motion";
import { Button } from "@/guia/components/ui/button";
import { Calculator, MapPin, Sparkles, BookOpen, BarChart3, Target, Lightbulb } from "lucide-react";
import sectionHeroStudio from "@/guia/assets/section-hero-studio.jpg";

export default function HeroSection() {
  const benefits = [
    {
      icon: BarChart3,
      text: "Testar cenários de rentabilidade (receita, ocupação e custos) e entender sensibilidades",
    },
    {
      icon: Target,
      text: "Identificar os fatores que mais influenciam performance (localização, produto e operação)",
    },
    {
      icon: Lightbulb,
      text: "Tomar decisões com menos achismo usando ferramentas que destacam os melhores insights do mercado",
    },
  ];

  return (
    <section id="hero" className="scroll-mt-24 pt-8 pb-16 md:pt-0 md:pb-24">
      {/* Split layout: text left, image right */}
      <div className="flex flex-col lg:flex-row lg:items-stretch lg:gap-0">
        {/* Mobile image on top */}
        <div className="lg:hidden relative w-full h-56 -mx-5 mb-8" style={{ width: "calc(100% + 2.5rem)" }}>
          <img
            src={sectionHeroStudio}
            alt="Studio moderno para short stay em São Paulo"
            className="w-full h-full object-cover object-[center_30%]"
            loading="eager"
            fetchPriority="high"
            width={800}
            height={224}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>

        {/* LEFT — Text content (55%) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="lg:w-[55%] flex flex-col justify-center text-left lg:pr-10 lg:py-16"
        >
          {/* Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-full px-4 py-1 text-sm font-body text-foreground">
              <Sparkles size={14} className="text-primary/60" />
              Guia Bewild 2026 · Atualizado
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground mb-4">
            Guia do Investidor em Studios para<br />
            <span className="text-gradient-hero">Short Stay</span>
          </h1>

          {/* Body copy */}
          <div className="space-y-4 mb-8">
            <p className="text-lg md:text-xl text-muted-foreground font-body">
              Este guia é um <strong className="text-foreground">"manual de decisão"</strong> para investir em studios de short stay em São Paulo.
            </p>
            <p className="text-base text-muted-foreground font-body">
              Ele foi construído a partir de anos de experiência prática da Bewild no mercado — unindo o que funciona na operação do dia a dia com coleta, limpeza e cruzamento de bases de dados do setor para transformar informação dispersa em insight acionável.
            </p>
            <p className="text-base text-muted-foreground font-body">
              Aqui, você encontra ferramentas e frameworks (simuladores, comparadores e leituras de mercado) que ajudam a responder com mais clareza: <strong className="text-foreground">onde faz sentido investir</strong>, como estruturar a conta e o que priorizar no studio e na operação para aumentar a chance de boa ocupação e diária.
            </p>
          </div>

          {/* Benefits as compact cards */}
          <p className="text-sm font-body font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            O que você consegue fazer com este guia
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {benefits.map((b) => (
              <div key={b.text} className="border border-border/50 rounded-lg p-3 flex items-start gap-2.5">
                <b.icon size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground font-body">{b.text}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
            <Button size="lg" className="bg-primary text-primary-foreground font-body w-full sm:w-auto min-h-[44px]" asChild>
              <a href="#simulador"><Calculator size={18} className="mr-2" />Simular rentabilidade</a>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-body w-full sm:w-auto min-h-[44px]">
              <a href="#mapa-bairros"><MapPin size={18} className="mr-2" />Ver mapa de bairros</a>
            </Button>
            <Button size="lg" variant="ghost" asChild className="font-body text-muted-foreground w-full sm:w-auto min-h-[44px]">
              <a href="#casestudy"><BookOpen size={18} className="mr-2" />Ver case study</a>
            </Button>
          </div>

          {/* Microcopy */}
          <p className="text-xs text-muted-foreground/60 font-body max-w-lg mb-2">
            Use as ferramentas para simular cenários. Resultados variam por unidade, prédio e execução.
          </p>
          <p className="text-xs text-muted-foreground/60 font-body">
            Produzido pela Bewild (edição 2026) — experiência prática + análise de dados aplicada ao short stay.
          </p>
        </motion.div>

        {/* RIGHT — Image (45%) desktop only */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block lg:w-[45%] relative -mr-10"
        >
          <img
            src={sectionHeroStudio}
            alt="Studio moderno para short stay em São Paulo"
            className="w-full h-full object-cover object-[center_30%] min-h-[600px]"
            loading="eager"
            fetchPriority="high"
            width={640}
            height={600}
          />
          {/* Gradient overlay on left edge */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent pointer-events-none" />

          {/* Floating social proof card */}
          <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="text-xs font-mono font-bold text-foreground">+200</p>
                <p className="text-[10px] text-muted-foreground font-body">studios</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-xs font-mono font-bold text-foreground">4,9</p>
                <p className="text-[10px] text-muted-foreground font-body">nota</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-xs font-mono font-bold text-foreground">R$ 400</p>
                <p className="text-[10px] text-muted-foreground font-body">diária média</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
