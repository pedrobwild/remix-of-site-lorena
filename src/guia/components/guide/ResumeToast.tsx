import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/guia/components/ui/button";
import { BookOpen, X } from "lucide-react";
import { SECTIONS } from "@/guia/data/guide-data";
import type { ReadingProgress } from "@/guia/hooks/useReadingProgress";

interface Props {
  data: ReadingProgress | null;
  onDismiss: () => void;
}

export default function ResumeToast({ data, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!data) return;
    // Small delay so it doesn't flash on load
    const t1 = setTimeout(() => setVisible(true), 800);
    const t2 = setTimeout(() => { setVisible(false); onDismiss(); }, 10800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [data, onDismiss]);

  if (!data) return null;

  const section = SECTIONS.find((s) => s.id === data.activeSection);
  const sectionName = section?.label ?? data.activeSection;

  const handleContinue = () => {
    const el = document.getElementById(data.activeSection);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setVisible(false);
    onDismiss();
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-2 lg:top-3 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3"
        >
          <BookOpen size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-semibold text-foreground mb-1">
              Bem-vindo de volta!
            </p>
            <p className="text-xs text-muted-foreground font-body">
              Você parou em <strong className="text-foreground">{sectionName}</strong>. Continuar?
            </p>
            <div className="flex gap-2 mt-2.5">
              <Button size="sm" onClick={handleContinue} className="min-h-[36px] text-xs font-body">
                Continuar
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="min-h-[36px] text-xs font-body text-muted-foreground">
                Início
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground/50 hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
