import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const fake = await import("./helpers/supabaseFake");
  return { supabase: fake.fakeSupabase };
});

import { calls, resetFake, setResponder, verbOf } from "./helpers/supabaseFake";
import FaqKbManager from "@/components/admin/FaqKbManager";

const ROWS = [
  {
    id: "seguro",
    tema: "Obra",
    pergunta: "Preciso de autorização do condomínio?",
    resposta: "Sim.",
    ordem: 10,
    ativo: true,
    acoes: [{ tipo: "link", rotulo: "Ver guia", url: "/autorizacao-condominio" }],
  },
  {
    id: "legado-inseguro",
    tema: "Obra",
    pergunta: "Pergunta antiga",
    resposta: "Resposta.",
    ordem: 20,
    ativo: true,
    acoes: [{ tipo: "link", rotulo: "Clique", url: "javascript:alert(1)" }],
  },
];

beforeEach(() => {
  resetFake();
  setResponder((call) => {
    if (verbOf(call) === "select") return { data: ROWS };
    return { data: [{ id: "x" }], error: null };
  });
});

function inserts() {
  return calls.filter((c) => c.table === "assistant_kb" && verbOf(c) === "insert");
}

async function abrirNovoComLink(url: string) {
  render(<FaqKbManager />);
  await screen.findByText("Pergunta antiga");
  fireEvent.click(screen.getByRole("button", { name: "+ nova pergunta" }));
  fireEvent.change(screen.getByLabelText("Pergunta"), { target: { value: "Como funciona?" } });
  fireEvent.change(screen.getByLabelText("Resposta"), { target: { value: "Assim." } });
  fireEvent.change(screen.getByLabelText("Botão ao final da resposta"), { target: { value: "link" } });
  fireEvent.change(screen.getByLabelText("Endereço do link"), { target: { value: url } });
}

describe("FaqKbManager — links dos botões passam por safeHref", () => {
  it("links já gravados: o seguro vira prévia clicável, o inseguro aparece bloqueado", async () => {
    render(<FaqKbManager />);
    const linhaSegura = (await screen.findByText("Preciso de autorização do condomínio?")).closest("tr")!;
    const link = within(linhaSegura).getByRole("link", { name: /Ver guia/ });
    expect(link).toHaveAttribute("href", "/autorizacao-condominio");

    const linhaInsegura = screen.getByText("Pergunta antiga").closest("tr")!;
    expect(within(linhaInsegura).queryByRole("link")).toBeNull();
    expect(within(linhaInsegura).getByText(/link bloqueado/)).toBeInTheDocument();
    // Nenhum href "javascript:" em lugar nenhum do painel.
    for (const a of document.querySelectorAll("a")) {
      expect(a.getAttribute("href") ?? "").not.toMatch(/^\s*javascript:/i);
    }
  });

  it("endereço inseguro: erro inline e NADA é gravado", async () => {
    await abrirNovoComLink("javascript:alert(1)");
    const campo = screen.getByLabelText("Endereço do link");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByText(/Endereço não permitido/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "criar pergunta" }));
    await waitFor(() =>
      expect(screen.getAllByRole("alert").some((el) => /Endereço não permitido/.test(el.textContent ?? ""))).toBe(true),
    );
    expect(inserts()).toHaveLength(0);
  });

  it.each(["//evil.com/x", "http://bewild.com.br", "data:text/html,oi", "https://bewild.com.br@golpe.com"])(
    "recusa %s",
    async (url) => {
      await abrirNovoComLink(url);
      fireEvent.click(screen.getByRole("button", { name: "criar pergunta" }));
      await screen.findAllByText(/Endereço não permitido/);
      expect(inserts()).toHaveLength(0);
    },
  );

  it("endereço permitido: mostra a prévia e grava o valor normalizado", async () => {
    await abrirNovoComLink("  https://WA.me/5511911906183  ");
    const previa = screen.getByRole("link", { name: /Saiba mais/ });
    expect(previa).toHaveAttribute("href", "https://wa.me/5511911906183");

    fireEvent.click(screen.getByRole("button", { name: "criar pergunta" }));
    await waitFor(() => expect(inserts()).toHaveLength(1));
    const payload = inserts()[0].ops.find(([op]) => op === "insert")?.[1][0] as {
      acoes: Array<{ url?: string }>;
    };
    expect(payload.acoes[0].url).toBe("https://wa.me/5511911906183");
  });

  it("caminho interno, mailto e tel são aceitos", async () => {
    for (const url of ["/autorizacao-condominio", "mailto:contato@bewild.com.br", "tel:+5511911906183"]) {
      resetFake();
      setResponder((call) => (verbOf(call) === "select" ? { data: [] } : { data: [{ id: "x" }] }));
      const { unmount } = render(<FaqKbManager />);
      await screen.findByText(/nenhuma pergunta cadastrada/);
      fireEvent.click(screen.getByRole("button", { name: "+ nova pergunta" }));
      fireEvent.change(screen.getByLabelText("Pergunta"), { target: { value: "P?" } });
      fireEvent.change(screen.getByLabelText("Resposta"), { target: { value: "R." } });
      fireEvent.change(screen.getByLabelText("Botão ao final da resposta"), { target: { value: "link" } });
      fireEvent.change(screen.getByLabelText("Endereço do link"), { target: { value: url } });
      fireEvent.click(screen.getByRole("button", { name: "criar pergunta" }));
      await waitFor(() => expect(inserts()).toHaveLength(1));
      unmount();
    }
  });
});
