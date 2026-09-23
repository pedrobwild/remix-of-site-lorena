import { describe, expect, it, vi } from "vitest";
import { applyOrderChanges, moveItem, renumber } from "@/lib/adminOrdering";

type Item = { id: string; sort_order: number };

describe("moveItem", () => {
  it("move como o arrayMove do dnd-kit", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("índices inválidos devolvem cópia intacta", () => {
    const list = ["a", "b"];
    expect(moveItem(list, 0, 5)).toEqual(["a", "b"]);
    expect(moveItem(list, -1, 0)).toEqual(["a", "b"]);
    expect(moveItem(list, 1, 1)).not.toBe(list);
  });
});

describe("renumber", () => {
  it("empates viram posições distintas e só o que muda é gravado", () => {
    // Situação real: várias linhas com o mesmo sort_order (o ±1 antigo não
    // conseguia separá-las e o created_at decidia).
    const rows: Item[] = [
      { id: "a", sort_order: 10 },
      { id: "b", sort_order: 1 },
      { id: "c", sort_order: 1 },
      { id: "d", sort_order: 40 },
    ];
    const { list, changes } = renumber(rows, "sort_order");
    expect(list.map((r) => r.sort_order)).toEqual([10, 20, 30, 40]);
    expect(changes).toEqual([
      { id: "b", value: 20 },
      { id: "c", value: 30 },
    ]);
  });

  it("trocar vizinhos (seta ↑/↓) sempre inverte a ordem", () => {
    const rows: Item[] = [
      { id: "a", sort_order: 5 },
      { id: "b", sort_order: 5 },
      { id: "c", sort_order: 5 },
    ];
    const { list, changes } = renumber(moveItem(rows, 2, 1), "sort_order");
    expect(list.map((r) => r.id)).toEqual(["a", "c", "b"]);
    expect(list.map((r) => r.sort_order)).toEqual([10, 20, 30]);
    expect(changes.map((c) => c.id)).toEqual(["a", "c", "b"]);
  });
});

describe("applyOrderChanges", () => {
  it("grava uma de cada vez, na ordem", async () => {
    const calls: string[] = [];
    let running = 0;
    const write = vi.fn(async (c: { id: string; value: number }) => {
      running += 1;
      expect(running).toBe(1); // nunca em paralelo
      calls.push(`${c.id}=${c.value}`);
      await Promise.resolve();
      running -= 1;
      return { error: null };
    });
    const res = await applyOrderChanges(
      [
        { id: "a", value: 10 },
        { id: "b", value: 20 },
      ],
      write,
    );
    expect(res).toEqual({ applied: 2, error: null });
    expect(calls).toEqual(["a=10", "b=20"]);
  });

  it("para no primeiro erro e devolve a mensagem", async () => {
    const write = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "permission denied" } })
      .mockResolvedValueOnce({ error: null });
    const res = await applyOrderChanges(
      [
        { id: "a", value: 10 },
        { id: "b", value: 20 },
        { id: "c", value: 30 },
      ],
      write,
    );
    expect(res).toEqual({ applied: 1, error: "permission denied" });
    expect(write).toHaveBeenCalledTimes(2);
  });

  it("exceção de rede também vira erro", async () => {
    const res = await applyOrderChanges([{ id: "a", value: 10 }], () =>
      Promise.reject(new Error("Failed to fetch")),
    );
    expect(res).toEqual({ applied: 0, error: "Failed to fetch" });
  });
});
