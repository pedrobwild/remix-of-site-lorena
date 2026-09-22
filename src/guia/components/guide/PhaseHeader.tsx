import { motion } from "framer-motion";

interface PhaseHeaderProps {
  number: number;
  label: string;
  description: string;
}

export default function PhaseHeader({ number, label, description }: PhaseHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="py-10 md:py-14"
    >
      <div className="flex items-center gap-4 mb-2">
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground font-display text-sm font-bold shrink-0">
          {number}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <p className="text-xs font-body font-bold uppercase tracking-[0.15em] text-primary/70 mb-1">
        Fase {number} de 4
      </p>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
        {label}
      </h2>
      <p className="text-muted-foreground text-base font-body">
        {description}
      </p>
    </motion.div>
  );
}
