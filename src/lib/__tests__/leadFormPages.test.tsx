/**
 * Fluxos críticos dos formulários de lead, renderizando as páginas reais
 * com `sendLead` e GA4 simulados.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { LeadPayload } from "../leadDelivery";
import type { SendLeadResult } from "../sendLead";

const sendLeadMock = vi.fn<(payload: LeadPayload) => Promise<SendLeadResult>>();
const trackEventMock = vi.fn();

vi.mock("@/lib/sendLead", () => ({
  sendLead: (payload: LeadPayload) => sendLeadMock(payload),
}));
vi.mock("@/lib/ga4", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../ga4")>()),
  trackEvent: (name: string, params?: Record<string, unknown>) => trackEventMock(name, params),
}));
const insertMock = vi.hoisted(() => vi.fn((_row: Record<string, unknown>) => Promise.resolve({ error: null })));
const fromMock = vi.hoisted(() =>
  vi.fn((_table: string) => ({
    select: () => ({ eq: () => ({ maybeSingle: () => new Promise(() => {}) }) }),
    insert: insertMock,
  })),
);
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: fromMock },
}));
vi.mock("@/components/BwaNav", () => ({ default: () => null }));
vi.mock("@/components/BwaFooter", () => ({ default: () => null }));

import ContatoPage from "@/pages/ContatoPage";
import LpObraPage from "@/pages/LpObraPage";
import LpPanfletoPage from "@/pages/LpPanfletoPage";
import OrcamentoPage from "@/pages/OrcamentoPage";
import ParceirosPage from "@/pages/ParceirosPage";
import { setConsent } from "../cookieConsent";

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const byId = <T extends HTMLElement = HTMLInputElement>(id: string) =>
  document.getElementById(id) as T;
const type = (id: string, value: string) => fireEvent.change(byId(id), { target: { value } });
const FAILED: SendLeadResult = { delivered: false, timedOut: false };
const DELIVERED: SendLeadResult = { delivered: true, timedOut: false };

let openSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  sendLeadMock.mockReset();
  trackEventMock.mockReset();
  insertMock.mockClear();
  fromMock.mockClear();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("/p — panfleto (PUB-02)", () => {
  function preencher() {
    type("p-nome", "Ana Souza");
    type("p-whats", "+55 11 91234-5678");
    type("p-email", "ana@exemplo.com");
    type("p-local", "Itaim");
    fireEvent.click(screen.getByRole("button", { name: "Sim" }));
    fireEvent.click(screen.getByRole("button", { name: "Moradia" }));
    type("p-m2", "32,5");
  }

  it("abre o WhatsApp ANTES do envio e não diz 'recebemos' sem confirmação", async () => {
    window.history.replaceState({}, "", "/p?utm_campaign=panfleto-itaim");
    const d = deferred<SendLeadResult>();
    sendLeadMock.mockReturnValue(d.promise);
    render(<LpPanfletoPage />);
    preencher();
    expect(byId("p-whats").value).toBe("(11) 91234-5678");

    fireEvent.click(document.querySelector<HTMLButtonElement>(".formcard button[type=submit]")!);

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(sendLeadMock).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.invocationCallOrder[0]).toBeLessThan(sendLeadMock.mock.invocationCallOrder[0]);
    const waUrl = openSpy.mock.calls[0][0] as string;
    expect(decodeURIComponent(waUrl)).toContain("Metragem (m²): 32,5");
    expect(decodeURIComponent(waUrl)).toContain("(origem: panfleto-itaim)");

    expect(sendLeadMock.mock.calls[0][0]).toMatchObject({
      whatsapp: "11912345678",
      area_m2: 32.5,
      objetivo: "Moradia",
      form_path: "/p",
      utm_source: "qr",
      utm_medium: "panfleto",
      utm_campaign: "panfleto-itaim",
    });

    await act(async () => d.resolve(FAILED));
    expect(screen.queryByText("Recebemos seus dados.")).toBeNull();
    expect(screen.getByText("Abrimos o WhatsApp com seus dados.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir o WhatsApp de novo/ })).toHaveAttribute("href", waUrl);
    expect(trackEventMock).toHaveBeenCalledWith(
      "generate_lead",
      expect.objectContaining({ method: "lp_panfleto_form", delivery: "failed" }),
    );
  });

  it("clique com campos pendentes mostra os erros, associa e foca o primeiro", () => {
    render(<LpPanfletoPage />);
    const submit = document.querySelector<HTMLButtonElement>(".formcard button[type=submit]")!;
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);
    expect(sendLeadMock).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
    const nome = byId("p-nome");
    expect(document.activeElement).toBe(nome);
    expect(nome).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(nome.getAttribute("aria-describedby")!)).toHaveTextContent("Informe seu nome.");
  });
});

describe("/o — placa de obra (PUB-06)", () => {
  function preencher() {
    type("g-nome", "Bruno");
    type("g-whats", "11912345678");
    type("g-email", "bruno@exemplo.com");
  }
  const submit = () => fireEvent.click(document.querySelector<HTMLButtonElement>("#gate-card button[type=submit]")!);

  it("sem confirmação não redireciona: mostra WhatsApp com os dados e permite reenviar", async () => {
    window.history.replaceState({}, "", "/o?bairro=Pinheiros");
    sendLeadMock.mockResolvedValueOnce(FAILED);
    render(<LpObraPage />);
    preencher();
    await act(async () => submit());

    expect(screen.queryByText("Abrindo o portal…")).toBeNull();
    expect(screen.getByText("Não conseguimos registrar seu contato.")).toBeInTheDocument();
    const wa = screen.getByRole("link", { name: /Enviar pelo WhatsApp/ });
    expect(decodeURIComponent(wa.getAttribute("href")!)).toContain("Nome: Bruno");
    expect(trackEventMock).toHaveBeenCalledWith("lead_delivery_failed", expect.objectContaining({ method: "lp_obra_gate" }));
    expect(trackEventMock).not.toHaveBeenCalledWith("generate_lead", expect.anything());

    const primeiro = sendLeadMock.mock.calls[0][0];
    expect(primeiro).toMatchObject({ form_path: "/o", location: "Pinheiros", utm_source: "qr", utm_medium: "placa" });
    sendLeadMock.mockResolvedValueOnce({ delivered: false, timedOut: true });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Tentar enviar de novo" })));
    expect(sendLeadMock.mock.calls[1][0]).toBe(primeiro);
    expect(screen.getByText("Seu contato pode já ter chegado.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar enviar de novo" })).toBeNull();
    expect(screen.getByRole("button", { name: "Continuar para o portal" })).toBeInTheDocument();
  });
});

describe("/contato", () => {
  it("mensagem curta: botão habilitado, erro explícito e foco no campo (PUB-19)", () => {
    render(<ContatoPage />);
    type("ct-nome", "Carla");
    type("ct-whats", "11912345678");
    type("ct-mensagem", "Olá");
    const botao = screen.getByRole("button", { name: /Enviar mensagem/ });
    expect(botao).not.toBeDisabled();
    fireEvent.click(botao);
    expect(sendLeadMock).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(byId("ct-mensagem"));
    expect(screen.getByText(/ao menos 10 caracteres/)).toBeInTheDocument();
  });

  it("abre o WhatsApp dentro do gesto e manda atribuição + form_path (PUB-03, item 8)", async () => {
    sessionStorage.setItem("bewild_landing", "/blog/reforma-studio");
    localStorage.setItem("bewild_first_utm", JSON.stringify({ utm_source: "google", utm_medium: "cpc", utm_campaign: "studio" }));
    const d = deferred<SendLeadResult>();
    sendLeadMock.mockReturnValue(d.promise);
    render(<ContatoPage />);
    type("ct-nome", "Carla");
    type("ct-whats", "11912345678");
    type("ct-mensagem", "Quero reformar meu studio de 30 m².");
    fireEvent.click(screen.getByRole("button", { name: /Enviar mensagem/ }));

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(sendLeadMock.mock.calls[0][0]).toMatchObject({
      form_path: "/contato",
      landing_path: "/blog/reforma-studio",
      utm_source: "google",
      utm_campaign: "studio",
    });
    await act(async () => d.resolve(DELIVERED));
    expect(screen.getByText("Mensagem recebida")).toBeInTheDocument();
  });

  it("mapa do Google só com consentimento ou clique (PUB-12)", () => {
    render(<ContatoPage />);
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: /Abrir no Google Maps/ })).toBeInTheDocument();
    act(() => setConsent("accepted"));
    expect(document.querySelector("iframe")).not.toBeNull();
  });

  it("botão 'Carregar mapa' carrega sem consentimento global", () => {
    render(<ContatoPage />);
    fireEvent.click(screen.getByRole("button", { name: "Carregar mapa" }));
    expect(document.querySelector("iframe")).not.toBeNull();
  });
});

describe("/orcamento", () => {
  it("objetivo canônico, metragem decimal e fallback com WhatsApp (PUB-03/08)", async () => {
    sendLeadMock.mockResolvedValue(FAILED);
    render(<OrcamentoPage />);
    type("orc-nome", "Davi");
    type("orc-whats", "11912345678");
    type("orc-bairro", "Moema");
    type("orc-area", "32,5");
    fireEvent.change(byId<HTMLSelectElement>("orc-objetivo"), { target: { value: "Moradia" } });
    expect(screen.getByRole("option", { name: "Morar" })).toHaveAttribute("value", "Moradia");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Pedir orçamento/ })));

    expect(openSpy).not.toHaveBeenCalled();
    expect(sendLeadMock.mock.calls[0][0]).toMatchObject({
      objetivo: "Moradia",
      area_m2: 32.5,
      form_path: "/orcamento",
      landing_path: "/",
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Não conseguimos enviar seu pedido");
    expect(screen.getByRole("link", { name: /Enviar pelo WhatsApp/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tentar de novo/ })).not.toBeDisabled();
  });
});

describe("/parceiros", () => {
  it("e-mail que o servidor recusaria mostra erro (antes o clique não fazia nada)", () => {
    render(<ParceirosPage />);
    fireEvent.change(byId<HTMLSelectElement>("parc-tipo"), { target: { value: "Imobiliária" } });
    type("parc-nome", "Eva");
    type("parc-whats", "11912345678");
    type("parc-mail", "eva@imob.c");
    type("parc-regiao", "Pinheiros");
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar como parceiro/ }));
    expect(sendLeadMock).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(byId("parc-mail"));
    expect(screen.getByText("Confira o e-mail digitado.")).toBeInTheDocument();
  });

  it("payload de parceiro com form_path e FAQ sem microdata duplicada (PUB-17/21)", async () => {
    sendLeadMock.mockResolvedValue(DELIVERED);
    render(<ParceirosPage />);
    expect(document.querySelector("[itemtype*='FAQPage']")).toBeNull();
    expect(document.querySelector("[itemprop]")).toBeNull();
    fireEvent.change(byId<HTMLSelectElement>("parc-tipo"), { target: { value: "Imobiliária" } });
    type("parc-nome", "Eva");
    type("parc-whats", "11912345678");
    type("parc-regiao", "Pinheiros");
    type("parc-origem", "Evento");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Cadastrar como parceiro/ })));
    expect(sendLeadMock.mock.calls[0][0]).toMatchObject({
      form_path: "/parceiros",
      objetivo: "Parceria comercial — Imobiliária",
      lead_source: "Evento",
      location: "Pinheiros",
    });
    // WhatsApp de atendimento abre dentro do gesto, antes do envio.
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.invocationCallOrder[0]).toBeLessThan(sendLeadMock.mock.invocationCallOrder[0]);
    // Indicação registrada para /admin/indicacoes, só com campos do formulário.
    expect(fromMock).toHaveBeenCalledWith("partner_referrals");
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0][0]).toMatchObject({
      partner_name: "Eva",
      partner_type: "Imobiliária",
      whatsapp: "11912345678",
      region: "Pinheiros",
      landing_path: "/parceiros",
    });
    expect(insertMock.mock.calls[0][0]).not.toHaveProperty("status");
    expect(screen.getByText("Cadastro recebido")).toBeInTheDocument();
  });
});

