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
// rpc: consultas limitadas (get_public_site_settings, get_partner_case) que
// nunca respondem — o mesmo "backend pendurado" do select acima.
const rpcMock = vi.hoisted(() =>
  vi.fn((_fn: string, _args?: Record<string, unknown>) =>
    Object.assign(new Promise(() => {}), { maybeSingle: () => new Promise(() => {}) }),
  ),
);
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: fromMock, rpc: rpcMock },
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

describe("/orcamento — formulário em 4 etapas (modelo 1b)", () => {
  const continuar = () => fireEvent.click(screen.getByRole("button", { name: /Continuar/ }));

  /** Percorre as etapas 01–03 e preenche o contato da 04. */
  function preencher({ objetivo = /Morar/, chaves = "Ainda não", estado = "Usado", area = "32" } = {}) {
    type("orc-bairro", "Moema");
    type("orc-area", area);
    continuar();
    fireEvent.click(screen.getByRole("radio", { name: objetivo }));
    continuar();
    if (chaves) fireEvent.click(screen.getByRole("radio", { name: chaves }));
    if (estado) fireEvent.click(screen.getByRole("radio", { name: estado }));
    continuar();
    type("orc-nome", "Davi");
    type("orc-whats", "11912345678");
  }

  it("etapa 01 valida o bairro antes de avançar e foca o campo", () => {
    render(<OrcamentoPage />);
    continuar();
    const bairro = byId("orc-bairro");
    expect(document.activeElement).toBe(bairro);
    expect(bairro).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(bairro.getAttribute("aria-describedby")!)).toHaveTextContent("Informe o bairro.");
    expect(trackEventMock).not.toHaveBeenCalledWith("orcamento_step", expect.anything());
    expect(screen.queryByRole("button", { name: /Voltar/ })).toBeNull();
  });

  it("troca de etapa foca o H2, Voltar preserva o preenchido e o progresso volta", () => {
    render(<OrcamentoPage />);
    type("orc-bairro", "Moema");
    type("orc-area", "40");
    continuar();
    expect(document.activeElement).toHaveTextContent("Para que é a reforma?");
    expect(trackEventMock).toHaveBeenCalledWith("orcamento_step", { step: 1 });
    // Padrão: short stay.
    expect(screen.getByRole("radio", { name: /Short stay/ })).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: /Voltar/ }));
    expect(byId("orc-bairro").value).toBe("Moema");
    expect(byId("orc-area").value).toBe("40");
    expect(byId("orc-area")).toHaveAttribute("aria-valuetext", "40 m²");

    continuar();
    continuar();
    expect(screen.getByRole("heading", { name: /Em que pé está o imóvel/ })).toBeInTheDocument();
    // Etapa 04 ainda não foi vista: não dá para pular para ela.
    expect(screen.getByRole("button", { name: /04\s*Contato/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /01\s*Imóvel/ }));
    expect(screen.getByRole("heading", { name: /Onde fica e qual o tamanho/ })).toBeInTheDocument();
  });

  it("payload canônico com chaves e estado; falha mostra WhatsApp e 'Tentar de novo' (PUB-03/08)", async () => {
    sendLeadMock.mockResolvedValue(FAILED);
    render(<OrcamentoPage />);
    preencher();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Pedir orçamento/ })));

    expect(openSpy).not.toHaveBeenCalled();
    expect(sendLeadMock.mock.calls[0][0]).toMatchObject({
      objetivo: "Moradia",
      area_m2: 32,
      location: "Moema",
      chaves: "Ainda não",
      message: "Estado: Usado",
      form_path: "/orcamento",
      landing_path: "/",
    });
    for (const step of [1, 2, 3, 4]) {
      expect(trackEventMock).toHaveBeenCalledWith("orcamento_step", { step });
    }
    expect(screen.getByRole("alert")).toHaveTextContent("Não conseguimos enviar seu pedido");
    const wa = screen.getByRole("link", { name: /Enviar pelo WhatsApp/ });
    expect(decodeURIComponent(wa.getAttribute("href")!)).toContain("Chaves: Ainda não");
    expect(decodeURIComponent(wa.getAttribute("href")!)).toContain("Estado: Usado");
    expect(screen.getByRole("button", { name: /Tentar de novo/ })).not.toBeDisabled();
  });

  it("entregue: agradece com o número e 'Refazer simulação' volta à etapa 01 com os dados", async () => {
    sendLeadMock.mockResolvedValue(DELIVERED);
    render(<OrcamentoPage />);
    preencher({ chaves: "", estado: "" });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Pedir orçamento/ })));
    expect(sendLeadMock.mock.calls[0][0]).toMatchObject({ chaves: null, message: null });
    expect(screen.getByRole("heading", { name: "Obrigado, Davi." })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("(11) 91234-5678");
    expect(screen.queryByRole("button", { name: /Continuar/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Refazer simulação" }));
    expect(byId("orc-bairro").value).toBe("Moema");
  });

  it("atribuição completa: último e 1º toque, termo/conteúdo e clique de anúncio", async () => {
    window.history.replaceState({}, "", "/orcamento?utm_source=meta&utm_medium=cpc&utm_campaign=set26&utm_content=video-a&fbclid=IwAR3xyz");
    localStorage.setItem("bewild_first_utm", JSON.stringify({ utm_source: "google", utm_medium: "organic" }));
    localStorage.setItem("bewild_click", JSON.stringify({ gclid: "Cj0antigo", gclid_ts: Date.now() - 86_400_000 }));
    sendLeadMock.mockResolvedValue(DELIVERED);
    render(<OrcamentoPage />);
    preencher();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Pedir orçamento/ })));
    expect(sendLeadMock.mock.calls[0][0]).toMatchObject({
      form_path: "/orcamento",
      utm_source: "meta",
      utm_medium: "cpc",
      utm_campaign: "set26",
      utm_term: null,
      utm_content: "video-a",
      first_utm_source: "google",
      first_utm_medium: "organic",
      first_utm_campaign: null,
      gclid: "Cj0antigo",
      fbclid: "IwAR3xyz",
    });
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

