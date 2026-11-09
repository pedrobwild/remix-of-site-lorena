/**
 * Formulários de bairro e da LP do Google Ads: sem confirmação do envio, a
 * pessoa fica sabendo que o pedido ficou salvo no aparelho (caixa de saída)
 * e continua com a opção do WhatsApp.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { LeadPayload } from "../leadDelivery";
import type { SendLeadResult } from "../sendLead";

const sendLeadMock = vi.fn<(payload: LeadPayload) => Promise<SendLeadResult>>();
vi.mock("@/lib/sendLead", () => ({
  sendLead: (payload: LeadPayload) => sendLeadMock(payload),
}));
vi.mock("@/lib/ga4", () => ({ trackEvent: () => {} }));
vi.mock("@/lib/conversions", () => ({ reportLead: () => {} }));
vi.mock("@/lib/adConsentRecord", () => ({
  currentAdConsentProof: () => ({ consent_record_id: null, consent_visitor_key: null }),
}));

import BairroLeadForm from "@/components/BairroLeadForm";
import LpStudioLeadForm from "@/components/LpStudioLeadForm";
import { LEAD_OUTBOX_SAVED_TEXT, listLeadOutbox } from "../leadOutbox";

const type = (id: string, value: string) =>
  fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });

beforeEach(() => {
  sendLeadMock.mockReset();
  localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("BairroLeadForm", () => {
  function preencher() {
    type("bf-nome", "Ana Souza");
    type("bf-whats", "11912345678");
    type("bf-email", "ana@exemplo.com");
  }

  it("falha: avisa que ficou salvo e mantém o WhatsApp", async () => {
    sendLeadMock.mockResolvedValue({ delivered: false, timedOut: false });
    render(<BairroLeadForm bairro="Pinheiros" />);
    preencher();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Solicitar orçamento/ })));
    expect(screen.getByRole("status")).toHaveTextContent(LEAD_OUTBOX_SAVED_TEXT);
    expect(screen.getByRole("link", { name: /Enviar pelo WhatsApp/ })).toBeInTheDocument();
    expect(listLeadOutbox()).toHaveLength(1);
  });

  it("entregue: nada de caixa de saída", async () => {
    sendLeadMock.mockResolvedValue({ delivered: true, timedOut: false });
    render(<BairroLeadForm bairro="Pinheiros" />);
    preencher();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Solicitar orçamento/ })));
    expect(screen.getByRole("status")).not.toHaveTextContent(LEAD_OUTBOX_SAVED_TEXT);
    expect(listLeadOutbox()).toEqual([]);
  });
});

describe("LpStudioLeadForm", () => {
  function preencher() {
    type("lp-nome", "Ana Souza");
    type("lp-whats", "11912345678");
    type("lp-mail", "ana@exemplo.com");
    fireEvent.click(screen.getByRole("button", { name: "Airbnb / short stay" }));
  }

  it("sem confirmação (tempo esgotado): avisa que ficou salvo e mantém o WhatsApp", async () => {
    sendLeadMock.mockResolvedValue({ delivered: false, timedOut: true });
    render(<LpStudioLeadForm variante="investidor" />);
    preencher();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Receber orçamento/ })));
    expect(screen.getByRole("status")).toHaveTextContent(LEAD_OUTBOX_SAVED_TEXT);
    expect(screen.getByRole("link", { name: /Enviar pelo WhatsApp/ })).toBeInTheDocument();
  });

  it("falha: o aviso vai junto do convite para tentar de novo", async () => {
    sendLeadMock.mockResolvedValue({ delivered: false, timedOut: false });
    render(<LpStudioLeadForm variante="investidor" />);
    preencher();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Receber orçamento/ })));
    expect(screen.getByRole("alert")).toHaveTextContent(LEAD_OUTBOX_SAVED_TEXT);
    expect(screen.getByRole("link", { name: /mande pelo WhatsApp/ })).toBeInTheDocument();
  });
});
