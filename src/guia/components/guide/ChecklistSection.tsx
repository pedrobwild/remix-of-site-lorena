import { useState, useCallback, useEffect, useRef, useId } from "react";
import { Card, CardContent } from "@/guia/components/ui/card";
import { Checkbox } from "@/guia/components/ui/checkbox";
import { Badge } from "@/guia/components/ui/badge";
import { Button } from "@/guia/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Share2, PartyPopper } from "lucide-react";
import { CHECKLIST_ITEMS, tierDoScore } from "@/guia/data/checklist";
import { useToast } from "@/guia/hooks/use-toast";
import { copiarTexto } from "@/guia/lib/browser";
import SectionBlock from "./SectionBlock";

function getTierColor(score: number) {
  if (score <= 3) return "bg-red-400";
  if (score <= 6) return "bg-amber-400";
  if (score <= 8) return "bg-blue-400";
  return "bg-emerald-400";
}

/** Tons 600/700: contraste suficiente para texto branco no selo. */
function getTierBadgeColor(score: number) {
  if (score <= 3) return "bg-red-600 text-white";
  if (score <= 6) return "bg-amber-700 text-white";
  if (score <= 8) return "bg-blue-600 text-white";
  return "bg-emerald-700 text-white";
}

const CONFETTI_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

// Mini confetti component
function Confetti() {
  // Sorteio só na montagem: render continua puro.
  const [particles] = useState(() =>
    CONFETTI_COLORS.map((color, id) => ({
      id,
      color,
      x: (Math.random() - 0.5) * 120,
      y: -(Math.random() * 80 + 40),
      rotate: Math.random() * 360,
    })),
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.5, rotate: p.rotate }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function ChecklistSection() {
  const uid = useId();
  const total = CHECKLIST_ITEMS.length;
  const [checked, setChecked] = useState<boolean[]>(() => new Array(total).fill(false));
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  /**
   * Define (não alterna) o estado do item. O Checkbox informa o novo valor,
   * então um evento duplicado não desfaz a marcação. O updater é puro; os
   * efeitos visuais (flash, confete) ficam nos useEffect abaixo.
   */
  const setItem = useCallback((i: number, value: boolean) => {
    setChecked((prev) => {
      if (prev[i] === value) return prev;
      const next = [...prev];
      next[i] = value;
      return next;
    });
    if (value) setFlashIndex(i);
  }, []);

  const score = checked.filter(Boolean).length;
  const tier = tierDoScore(score);
  const tierColor = getTierColor(score);
  const tierBadgeColor = getTierBadgeColor(score);

  // Flash curto no item recém-marcado.
  useEffect(() => {
    if (flashIndex === null) return;
    const t = setTimeout(() => setFlashIndex(null), 400);
    return () => clearTimeout(t);
  }, [flashIndex]);

  // Confete ao completar 100% (só na transição, não a cada render).
  const prevScoreRef = useRef(score);
  useEffect(() => {
    if (score === total && prevScoreRef.current < total) setShowConfetti(true);
    prevScoreRef.current = score;
  }, [score, total]);

  useEffect(() => {
    if (!showConfetti) return;
    const t = setTimeout(() => setShowConfetti(false), 1000);
    return () => clearTimeout(t);
  }, [showConfetti]);

  const handleShare = async () => {
    const text = `Completei ${score}/${total} no Checklist do Investidor Bewild — nível ${tier.label}! 🏗️ bewild.com.br/guia-do-investidor`;
    const ok = await copiarTexto(text);
    toast(
      ok
        ? { title: "Texto copiado!", description: "Cole onde quiser compartilhar." }
        : { title: "Não foi possível copiar", description: text, variant: "destructive" },
    );
  };

  return (
    <SectionBlock id="checklist" title="Checklist do Investidor" takeaway="Avalie sua preparação antes de investir.">
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6" aria-label="Itens do checklist">
        {CHECKLIST_ITEMS.map((item, i) => {
          const id = `${uid}-item-${i}`;
          return (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              {/* O rótulo inteiro é a área de clique: clicar no texto ou no
                  quadrado aciona o mesmo checkbox, uma única vez. */}
              <label
                htmlFor={id}
                className={`block rounded-lg border bg-card text-card-foreground shadow-sm border-border cursor-pointer transition-all duration-300 ${
                  checked[i] ? "bg-primary/5 border-primary/30" : ""
                } ${flashIndex === i ? "!bg-emerald-500/10" : ""}`}
              >
                <span className="p-4 flex items-center gap-3 min-h-[48px]">
                  <Checkbox id={id} checked={checked[i]} onCheckedChange={(v) => setItem(i, v === true)} />
                  <span className={`text-sm font-body flex-1 transition-colors duration-300 ${
                    checked[i] ? "text-emerald-700 font-medium" : "text-muted-foreground"
                  }`}>
                    {item}
                  </span>
                  <AnimatePresence>
                    {checked[i] && (
                      <motion.span
                        aria-hidden="true"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check size={16} className="text-emerald-500 flex-shrink-0" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </label>
            </motion.li>
          );
        })}
      </ul>

      <Card className="border-border relative">
        {showConfetti && <Confetti />}
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground font-body mb-2">Sua pontuação</p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-4xl font-display font-bold text-foreground" aria-live="polite">{score}</span>
            <span className="text-lg text-muted-foreground font-body">/ {total}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="ml-2 min-h-[44px] min-w-[44px]"
              aria-label="Copiar resultado para compartilhar"
            >
              <Share2 size={16} aria-hidden="true" />
            </Button>
          </div>

          {/* Tier badge with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <Badge className={`${tierBadgeColor} font-body text-base font-bold px-4 py-1.5`}>{tier.label}</Badge>
            </motion.div>
          </AnimatePresence>

          <p className="text-sm text-muted-foreground font-body mt-3 max-w-md mx-auto" aria-live="polite">{tier.desc}</p>

          {/* Segmented progress bar */}
          <div className="flex gap-0.5 mt-4" role="img" aria-label={`${score} de ${total} itens concluídos`}>
            {Array.from({ length: total }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-sm transition-all duration-500 ${
                  i < score ? tierColor : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* 100% CTA */}
          <AnimatePresence>
            {score === total && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <PartyPopper size={20} className="text-emerald-600" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground font-body">
                    Você completou o checklist! Seu projeto parece pronto para o próximo passo.
                  </p>
                </div>
                <Button size="sm" className="bg-primary text-primary-foreground font-body min-h-[44px]" asChild>
                  <a href="#cta-final">Solicitar diagnóstico gratuito</a>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </SectionBlock>
  );
}
