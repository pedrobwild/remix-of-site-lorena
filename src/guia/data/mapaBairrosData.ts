import {
  MapPin, Train, Calendar, Briefcase, Stethoscope, Zap, Music, Trophy, Theater, Ticket,
  Utensils, Wifi, Palette, ShoppingBag, Star, Building2, Plane, Trees, GraduationCap, Heart,
  Camera,
} from "lucide-react";
import { BAIRROS, diariaMediaDe, receitaMensalDe, type Bairro, type BairroPerfil } from "@/guia/data/bairros";
import { validarBaseDoMapa, type FiltroDemanda } from "@/guia/lib/mapa";
import { fmtInt } from "@/guia/lib/format";

/* ─── POI Categories ─── */
export const POI_CATEGORIES = [
  { key: "restaurant", label: "Restaurantes", icon: Utensils, color: "#f97316" },
  { key: "corporate", label: "Corporativo", icon: Briefcase, color: "#3b82f6" },
  { key: "tourist", label: "Pontos turísticos", icon: Camera, color: "#a855f7" },
  { key: "events", label: "Eventos / Shows", icon: Music, color: "#ef4444" },
  { key: "metro", label: "Metrô", icon: Train, color: "#10b981" },
] as const;

export type POICategoryKey = typeof POI_CATEGORIES[number]["key"];

/* ─── Types ─── */
export interface NeighborhoodMetrics {
  /** Diária média (R$/noite) — a mesma da tabela e do simulador. */
  nightlyRate: number;
  nightlyRateRange: [number, number];
  occupancy: number;
  /** Estimativa ilustrativa: exibir sempre com ROI_AVISO. */
  estimatedROI: number;
  competitionLevel: "alta" | "média" | "baixa";
  activeListings: number;
  /** Derivada: diária média × 30 × ocupação (nunca armazenada à parte). */
  avgRevenueMo: number;
}

export interface Neighborhood {
  id: string;
  name: string;
  tags: string[];
  demandProfile: string;
  score: number;
  centerLat: number;
  centerLng: number;
  metrics: NeighborhoodMetrics;
}

export interface CityEvent {
  id: number;
  name: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  impactLevel: "high" | "medium" | "low";
  nearbyNeighborhoods: string[];
}

/* ─── Base única → formato do mapa ─── */

const COMPETITION_MAP = { Alta: "alta", Média: "média", Baixa: "baixa" } as const;

const CHIP_TO_DEMAND: Record<string, string> = {
  "Misto": "mixed",
  "Corporativo": "business",
  "Turismo": "tourism",
  "Turismo Premium": "premium tourism",
  "Eventos": "events",
  "Hospitais": "medical",
  "Universidades": "medical",
  "Próximo ao metrô": "metro",
};

function toNeighborhood(b: Bairro & { perfil: BairroPerfil }): Neighborhood {
  const { mercado, perfil } = b;
  const demandChip = perfil.chips.find((c) => c !== "Próximo ao metrô") ?? "Misto";
  return {
    id: b.id,
    name: b.nome,
    tags: perfil.chips.map((c) => c.toLowerCase()),
    demandProfile: CHIP_TO_DEMAND[demandChip] ?? "mixed",
    score: perfil.score,
    centerLat: b.centro.lat,
    centerLng: b.centro.lng,
    metrics: {
      nightlyRate: diariaMediaDe(mercado),
      nightlyRateRange: [mercado.diariaMin, mercado.diariaMax],
      occupancy: mercado.ocupacao,
      estimatedROI: perfil.roiEstimado,
      competitionLevel: COMPETITION_MAP[perfil.concorrencia],
      activeListings: perfil.anunciosAtivos,
      avgRevenueMo: receitaMensalDe(mercado),
    },
  };
}

if (import.meta.env.DEV) {
  const problemas = validarBaseDoMapa();
  if (problemas.length > 0) {
    throw new Error(`[mapa de bairros] base inconsistente:\n- ${problemas.join("\n- ")}`);
  }
}

/**
 * Bairros com perfil de mapa (score, chips, ROI): viram pino, card e linha do
 * ranking. Ordem: maior score primeiro (ordem dos cards e da comparação inicial).
 */
export const NEIGHBORHOODS: Neighborhood[] = BAIRROS.filter(
  (b): b is Bairro & { perfil: BairroPerfil } => b.perfil !== null,
)
  .map(toNeighborhood)
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "pt-BR"));

/**
 * Calendário de eventos. A lista é fixa; o mapa só exibe os que ainda não
 * terminaram (`eventosFuturos`), então não é preciso apagar os que passaram.
 */
export const EVENTS: CityEvent[] = [
  { id: 1, name: "São Paulo Fashion Week", category: "Culture", location: "Bienal do Ibirapuera", startDate: "2026-04-14", endDate: "2026-04-19", impactLevel: "high", nearbyNeighborhoods: ["Moema", "Vila Mariana", "Jardim Paulista"] },
  { id: 2, name: "Web Summit Rio → SP Side Events", category: "Business", location: "Vários locais", startDate: "2026-05-05", endDate: "2026-05-08", impactLevel: "high", nearbyNeighborhoods: ["Pinheiros", "Itaim Bibi", "Campo Belo"] },
  { id: 3, name: "Lollapalooza Brasil", category: "Music", location: "Autódromo de Interlagos", startDate: "2026-03-27", endDate: "2026-03-29", impactLevel: "high", nearbyNeighborhoods: ["Moema", "Campo Belo", "Itaim Bibi"] },
  { id: 4, name: "APAS Show", category: "Expo", location: "Expo Center Norte", startDate: "2026-05-11", endDate: "2026-05-14", impactLevel: "medium", nearbyNeighborhoods: ["Barra Funda", "Santana"] },
  { id: 5, name: "Festival de Teatro de São Paulo", category: "Culture", location: "Vários teatros", startDate: "2026-08-10", endDate: "2026-08-24", impactLevel: "medium", nearbyNeighborhoods: ["Bela Vista", "Consolação", "República"] },
  { id: 6, name: "HOSPITALAR", category: "Expo", location: "São Paulo Expo", startDate: "2026-05-19", endDate: "2026-05-22", impactLevel: "medium", nearbyNeighborhoods: ["Vila Mariana", "Moema"] },
  { id: 7, name: "GP Brasil de F1", category: "Sports", location: "Autódromo de Interlagos", startDate: "2026-11-06", endDate: "2026-11-08", impactLevel: "high", nearbyNeighborhoods: ["Moema", "Campo Belo", "Itaim Bibi"] },
  { id: 8, name: "Virada Cultural", category: "Culture", location: "Centro Histórico", startDate: "2026-06-20", endDate: "2026-06-21", impactLevel: "medium", nearbyNeighborhoods: ["Bela Vista", "Consolação", "República"] },
  { id: 9, name: "Fecomercio SP", category: "Business", location: "FIESP", startDate: "2026-09-15", endDate: "2026-09-18", impactLevel: "low", nearbyNeighborhoods: ["Consolação", "Jardim Paulista", "Itaim Bibi"] },
  { id: 10, name: "Comic Con Experience (CCXP)", category: "Culture", location: "São Paulo Expo", startDate: "2026-12-03", endDate: "2026-12-06", impactLevel: "high", nearbyNeighborhoods: ["Vila Mariana", "Moema", "Campo Belo"] },
];

export const DEMAND_FILTERS: ReadonlyArray<{ key: FiltroDemanda; label: string; icon: typeof MapPin }> = [
  { key: "tourism", label: "Turismo", icon: MapPin },
  { key: "business", label: "Corporativo", icon: Briefcase },
  { key: "events", label: "Eventos", icon: Calendar },
  { key: "medical", label: "Hospitais", icon: Stethoscope },
  { key: "mixed", label: "Misto", icon: Zap },
  { key: "metro", label: "Próximo ao metrô", icon: Train },
];

export const EVENT_ICONS: Record<string, typeof Music> = {
  Music, Sports: Trophy, Culture: Theater, Business: Briefcase, Expo: Ticket,
};

export const IMPACT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-destructive/10", text: "text-destructive", label: "Alta demanda" },
  medium: { bg: "bg-amber-100", text: "text-amber-700", label: "Média demanda" },
  low: { bg: "bg-muted", text: "text-muted-foreground", label: "Baixa demanda" },
};

export const TAG_ICONS: Record<string, typeof MapPin> = {
  misto: Zap, corporativo: Briefcase, turismo: MapPin, "turismo premium": Star,
  eventos: Calendar, hospitais: Stethoscope, universidades: GraduationCap,
  "próximo ao metrô": Train, gastronomia: Utensils, "vida noturna": Music,
  coworking: Wifi, arte: Palette, bares: Music, luxo: Star, compras: ShoppingBag,
  restaurantes: Utensils, negocios: Briefcase, tech: Zap, cultura: Theater,
  museus: Theater, teatro: Theater, residencial: Building2, aeroporto: Plane,
  parque: Trees, saude: Heart, expo: Ticket, transporte: Train,
  "business district": Building2,
};

export const INVESTOR_INSIGHTS = [
  { icon: Train, text: "Studios próximos ao metrô tendem a ter +10% ocupação média." },
  { icon: Utensils, text: "Áreas com alta densidade de restaurantes aumentam diária média em até 15%." },
  { icon: Briefcase, text: "Eventos corporativos aumentam demanda em bairros business em até 25%." },
];

export const DEMAND_PROFILE_LABELS: Record<string, { label: string; emoji: string }> = {
  "mixed": { label: "Misto", emoji: "⚡" },
  "tourism": { label: "Turismo", emoji: "🎭" },
  "premium tourism": { label: "Turismo Premium", emoji: "✨" },
  "business": { label: "Corporativo", emoji: "💼" },
  "medical": { label: "Hospitalar", emoji: "🏥" },
  "events": { label: "Eventos", emoji: "🎪" },
};

/** Inteiro pt-BR (mantido com este nome pelos componentes do mapa). */
export const fmt = fmtInt;

export function scoreColor(score: number) {
  if (score >= 88) return "bg-emerald-500";
  if (score >= 84) return "bg-amber-500";
  return "bg-muted-foreground/40";
}
