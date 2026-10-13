import { describe, expect, it } from "vitest";
import {
  CRM_ENGINE_AUTHOR,
  crmLeadStatus,
  planCrmLeadUpdate,
  shouldSendMetaQuality,
  type CrmLeadItem,
  type CrmLeadRow,
  type CrmStage,
} from "@/lib/crmStage";

const KEYS = [
  "mql", "qualificacao", "lead", "validacao_briefing", "projeto_3d_comercial", "solicitado",
  "em_elaboracao", "revisao_solicitada", "entregue", "em_revisao", "enviado", "negociacao",
  "minuta", "enviado_assinatura", "fechado",
];
// Posições propositalmente não sequenciais: a regra não pode depender de números fixos.
const STAGES: CrmStage[] = [
  ...KEYS.map((k, i) => ({ stage_key: k, stage_name: k, stage_position: 10 + i * 5, stage_is_terminal: false })),
  { stage_key: "aquecer_futuramente", stage_name: "Aquecer", stage_position: 900, stage_is_terminal: true },
  { stage_key: "perdido", stage_name: "Perdido", stage_position: 901, stage_is_terminal: true },
];
const pos = (k: string) => STAGES.find((s) => s.stage_key === k)!.stage_position;

function item(max: string, extra: Partial<CrmLeadItem> = {}): CrmLeadItem {
  return {
    lead_id: "l-1",
    current_stage_key: max,
    current_stage_name: max,
    current_stage_position: pos(max),
    max_stage_key: max,
    max_stage_position: pos(max),
    won: false,
    all_closed_lost: false,
    deal_count: 1,
    last_change_at: "2026-10-10T12:00:00Z",
    transitions: [],
    ...extra,
  };
}

describe("regra de status pelo funil do CRM", () => {
  it("MQL → novo", () => expect(crmLeadStatus(item("mql"), STAGES).status).toBe("novo"));
  it("Qualificação → contatado", () => expect(crmLeadStatus(item("qualificacao"), STAGES).status).toBe("contatado"));
  it("Lead → qualificado", () => expect(crmLeadStatus(item("lead"), STAGES)).toMatchObject({ status: "qualificado", lost: false }));
  it("chegou a Negociação e perdeu → qualificado + perdido", () => {
    const r = crmLeadStatus(item("negociacao", { current_stage_key: "perdido", all_closed_lost: true }), STAGES);
    expect(r).toMatchObject({ status: "qualificado", lost: true, won: false });
  });
  it("perdido sem passar de Qualificação → descartado", () => {
    expect(crmLeadStatus(item("qualificacao", { current_stage_key: "perdido", all_closed_lost: true }), STAGES).status).toBe("descartado");
  });
  it("aquecer futuramente → descartado", () => {
    expect(crmLeadStatus(item("mql", { current_stage_key: "aquecer_futuramente", all_closed_lost: true }), STAGES).status).toBe("descartado");
  });
  it("contrato fechado → qualificado + ganho", () => {
    expect(crmLeadStatus(item("fechado", { won: true }), STAGES)).toMatchObject({ status: "qualificado", won: true });
  });
  it("sem negócio → novo", () => {
    expect(crmLeadStatus(null, STAGES)).toMatchObject({ status: "novo", noDeal: true });
    expect(crmLeadStatus(item("mql", { deal_count: 0, max_stage_position: null }), STAGES)).toMatchObject({ status: "novo", noDeal: true });
  });
});

describe("plano de atualização e histórico", () => {
  const row: CrmLeadRow = {
    id: "l-1", status: "novo", crm_stage_key: null, crm_stage_name: null, crm_max_stage_key: null,
    crm_won: null, crm_lost: null, crm_deal_count: null, crm_last_change_at: null,
  };
  const it1 = item("negociacao", {
    current_stage_name: "Negociação",
    last_change_at: "2026-10-10T12:00:00Z",
    transitions: [
      { at: "2026-10-01T10:00:00Z", from_stage_key: "qualificacao", from_stage_name: "Qualificação", to_stage_key: "lead", to_stage_name: "Lead" },
      { at: "2026-10-10T12:00:00Z", from_stage_key: "lead", from_stage_name: "Lead", to_stage_key: "negociacao", to_stage_name: "Negociação" },
    ],
  });

  it("primeira execução grava status, colunas e uma linha por transição", () => {
    const p = planCrmLeadUpdate(row, it1, STAGES, [], "2026-10-13T00:00:00Z");
    expect(p.patch).toMatchObject({ status: "qualificado", crm_stage_name: "Negociação", crm_deal_count: 1 });
    expect(p.logs.map((l) => l.note)).toEqual(["CRM: Qualificação → Lead", "CRM: Lead → Negociação"]);
    expect(p.logs.every((l) => l.changed_by === null && l.changed_by_email === CRM_ENGINE_AUTHOR)).toBe(true);
    expect(p.logs[1]).toMatchObject({ from_status: "novo", to_status: "qualificado" });
  });

  it("idempotente: rodar de novo com o resultado aplicado não muda nada nem duplica log", () => {
    const first = planCrmLeadUpdate(row, it1, STAGES, [], "2026-10-13T00:00:00Z");
    const applied = { ...row, ...first.patch } as CrmLeadRow;
    // O banco devolve o timestamp em outro formato: tem de casar igual.
    const stored = first.logs.map((l) => ({ note: l.note, created_at: l.created_at.replace("Z", "+00:00").replace(".000", "") }));
    const second = planCrmLeadUpdate(applied, it1, STAGES, stored, "2026-10-13T00:15:00Z");
    expect(second.patch).toEqual({});
    expect(second.logs).toEqual([]);
    expect(second.statusChanged).toBe(false);
  });

  it("mudança de status sem transição nova vira uma linha própria", () => {
    const p = planCrmLeadUpdate(row, item("qualificacao", { current_stage_name: "Qualificação" }), STAGES, [], "2026-10-13T00:00:00Z");
    expect(p.logs).toHaveLength(1);
    expect(p.logs[0]).toMatchObject({ from_status: "novo", to_status: "contatado" });
  });

  it("Meta só para qualificado/descartado com mudança nos últimos 7 dias", () => {
    const p = planCrmLeadUpdate(row, it1, STAGES, [], "2026-10-13T00:00:00Z");
    const now = Date.parse("2026-10-13T00:00:00Z");
    expect(shouldSendMetaQuality(p, "2026-10-10T12:00:00Z", now)).toBe(true);
    expect(shouldSendMetaQuality(p, "2026-10-01T12:00:00Z", now)).toBe(false);
    const c = planCrmLeadUpdate(row, item("qualificacao"), STAGES, [], "2026-10-13T00:00:00Z");
    expect(shouldSendMetaQuality(c, "2026-10-12T12:00:00Z", now)).toBe(false);
  });
});
