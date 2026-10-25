import { afterEach, describe, expect, it, vi } from "vitest";
import { SERVER_MEMO_MS, resetServerMemo, serverMemo } from "../serverMemo";

describe("serverMemo", () => {
  afterEach(() => {
    resetServerMemo();
    vi.unstubAllGlobals();
  });

  it("no navegador (window definido) não guarda nada", async () => {
    const fn = vi.fn(async () => 1);
    await serverMemo("k", fn);
    await serverMemo("k", fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("no servidor guarda por 60 s, compartilha chamadas simultâneas e respeita `keep`", async () => {
    vi.stubGlobal("window", undefined);
    let t = 1000;
    const now = () => t;
    let n = 0;
    const fn = vi.fn(async () => ++n);
    const [a, b] = await Promise.all([serverMemo("k", fn, { now }), serverMemo("k", fn, { now })]);
    expect([a, b]).toEqual([1, 1]);
    t += SERVER_MEMO_MS - 1;
    expect(await serverMemo("k", fn, { now })).toBe(1);
    t += 2;
    expect(await serverMemo("k", fn, { now })).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);

    const bad = vi.fn(async () => null);
    expect(await serverMemo("x", bad, { now, keep: (v) => v !== null })).toBeNull();
    await serverMemo("x", bad, { now, keep: (v) => v !== null });
    expect(bad).toHaveBeenCalledTimes(2);
  });
});
