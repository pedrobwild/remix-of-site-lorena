/**
 * ImagePlaceholder — sistema de imagens da BeWild.
 * Sprint 4 — Slots de prova visual.
 *
 * Funciona em dois modos:
 *   1. Placeholder: exibe grade sutil + label de instrução para o fotógrafo
 *   2. Real: renderiza <img> com ImageReveal ao entrar na viewport
 *
 * Para substituir por foto real:
 *   Altere BEWILD_ASSETS[id].src de null para o caminho da imagem.
 *   Ex: src: "/assets/hero-studio-pinheiros.jpg"
 *
 * Prioridades (P0 = bloqueante, P1 = importante, P2 = complementar):
 *   P0 — hero, antes/depois de cada case, dashboard screenshot
 *   P1 — detalhes de obra, equipe, operação
 *   P2 — bairros, entorno, founder
 */

import { ImageReveal } from "./MotionPrimitives";
import { Camera } from "lucide-react";

/* ─── Registro central de assets ───────────────────────────── */
export interface AssetEntry {
  id: string;
  src: string | null;          // null = ainda sem foto real
  alt: string;
  priority: "P0" | "P1" | "P2";
  instrucao: string;           // instrução para o fotógrafo/cliente
  ratio: string;               // aspect-ratio CSS
}

export const BEWILD_ASSETS: Record<string, AssetEntry> = {
  /* ── Hero ─────────────────────────────────────────────── */
  "hero-studio": {
    id: "hero-studio",
    src: null,
    alt: "Studio BeWild pronto para hospedar — Pinheiros, São Paulo",
    priority: "P0",
    instrucao: "Studio entregue. Luz natural, ângulo amplo, cama + mesa + cozinha visíveis. Sem pessoa posada. 16:9 desktop / 4:5 mobile.",
    ratio: "16/9",
  },

  /* ── Cases — Pinheiros 28m² ──────────────────────────── */
  "pinheiros-antes": {
    id: "pinheiros-antes",
    src: null,
    alt: "Studio Pinheiros 28m² — estado inicial antes da BeWild",
    priority: "P0",
    instrucao: "Mesmo ângulo que a foto 'pronto'. Estado inicial: sem mobília, entregue pela construtora.",
    ratio: "4/3",
  },
  "pinheiros-pronto": {
    id: "pinheiros-pronto",
    src: null,
    alt: "Studio Pinheiros 28m² — pronto para hospedar após BeWild Reformas",
    priority: "P0",
    instrucao: "Ângulo idêntico ao 'antes'. Studio entregue, cama + cozinha + iluminação visíveis. Luz natural.",
    ratio: "4/3",
  },
  "pinheiros-operando": {
    id: "pinheiros-operando",
    src: null,
    alt: "Studio Pinheiros 28m² — em operação no BeWild Host Care",
    priority: "P1",
    instrucao: "Screenshot real do anúncio no Airbnb com dados redigidos, OU foto do extrato/dashboard redigido.",
    ratio: "4/3",
  },

  /* ── Cases — Vila Madalena 42m² ──────────────────────── */
  "vilamadalena-antes": {
    id: "vilamadalena-antes",
    src: null,
    alt: "Apartamento Vila Madalena 42m² — antes da readequação BeWild",
    priority: "P0",
    instrucao: "Mesmo ângulo da foto pronto. Estado antes: mobília antiga, sem identidade de short stay.",
    ratio: "4/3",
  },
  "vilamadalena-pronto": {
    id: "vilamadalena-pronto",
    src: null,
    alt: "Apartamento Vila Madalena 42m² — pronto para hospedar",
    priority: "P0",
    instrucao: "Ângulo idêntico ao 'antes'. Iluminação quente, composição para Airbnb.",
    ratio: "4/3",
  },
  "vilamadalena-operando": {
    id: "vilamadalena-operando",
    src: null,
    alt: "Apartamento Vila Madalena 42m² — em operação",
    priority: "P1",
    instrucao: "Screenshot de avaliação real redigida ou calendário de reservas.",
    ratio: "4/3",
  },

  /* ── Cases — Consolação 22m² ─────────────────────────── */
  "consolacao-antes": {
    id: "consolacao-antes",
    src: null,
    alt: "Studio Consolação 22m² — antes da otimização",
    priority: "P0",
    instrucao: "Foto documental do estado com mobília ruim, iluminação deficiente, anúncio parado.",
    ratio: "4/3",
  },
  "consolacao-pronto": {
    id: "consolacao-pronto",
    src: null,
    alt: "Studio Consolação 22m² — otimizado e relançado",
    priority: "P0",
    instrucao: "Mesmo ângulo. Novo arranjo, nova iluminação. Foto profissional de lançamento.",
    ratio: "4/3",
  },
  "consolacao-operando": {
    id: "consolacao-operando",
    src: null,
    alt: "Studio Consolação 22m² — novo anúncio em operação",
    priority: "P1",
    instrucao: "Screenshot do novo anúncio com dados redigidos ou calendário de reservas.",
    ratio: "4/3",
  },

  /* ── BeWild Reformas ─────────────────────────────────── */
  "bewild-detalhe-1": {
    id: "bewild-detalhe-1",
    src: null,
    alt: "Detalhe de acabamento BeWild Reformas — marcenaria e iluminação",
    priority: "P0",
    instrucao: "Close de marcenaria, iluminação embutida ou bancada. Temperatura quente, sombras preservadas. Macro.",
    ratio: "1/1",
  },
  "bewild-detalhe-2": {
    id: "bewild-detalhe-2",
    src: null,
    alt: "Detalhe de acabamento BeWild Reformas — enxoval e cama",
    priority: "P1",
    instrucao: "Cama arrumada com enxoval 200 fios. Close de textura. Temperatura quente.",
    ratio: "1/1",
  },
  "bewild-obra": {
    id: "bewild-obra",
    src: null,
    alt: "Obra BeWild — equipe em execução com método e organização",
    priority: "P1",
    instrucao: "Equipe em vistoria, medição ou montagem. Obra organizada, com proteção. Não mostrar bagunça.",
    ratio: "16/9",
  },

  /* ── BeWild Host Care ─────────────────────────────────── */
  "hostcare-studio": {
    id: "hostcare-studio",
    src: null,
    alt: "Studio em operação BeWild Host Care — Airbnb São Paulo",
    priority: "P0",
    instrucao: "Studio pronto para hóspede. Cama com enxoval, luz natural, cozinha equipada. Nenhuma pessoa.",
    ratio: "4/3",
  },
  "hostcare-limpeza": {
    id: "hostcare-limpeza",
    src: null,
    alt: "Operação de limpeza BeWild Host Care com checklist",
    priority: "P1",
    instrucao: "Profissional de limpeza com checklist, enxoval sendo trocado, ou fechadura digital. Foto documental premium.",
    ratio: "4/3",
  },
  "hostcare-relatorio": {
    id: "hostcare-relatorio",
    src: null,
    alt: "Relatório mensal BeWild Host Care — dados redigidos",
    priority: "P0",
    instrucao: "Screenshot do relatório ou PDF redigido com dados financeiros mascarados. Mostrar estrutura: receita, ocupação, repasse.",
    ratio: "16/9",
  },
};

/* ─── Componente ────────────────────────────────────────────── */
interface ImagePlaceholderProps {
  assetId: keyof typeof BEWILD_ASSETS;
  className?: string;
  showReveal?: boolean;
  revealDelay?: number;
  overlay?: boolean;        // overlay escuro sobre a imagem
  overlayStrength?: string; // tailwind opacity da camada
}

export function ImagePlaceholder({
  assetId,
  className = "",
  showReveal = true,
  revealDelay = 0,
  overlay = false,
  overlayStrength = "bg-bewild-ink/50",
}: ImagePlaceholderProps) {
  const asset = BEWILD_ASSETS[assetId];
  if (!asset) return null;

  /* ── Com imagem real ────────────────────────────────── */
  if (asset.src) {
    const img = (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={asset.src}
          alt={asset.alt}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ aspectRatio: asset.ratio }}
        />
        {overlay && (
          <div className={`absolute inset-0 ${overlayStrength}`} />
        )}
      </div>
    );
    return showReveal ? (
      <ImageReveal delay={revealDelay} className={className}>
        {img}
      </ImageReveal>
    ) : img;
  }

  /* ── Placeholder ────────────────────────────────────── */
  const priorityColor = {
    P0: "border-bewild-gold/30 bg-bewild-gold/5",
    P1: "border-white/15 bg-white/[0.03]",
    P2: "border-white/8 bg-white/[0.02]",
  }[asset.priority];

  const priorityText = {
    P0: "text-bewild-gold",
    P1: "text-white/40",
    P2: "text-white/25",
  }[asset.priority];

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center ${priorityColor} ${className}`}
      style={{ aspectRatio: asset.ratio, minHeight: "120px" }}
    >
      {/* Grid sutil de fundo */}
      <div
        className="absolute inset-0 rounded-2xl opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <Camera className={`relative h-6 w-6 mb-3 opacity-50 ${priorityText}`} />
      <span className={`relative inline-block rounded-full border px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest mb-2 ${
        asset.priority === "P0"
          ? "border-bewild-gold/40 text-bewild-gold bg-bewild-gold/10"
          : "border-white/20 text-white/35"
      }`}>
        {asset.priority} · Foto necessária
      </span>
      <p className={`relative text-[10px] leading-relaxed max-w-[180px] ${priorityText} opacity-80`}>
        {asset.instrucao}
      </p>
    </div>
  );
}

export default ImagePlaceholder;
