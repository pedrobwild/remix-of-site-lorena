import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import { fmtBRL, fmtInt, fmtIntervaloDatas, fmtPct, hojeISO } from "@/guia/lib/format";
import { copiarTexto, gerarId, gravarJSON, lerJSON } from "@/guia/lib/browser";
import { pressionavel } from "@/guia/lib/a11y";
import { CHECKLIST_ITEMS, SCORE_TIERS, textoFaixasChecklist, tierDoScore } from "@/guia/data/checklist";
import { GUIA_FAQ, GUIA_MODIFIED, GUIA_PUBLISHED, guiaJsonLd } from "@/guia/data/guiaMeta";

describe("format (pt-BR)", () => {
  it("usa vírgula decimal e ponto de milhar", () => {
    expect(fmtPct(19.2)).toBe("19,2%");
    expect(fmtPct(75)).toBe("75%");
    expect(fmtInt(9225)).toBe("9.225");
    expect(fmtBRL(131328)).toBe("R$ 131.328");
  });

  it("formata intervalos de datas de calendário", () => {
    expect(fmtIntervaloDatas("2026-11-06", "2026-11-08")).toBe("06–08/11/2026");
    expect(fmtIntervaloDatas("2026-03-27", "2026-04-02")).toBe("27/03 – 02/04/2026");
    expect(fmtIntervaloDatas("2026-12-30", "2027-01-02")).toBe("30/12/2026 – 02/01/2027");
    expect(fmtIntervaloDatas("2026-06-20", "2026-06-20")).toBe("20/06/2026");
  });

  it("hojeISO usa a data local", () => {
    expect(hojeISO(new Date(2026, 8, 3, 23, 30))).toBe("2026-09-03");
  });
});

describe("copiarTexto", () => {
  const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  afterEach(() => {
    if (original) Object.defineProperty(navigator, "clipboard", original);
    else delete (navigator as unknown as { clipboard?: unknown }).clipboard;
    vi.restoreAllMocks();
  });

  const setClipboard = (writeText: () => Promise<void>) =>
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

  it("true quando a API de clipboard aceita", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    await expect(copiarTexto("oi")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("oi");
  });

  it("cai no execCommand quando a API recusa, e false se nada funcionar", async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error("NotAllowedError")));
    const exec = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: unknown }).execCommand = exec;
    await expect(copiarTexto("oi")).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");

    exec.mockReturnValue(false);
    await expect(copiarTexto("oi")).resolves.toBe(false);
  });
});

describe("gerarId", () => {
  it("gera UUID v4 mesmo sem crypto.randomUUID (Safari < 15.4)", () => {
    const spy = vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
      throw new Error("indisponível");
    });
    const id = gerarId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(gerarId()).not.toBe(id);
    spy.mockRestore();
  });
});

describe("lerJSON / gravarJSON", () => {
  const ehNumeros = (v: unknown): v is number[] => Array.isArray(v) && v.every((x) => typeof x === "number");

  it("ida e volta, validação e JSON corrompido", () => {
    expect(gravarJSON("session", "t:ok", [1, 2])).toBe(true);
    expect(lerJSON("session", "t:ok", ehNumeros)).toEqual([1, 2]);
    sessionStorage.setItem("t:ruim", "{nao é json");
    expect(lerJSON("session", "t:ruim", ehNumeros)).toBeNull();
    sessionStorage.setItem("t:formato", JSON.stringify({ a: 1 }));
    expect(lerJSON("session", "t:formato", ehNumeros)).toBeNull();
  });

  it("gravarJSON devolve false quando o navegador recusa", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("cota", "QuotaExceededError");
    });
    expect(gravarJSON("local", "t:cheio", [1])).toBe(false);
    vi.restoreAllMocks();
  });
});

describe("pressionavel", () => {
  it("ativa com clique, Enter e Espaço — e ignora outras teclas e teclas vindas de filhos", () => {
    const fn = vi.fn();
    const { getByRole, getByText } = render(
      createElement("div", pressionavel(fn), createElement("input", { "aria-label": "filho" }), "card"),
    );
    const el = getByRole("button");
    expect(el).toHaveAttribute("tabindex", "0");
    fireEvent.click(getByText("card"));
    fireEvent.keyDown(el, { key: "Enter" });
    fireEvent.keyDown(el, { key: " " });
    fireEvent.keyDown(el, { key: "a" });
    fireEvent.keyDown(getByRole("textbox"), { key: "Enter" });
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("checklist", () => {
  it("toda pontuação de 0 a 10 tem faixa, e a última é 'Pronto para investir' com a descrição certa", () => {
    for (let s = 0; s <= CHECKLIST_ITEMS.length; s++) expect(SCORE_TIERS).toContain(tierDoScore(s));
    expect(tierDoScore(10).label).toBe("Pronto para investir");
    expect(tierDoScore(10).desc).toBe("Seu projeto está maduro. Hora de executar.");
  });

  it("o texto do pré-render cita todas as faixas", () => {
    const t = textoFaixasChecklist();
    for (const tier of SCORE_TIERS) expect(t).toContain(tier.label);
    expect(t).toContain("De 7 a 8 itens, Quase pronto");
  });
});

describe("guiaMeta", () => {
  it("datas ISO válidas, modificação não anterior à publicação", () => {
    for (const d of [GUIA_PUBLISHED, GUIA_MODIFIED]) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(d))).toBe(false);
    }
    expect(GUIA_MODIFIED >= GUIA_PUBLISHED).toBe(true);
  });

  it("JSON-LD traz as mesmas datas e a FAQ inteira", () => {
    const [article, breadcrumb, faq] = guiaJsonLd();
    expect(article).toMatchObject({ "@type": "Article", datePublished: GUIA_PUBLISHED, dateModified: GUIA_MODIFIED });
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect((faq.mainEntity as unknown[]).length).toBe(GUIA_FAQ.length);
    expect(guiaJsonLd({ image: "https://x/y.jpg" })[0].image).toEqual(["https://x/y.jpg"]);
  });
});
