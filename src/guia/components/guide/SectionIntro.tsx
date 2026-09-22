import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface SectionIntroProps {
  icon: LucideIcon;
  text: string;
}

export default function SectionIntro({ icon: Icon, text }: SectionIntroProps) {
  return (
    <motion.div
      className="py-6 text-center"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
    >
      <Icon size={32} className="mx-auto mb-2 text-primary/20" />
      <p className="text-sm text-muted-foreground font-body">{text}</p>
    </motion.div>
  );
}
