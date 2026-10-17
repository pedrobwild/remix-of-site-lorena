import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNeighborhoodInterest } from "@/hooks/useNeighborhoodInterest";
import { setConsent } from "@/lib/cookieConsent";

const record = vi.hoisted(() => vi.fn());
vi.mock("@/lib/analytics", () => ({ trackNeighborhoodInterest: record }));

afterEach(() => { record.mockClear(); localStorage.clear(); });

describe("Escolha atual de bairro", () => {
  it("reavalia o bairro atual quando o visitante aceita cookies sem recarregar", () => {
    const { rerender, unmount } = renderHook(({ bairro }) => useNeighborhoodInterest(bairro), { initialProps: { bairro: "Pinheiros" } });
    rerender({ bairro: "Mooca" });
    record.mockClear();
    act(() => setConsent("accepted"));
    expect(record.mock.calls).toEqual([["Mooca"]]);
    unmount();
    record.mockClear();
    act(() => setConsent("accepted"));
    expect(record).not.toHaveBeenCalled();
  });
  it("não registra campo de orçamento ainda não confirmado nem recusa", () => {
    const { rerender, unmount } = renderHook(({ enabled }) => useNeighborhoodInterest("Brooklin", enabled), { initialProps: { enabled: false } });
    act(() => setConsent("accepted"));
    expect(record).not.toHaveBeenCalled();
    rerender({ enabled: true });
    expect(record.mock.calls).toEqual([["Brooklin"]]);
    record.mockClear();
    act(() => setConsent("declined"));
    expect(record).not.toHaveBeenCalled();
    unmount();
  });
});