/**
 * MaterialBoard — grid de acabamentos e decisões de projeto.
 * Sprint 2 — Componente proprietário para /be-wild.
 *
 * Cada card mostra: nome do material, decisão comercial e ícone de categoria.
 * Uso: <MaterialBoard />
 */

import { Reveal } from "./MotionPrimitives";
import { Layers, Lightbulb, Droplets, Plug, Wind, DoorOpen } from "lucide-react";

interface Material {
  categoria: string;
  nome: string;
  decisao: string;
  porque: string;
  icon: React.ComponentType<{ className?: string }>;
  acento: string;
}

const MATERIAIS: Material[] = [
  {
    categoria: "Piso",
    nome: "Porcelanato matte 60×60",
    decisao: "Prioridade sobre acetinado",
    porque: "Não risca com mala, não mostra poeira e é mais fácil de limpar. O acetinado é bonito na loja e problemático na operação.",
    icon: Layers,
    acento: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },
  {
    categoria: "Iluminação",
    nome: "LED embutido indireta",
    decisao: "Faixa em forro no lugar de ponto central",
    porque: "Iluminação indireta e quente é o principal diferencial visual de listings com alta taxa de clique. Custo menor que spot, resultado melhor na foto.",
    icon: Lightbulb,
    acento: "text-bewild-gold bg-bewild-gold/10 border-bewild-gold/20",
  },
  {
    categoria: "Janelas",
    nome: "Persiana rolo blackout",
    decisao: "No lugar de cortina de tecido",
    porque: "Cada lavagem de cortina é 45–60 min de trabalho. Persiana técnica dura anos sem manutenção e veda melhor a luz em bairros com intensa iluminação noturna.",
    icon: DoorOpen,
    acento: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  },
  {
    categoria: "Enxoval",
    nome: "Lençol 200 fios + toalha premium",
    decisao: "Item mais citado em reviews de 5 estrelas",
    porque: "Hóspedes mencionam o enxoval com frequência. É o detalhe com maior retorno em avaliação por real investido.",
    icon: Droplets,
    acento: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  },
  {
    categoria: "Energia",
    nome: "Tomadas duplas + USB embutida",
    decisao: "2 por lado da cama + bancada + entrada",
    porque: "Hóspedes de negócios penalizam imóveis sem pontos de energia suficientes. Custo de instalação: baixo. Impacto em avaliação: alto.",
    icon: Plug,
    acento: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  {
    categoria: "Climatização",
    nome: "Split inverter A+",
    decisao: "Posicionamento estratégico no layout",
    porque: "Ar-condicionado mal posicionado gera corrente direta na cama e reclamações constantes. A posição entra no projeto — não é decisão de obra.",
    icon: Wind,
    acento: "text-bewild-blue-400 bg-bewild-blue/10 border-bewild-blue/20",
  },
];

export function MaterialBoard() {
  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-bewild-gold">
          Material board
        </p>
        <h3 className="text-xl font-bold text-white sm:text-2xl">
          Decisões de projeto com justificativa comercial.
        </h3>
        <p className="mt-3 text-sm text-white/50 max-w-xl leading-relaxed">
          Cada decisão de material tem um motivo operacional. A Be Wild não escolhe o que fica bonito — escolhe o que performa.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MATERIAIS.map((m, i) => (
          <Reveal key={m.nome} delay={i * 60} threshold={0.1}>
          <div
            key={m.nome}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition-colors"
          >
            {/* Categoria + ícone */}
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-widest ${m.acento}`}>
                {m.categoria}
              </span>
              <m.icon className={`h-4 w-4 opacity-50 ${m.acento.split(" ")[0]}`} />
            </div>

            {/* Nome */}
            <p className="text-sm font-semibold text-white leading-snug mb-1">{m.nome}</p>

            {/* Decisão */}
            <p className="text-xs text-bewild-gold/70 mb-3 font-medium">{m.decisao}</p>

            {/* Por quê */}
            <p className="text-xs text-white/65 leading-relaxed">{m.porque}</p>
          </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export default MaterialBoard;
