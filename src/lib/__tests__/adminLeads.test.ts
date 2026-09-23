import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const fake = await import("./helpers/supabaseFake");
  return { supabase: fake.fakeSupabase };
});

import {
  calls,
  hasOp,
  resetFake,
  setResponder,
  setSession,
  verbOf,
} from "./helpers/supabaseFake";
import {
  DIAGNOSTICO_FORMS,
  MENSAGEM_FORMS,
  fetchLeadStatusCounts,
  leadFormLabel,
  leadFormOrFilter,
  leadOrigem,
  mailtoHref,
  moveStatusCount,
  resolveLeadForm,
  updateLeadStatus,
  waLink,
} from "@/lib/adminLeads";

beforeEach(() => {
  resetFake();
});

describe("formulário de origem do lead", () => {
  it("usa form_path quando existe, mesmo com landing_path de outra página", () => {
    // Sessão começou na home e o lead veio do /diagnostico: antes sumia da tela.
    expect(resolveLeadForm({ form_path: "/diagnostico", landing_path: "/" })).toEqual({
      form: "/diagnostico",
      exact: true,
    });
    expect(leadOrigem({ form_path: "/orcamento", landing_path: "/portfolio" })).toBe("orcamento");
    expect(leadOrigem({ form_path: "/contato", landing_path: "/diagnostico" })).toBe("contato");
    expect(leadOrigem({ form_path: "/parceiros", landing_path: "/" })).toBe("parceiro");
    expect(leadOrigem({ form_path: "/indique-um-amigo", landing_path: "/" })).toBe("indicacao");
    expect(leadOrigem({ form_path: "/o" })).toBe("orcamento");
    expect(leadOrigem({ form_path: "/p" })).toBe("orcamento");
  });

  it("lead antigo (form_path nulo) é deduzido pelo landing_path", () => {
    expect(resolveLeadForm({ form_path: null, landing_path: "/diagnostico?utm_source=x" })).toEqual({
      form: "/diagnostico",
      exact: false,
    });
    expect(leadOrigem({ form_path: null, landing_path: "/contato/" })).toBe("contato");
    expect(leadOrigem({ form_path: null, landing_path: "/" })).toBe("outro");
    expect(leadFormLabel({ form_path: null, landing_path: "/orcamento" })).toBe("Orçamento (provável)");
    expect(leadFormLabel({ form_path: "/orcamento" })).toBe("Orçamento");
  });

  it("parceiro antigo é reconhecido pelo objetivo gravado só por aquele formulário", () => {
    expect(
      leadOrigem({ form_path: null, landing_path: "/", objetivo: "Parceria comercial — Arquiteto" }),
    ).toBe("parceiro");
  });

  it("form_path desconhecido não cai no palpite pelo landing_path", () => {
    expect(resolveLeadForm({ form_path: "/novo-form", landing_path: "/diagnostico" }).form).toBeNull();
  });

  it("filtro PostgREST cobre form_path e o legado sem form_path", () => {
    expect(leadFormOrFilter(MENSAGEM_FORMS)).toBe(
      'form_path.in.("/contato"),and(form_path.is.null,landing_path.in.("/contato"))',
    );
    const diag = leadFormOrFilter(DIAGNOSTICO_FORMS);
    for (const f of ["/diagnostico", "/orcamento", "/o", "/p"]) expect(diag).toContain(`"${f}"`);
    expect(diag).not.toContain("/contato");
  });
});

describe("links de contato", () => {
  it("mailto só para endereço simples", () => {
    expect(mailtoHref("maria@exemplo.com.br")).toBe("mailto:maria@exemplo.com.br");
    expect(mailtoHref("joao.silva+obra@bewild.com.br")).toBe("mailto:joao.silva+obra@bewild.com.br");
    // BCC escondido via querystring do mailto
    expect(mailtoHref("x@y.com?bcc=spy@evil.com")).toBeNull();
    expect(mailtoHref("x@y.com&cc=a@b.com")).toBeNull();
    expect(mailtoHref("a b@c.com")).toBeNull();
    expect(mailtoHref("x@y.com%0Abcc:z@w.com")).toBeNull();
    expect(mailtoHref("sem-arroba")).toBeNull();
    expect(mailtoHref(null)).toBeNull();
  });

  it("wa.me normaliza números brasileiros", () => {
    expect(waLink("(11) 91190-6183")).toBe("https://wa.me/5511911906183");
    expect(waLink("+55 11 91190-6183")).toBe("https://wa.me/5511911906183");
    expect(waLink("123")).toBeNull();
  });
});

describe("contagens por status", () => {
  it("moveStatusCount ajusta sem ir abaixo de zero", () => {
    const c = { novo: 1, contatado: 0, qualificado: 0, descartado: 0 };
    expect(moveStatusCount(c, "novo", "qualificado")).toEqual({
      novo: 0,
      contatado: 0,
      qualificado: 1,
      descartado: 0,
    });
    expect(moveStatusCount(c, "contatado", "novo").contatado).toBe(0);
  });

  it("usa count exato por status (head), com o filtro de formulário", async () => {
    setResponder((call) => {
      const status = call.ops.find(([op, a]) => op === "eq" && a[0] === "status")?.[1][1];
      return { count: { novo: 1500, contatado: 2, qualificado: 3, descartado: 4 }[status as string] };
    });
    const { counts, error } = await fetchLeadStatusCounts("form_path.in.(\"/contato\")");
    expect(error).toBeNull();
    expect(counts).toEqual({ novo: 1500, contatado: 2, qualificado: 3, descartado: 4 });
    expect(calls).toHaveLength(4);
    for (const call of calls) {
      expect(hasOp(call, "select", "id", { count: "exact", head: true })).toBe(true);
      expect(hasOp(call, "or", 'form_path.in.("/contato")')).toBe(true);
    }
  });
});

describe("updateLeadStatus", () => {
  it("atualiza o lead e grava o histórico com o autor da sessão", async () => {
    setSession({ user: { id: "u-1", email: "dono@bewild.com.br" } });
    setResponder((call) => {
      if (call.table === "leads") return { data: [{ id: "l-1" }] };
      return {
        data: {
          id: "log-1",
          lead_id: "l-1",
          from_status: "novo",
          to_status: "qualificado",
          note: "ligar amanhã",
          changed_by_email: "dono@bewild.com.br",
          created_at: "2026-09-23T12:00:00Z",
        },
      };
    });
    const res = await updateLeadStatus("l-1", "novo", "qualificado", "  ligar amanhã ");
    expect(res.ok).toBe(true);
    expect(res.ok && res.logError).toBeNull();

    const [leadCall, logCall] = calls;
    expect(leadCall.table).toBe("leads");
    expect(verbOf(leadCall)).toBe("update");
    expect(hasOp(leadCall, "update", { status: "qualificado" })).toBe(true);
    expect(hasOp(leadCall, "eq", "id", "l-1")).toBe(true);
    expect(logCall.table).toBe("lead_qualification_log");
    expect(
      hasOp(logCall, "insert", {
        lead_id: "l-1",
        from_status: "novo",
        to_status: "qualificado",
        note: "ligar amanhã",
        changed_by: "u-1",
        changed_by_email: "dono@bewild.com.br",
      }),
    ).toBe(true);
  });

  it("erro no update: nada é gravado no histórico", async () => {
    setResponder((call) =>
      call.table === "leads" ? { error: { message: "permission denied" } } : { data: {} },
    );
    const res = await updateLeadStatus("l-1", "novo", "contatado");
    expect(res).toEqual({ ok: false, error: "permission denied" });
    expect(calls.map((c) => c.table)).toEqual(["leads"]);
  });

  it("update sem linhas (RLS) não é tratado como sucesso", async () => {
    setResponder(() => ({ data: [] }));
    const res = await updateLeadStatus("l-1", "novo", "contatado");
    expect(res.ok).toBe(false);
  });

  it("histórico falhou: status salvo, erro devolvido (a tela mantém a observação)", async () => {
    setResponder((call) =>
      call.table === "leads"
        ? { data: [{ id: "l-1" }] }
        : { error: { message: "new row violates row-level security policy" } },
    );
    const res = await updateLeadStatus("l-1", "novo", "descartado", "sem orçamento");
    expect(res).toEqual({
      ok: true,
      log: null,
      logError: "new row violates row-level security policy",
    });
  });

  it("mesmo status + observação: só registra a observação", async () => {
    setResponder(() => ({ data: { id: "log-2", lead_id: "l-1", to_status: "contatado" } }));
    const res = await updateLeadStatus("l-1", "contatado", "contatado", "retornou a ligação");
    expect(res.ok).toBe(true);
    expect(calls.map((c) => c.table)).toEqual(["lead_qualification_log"]);
  });

  it("mesmo status sem observação: nada a fazer", async () => {
    const res = await updateLeadStatus("l-1", "novo", "novo");
    expect(res.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });
});
