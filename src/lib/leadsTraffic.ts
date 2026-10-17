/**
 * leadsTraffic.ts — agregações do painel "Tráfego" de /admin/leads.
 *
 * Funções puras sobre os leads de orçamento (/diagnostico, /orcamento, /o, /p):
 *  - origem do tráfego (Google Ads, Meta, busca orgânica, redes, direto) via
 *    a regra única de `leadCanal` (src/lib/leadSource.ts);
 *  - leads por bairro, normalizando o campo livre `location`.
 */

import { leadCanal, LEAD_CANAL_LABEL, type LeadCanal, type LeadSourceInput } from "@/lib/leadSource";

export type TrafficLead = LeadSourceInput & {
  location?: string | null;
};

export type OrigemSlice = {
  canal: LeadCanal;
  label: string;
  leads: number;
};

/** Contagem por canal de origem, na ordem fixa de LEAD_CANAIS, sem fatias zeradas. */
export function buildOrigemData(rows: TrafficLead[]): OrigemSlice[] {
  const counts = new Map<LeadCanal, number>();
  for (const r of rows) {
    const c = leadCanal(r);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const out: OrigemSlice[] = [];
  for (const canal of Object.keys(LEAD_CANAL_LABEL) as LeadCanal[]) {
    const leads = counts.get(canal) ?? 0;
    if (leads > 0) out.push({ canal, label: LEAD_CANAL_LABEL[canal], leads });
  }
  return out;
}

/**
 * Normaliza o campo livre `location` para um bairro comparável:
 * tira sufixo de cidade/UF ("— São Paulo", ", SP", "/ SP"), trim e
 * colapsa espaços. Vazio vira null (cai em "Não informado" no gráfico).
 */
export function leadBairro(location: string | null | undefined): string | null {
  if (!location) return null;
  let s = location.trim();
  // Corta tudo a partir de separadores comuns de cidade/UF.
  s = s.split(/\s[-–—/|]\s|,/)[0] ?? s;
  s = s.replace(/\s+/g, " ").trim();
  return s || null;
}

export type BairroSlice = {
  bairro: string;
  leads: number;
};

/**
 * Top bairros por nº de leads (desc; desempate alfabético). Quem ficar fora
 * do corte entra somado em "Outros"; leads sem bairro entram em
 * "Não informado" sempre ao final, sem disputar o corte.
 */
export function buildBairroData(rows: TrafficLead[], limit = 10): BairroSlice[] {
  const counts = new Map<string, number>();
  let semBairro = 0;
  for (const r of rows) {
    const b = leadBairro(r.location);
    if (!b) {
      semBairro += 1;
      continue;
    }
    const key = b.toLocaleLowerCase("pt-BR");
    const prev = counts.get(key);
    counts.set(key, (prev ?? 0) + 1);
  }

  const ordenados = [...counts.entries()]
    .map(([key, leads]) => ({ key, leads }))
    .sort((a, b) => b.leads - a.leads || a.key.localeCompare(b.key, "pt-BR"));

  // Guarda a grafia original mais frequente de cada bairro.
  const grafia = new Map<string, string>();
  for (const r of rows) {
    const b = leadBairro(r.location);
    if (!b) continue;
    const key = b.toLocaleLowerCase("pt-BR");
    if (!grafia.has(key)) grafia.set(key, b);
  }

  const top = ordenados.slice(0, limit);
  const resto = ordenados.slice(limit).reduce((acc, x) => acc + x.leads, 0);

  const out: BairroSlice[] = top.map((x) => ({
    bairro: grafia.get(x.key) ?? x.key,
    leads: x.leads,
  }));
  if (resto > 0) out.push({ bairro: "Outros", leads: resto });
  if (semBairro > 0) out.push({ bairro: "Não informado", leads: semBairro });
  return out;
}
