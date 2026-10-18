import { describe, expect, it, vi } from "vitest";
import { admitLead } from "@/../supabase/functions/notify-lead/admission";

describe("Admissão de pedidos", () => {
  it("500 pedidos já bloqueados por IP não consomem a cota diária", async () => {
    const day = vi.fn().mockResolvedValue(true);
    for (let i = 0; i < 500; i++) expect(await admitLead(async () => false, day)).toBe(false);
    expect(day).not.toHaveBeenCalled();
    expect(await admitLead(async () => true, day)).toBe(true);
    expect(day).toHaveBeenCalledTimes(1);
  });
  it("mantém a recusa quando a cota diária existente acabou", async () => {
    expect(await admitLead(async () => true, async () => false)).toBe(false);
  });
});