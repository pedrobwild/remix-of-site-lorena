/**
 * HostCareDashboard — "Control Room" visual da BeWild Host Care.
 * Sprint 2 — Componente proprietário.
 *
 * Mock fiel do painel do proprietário com tabs:
 * Visão geral / Reservas / Limpeza / Manutenção / Repasse
 *
 * Uso:
 *   <HostCareDashboard />
 */

import { useState } from "react";
import {
  BarChart3,
  Calendar,
  Sparkles,
  Wrench,
  Wallet,
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

/* ─── Tipos ─────────────────────────────── */
type Tab = "geral" | "reservas" | "limpeza" | "manutencao" | "repasse";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "geral",      label: "Visão geral",  icon: BarChart3  },
  { id: "reservas",   label: "Reservas",     icon: Calendar   },
  { id: "limpeza",    label: "Limpeza",      icon: Sparkles   },
  { id: "manutencao", label: "Manutenção",   icon: Wrench     },
  { id: "repasse",    label: "Repasse",      icon: Wallet     },
];

/* ─── Mock data ─────────────────────────── */
const RESERVAS_MOCK = [
  { hóspede: "M. Ferreira",  datas: "12–15 jun",  diaria: "R$290",  status: "confirmada",  canal: "Airbnb"  },
  { hóspede: "L. Rodrigues", datas: "16–17 jun",  diaria: "R$310",  status: "confirmada",  canal: "Booking" },
  { hóspede: "T. Almeida",   datas: "19–23 jun",  diaria: "R$275",  status: "pendente",    canal: "Airbnb"  },
  { hóspede: "F. Santos",    datas: "27–30 jun",  diaria: "R$320",  status: "confirmada",  canal: "Airbnb"  },
];

const LIMPEZAS_MOCK = [
  { data: "15 jun — 10h",  tipo: "Saída M. Ferreira",   status: "agendada"   },
  { data: "17 jun — 10h",  tipo: "Saída L. Rodrigues",  status: "agendada"   },
  { data: "08 jun — 09h",  tipo: "Vistoria mensal",      status: "concluída"  },
];

const MANUTENCAO_MOCK = [
  { item: "Fechadura digital",   acao: "Troca de bateria",        status: "concluída",  data: "03 jun" },
  { item: "Ar-condicionado",     acao: "Limpeza de filtro",        status: "agendada",   data: "20 jun" },
  { item: "Lâmpada banheiro",    acao: "Substituição LED",         status: "concluída",  data: "05 jun" },
];

/* ─── Painel: Visão Geral ───────────────── */
function TabGeral() {
  return (
    <div className="space-y-4">
      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Receita bruta jun", value: "R$4.060", sub: "+12% vs. mai", icon: TrendingUp, up: true },
          { label: "Ocupação",          value: "67%",      sub: "20 noites",   icon: BarChart3,  up: true },
          { label: "Diária média",      value: "R$299",    sub: "ADR junho",   icon: BarChart3,  up: false },
          { label: "Avaliação",         value: "4,9 ★",    sub: "23 reviews",  icon: Star,       up: true },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
            <m.icon className="h-4 w-4 text-bewild-gold mb-2 opacity-80" />
            <p className="text-lg font-bold text-white font-mono leading-none">{m.value}</p>
            <p className="text-[10px] text-white/60 mt-1 leading-tight">{m.label}</p>
            <p className={`text-[10px] mt-1 font-medium ${m.up ? "text-emerald-400" : "text-white/55"}`}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Ocupação visual — barra de junho */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs text-white/50 mb-3 font-medium">Calendário junho — ocupação</p>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 30 }, (_, i) => {
            const day = i + 1;
            const ocupado = [12,13,14,16,17,19,20,21,22,27,28,29,30].includes(day);
            const hoje = day === 8;
            return (
              <div
                key={day}
                title={`${day} jun`}
                className={`h-5 w-5 rounded-sm text-[9px] flex items-center justify-center font-mono ${
                  hoje
                    ? "bg-bewild-gold text-bewild-ink font-bold"
                    : ocupado
                    ? "bg-bewild-blue/60 text-white/80"
                    : "bg-white/5 text-white/35"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-[10px] text-white/60">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-bewild-blue/60 inline-block"/>Ocupado</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-bewild-gold inline-block"/>Hoje</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-white/5 inline-block"/>Disponível</span>
        </div>
      </div>

      {/* Próxima reserva */}
      <div className="rounded-xl border border-bewild-gold/20 bg-bewild-gold/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-bewild-gold/70 font-mono uppercase tracking-widest mb-1">Próxima reserva</p>
          <p className="text-sm font-semibold text-white">M. Ferreira · 12–15 jun · Airbnb</p>
          <p className="text-xs text-white/65 mt-0.5">4 noites · R$1.160 receita bruta</p>
        </div>
        <CheckCircle className="h-5 w-5 text-bewild-gold flex-shrink-0" />
      </div>
    </div>
  );
}

/* ─── Painel: Reservas ──────────────────── */
function TabReservas() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-white/60 font-mono uppercase tracking-widest">Junho 2026 · 4 reservas · 13 noites</p>
      {RESERVAS_MOCK.map((r) => (
        <div key={r.hóspede} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                r.canal === "Airbnb"
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : "bg-sky-500/10 border-sky-500/20 text-sky-400"
              }`}>
                {r.canal}
              </span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] border ${
                r.status === "confirmada"
                  ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                  : "bg-amber-400/10 border-amber-400/20 text-amber-400"
              }`}>
                {r.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-white">{r.hóspede}</p>
            <p className="text-xs text-white/65">{r.datas}</p>
          </div>
          <p className="text-sm font-bold text-bewild-gold font-mono flex-shrink-0">{r.diaria}<span className="text-white/50 font-normal">/noite</span></p>
        </div>
      ))}
    </div>
  );
}

/* ─── Painel: Limpeza ───────────────────── */
function TabLimpeza() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-white/60 font-mono uppercase tracking-widest">Junho 2026 · Protocolo Be Wild</p>
      {LIMPEZAS_MOCK.map((l) => (
        <div key={l.data} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-4">
          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            l.status === "concluída"
              ? "bg-emerald-400/10 text-emerald-400"
              : "bg-bewild-gold/10 text-bewild-gold"
          }`}>
            {l.status === "concluída"
              ? <CheckCircle className="h-4 w-4" />
              : <Clock className="h-4 w-4" />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{l.tipo}</p>
            <p className="text-xs text-white/65">{l.data}</p>
          </div>
          <span className={`text-[10px] font-mono rounded-full px-2 py-0.5 border ${
            l.status === "concluída"
              ? "border-emerald-400/20 text-emerald-400 bg-emerald-400/5"
              : "border-bewild-gold/20 text-bewild-gold bg-bewild-gold/5"
          }`}>
            {l.status}
          </span>
        </div>
      ))}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-xs text-white/60 leading-relaxed">
        Vistoria de condição incluída em toda limpeza de saída. Registro fotográfico enviado ao proprietário.
      </div>
    </div>
  );
}

/* ─── Painel: Manutenção ────────────────── */
function TabManutencao() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-white/60 font-mono uppercase tracking-widest">Manutenção preventiva e emergencial</p>
      {MANUTENCAO_MOCK.map((m) => (
        <div key={m.item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-4">
          <div className={`flex-shrink-0 mt-0.5 h-7 w-7 rounded-full flex items-center justify-center ${
            m.status === "concluída"
              ? "bg-emerald-400/10 text-emerald-400"
              : "bg-amber-400/10 text-amber-400"
          }`}>
            {m.status === "concluída"
              ? <CheckCircle className="h-3.5 w-3.5" />
              : <AlertCircle className="h-3.5 w-3.5" />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{m.item}</p>
            <p className="text-xs text-white/50">{m.acao}</p>
            <p className="text-[10px] text-white/60 mt-0.5">{m.data}</p>
          </div>
          <span className={`text-[10px] font-mono rounded-full px-2 py-0.5 border flex-shrink-0 ${
            m.status === "concluída"
              ? "border-emerald-400/20 text-emerald-400 bg-emerald-400/5"
              : "border-amber-400/20 text-amber-400 bg-amber-400/5"
          }`}>
            {m.status}
          </span>
        </div>
      ))}
      <p className="text-[10px] text-white/60 leading-relaxed px-1">
        Proprietário acionado apenas para aprovação de reparos acima de R$300. Abaixo disso, a BeWild Host Care resolve.
      </p>
    </div>
  );
}

/* ─── Painel: Repasse ───────────────────── */
function TabRepasse() {
  return (
    <div className="space-y-4">
      <p className="text-[10px] text-white/60 font-mono uppercase tracking-widest">Demonstrativo maio 2026</p>

      {/* Extrato */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {[
          { label: "Receita bruta",          value: "R$3.850",  sign: "+" , color: "text-white" },
          { label: "Taxa BeWild Host Care",   value: "R$770",    sign: "−",  color: "text-white/50" },
          { label: "Limpeza (6 saídas)",      value: "R$480",    sign: "−",  color: "text-white/50" },
          { label: "Manutenção (1 reparo)",   value: "R$120",    sign: "−",  color: "text-white/50" },
        ].map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-4 py-3 text-sm ${
              i < 3 ? "border-b border-white/5" : ""
            }`}
          >
            <span className="text-white/55">{row.label}</span>
            <span className={`font-mono font-medium ${row.color}`}>
              <span className="text-white/55 mr-1">{row.sign}</span>{row.value}
            </span>
          </div>
        ))}
        {/* Total */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-bewild-gold/8 border-t border-bewild-gold/20">
          <span className="text-sm font-semibold text-white">Repasse proprietário</span>
          <span className="text-lg font-bold text-bewild-gold font-mono">R$2.480</span>
        </div>
      </div>

      <p className="text-[10px] text-white/60 leading-relaxed">
        Repasse via Pix até o dia 10 do mês seguinte. Demonstrativo completo enviado por e-mail com nota fiscal.
      </p>
    </div>
  );
}

/* ─── Componente principal ──────────────── */
const TAB_CONTENT: Record<Tab, React.ComponentType> = {
  geral:      TabGeral,
  reservas:   TabReservas,
  limpeza:    TabLimpeza,
  manutencao: TabManutencao,
  repasse:    TabRepasse,
};

export function HostCareDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("geral");
  const Content = TAB_CONTENT[activeTab];

  return (
    <div className="rounded-2xl border border-white/10 bg-bewild-night overflow-hidden shadow-bewild-premium">
      {/* Header do painel */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/8" />
          </div>
          <span className="text-[11px] text-white/60 font-mono">Painel do Proprietário · BeWild Host Care</span>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ao vivo
        </span>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/8 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === tab.id
                ? "text-bewild-gold border-b-2 border-bewild-gold bg-bewild-gold/5"
                : "text-white/60 hover:text-white/80 border-b-2 border-transparent"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="p-4 sm:p-5 min-h-[260px]">
        <Content />
      </div>

      {/* Footer disclaimer */}
      <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.01]">
        <p className="text-[9px] text-white/40 font-mono">
          Dados ilustrativos · Resultado real varia por imóvel, bairro e período · Resultado passado não garante resultado futuro
        </p>
      </div>
    </div>
  );
}

export default HostCareDashboard;
