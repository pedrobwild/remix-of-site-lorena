import { beforeEach, describe, expect, it, vi } from "vitest";

const consent = { accepted: true };
vi.mock("@/lib/cookieConsent", () => ({
  isConsentAccepted: () => consent.accepted,
}));

import { FBC_SESSION_KEY, captureFbclid, fbcFromFbclid, newMetaEventId, readMetaBrowserIds, trackMetaLead } from "@/lib/metaPixel";

beforeEach(() => {
  consent.accepted = true;
  delete window.fbq;
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/orcamento");
});

describe("newMetaEventId", () => {
  it("gera ids únicos e não vazios", () => {
    const a = newMetaEventId();
    const b = newMetaEventId();
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
});

describe("readMetaBrowserIds", () => {
  it("lê _fbp e _fbc dos cookies quando têm o formato da Meta", () => {
    const ids = readMetaBrowserIds({
      cookies: "_ga=GA1.1.1; _fbp=fb.1.1700000000000.123456789; _fbc=fb.1.1700000000000.IwAR0abc",
      search: "",
    });
    expect(ids).toEqual({ fbp: "fb.1.1700000000000.123456789", fbc: "fb.1.1700000000000.IwAR0abc" });
  });

  it("reconstrói o _fbc a partir do fbclid da URL quando não há cookie", () => {
    const ids = readMetaBrowserIds({ cookies: "_fbp=fb.1.1700000000000.42", search: "?utm_source=fb&fbclid=IwAR0xyz", nowMs: 1_700_000_000_123 });
    expect(ids.fbp).toBe("fb.1.1700000000000.42");
    expect(ids.fbc).toBe("fb.1.1700000000123.IwAR0xyz");
    expect(fbcFromFbclid("abc", 5)).toBe("fb.1.5.abc");
  });

  it("usa o fbclid guardado na sessão quando a URL atual já não o tem", () => {
    expect(captureFbclid("?fbclid=IwAR0land", 1_700_000_000_000)).toBe("fb.1.1700000000000.IwAR0land");
    expect(window.sessionStorage.getItem(FBC_SESSION_KEY)).toBe("fb.1.1700000000000.IwAR0land");
    // Navegou para /orcamento sem query, sem cookies (aceite recusado).
    const ids = readMetaBrowserIds({ cookies: "", search: "" });
    expect(ids).toEqual({ fbp: null, fbc: "fb.1.1700000000000.IwAR0land" });
    // Cookie _fbc real tem prioridade; URL atual vem antes da sessão.
    expect(readMetaBrowserIds({ cookies: "_fbc=fb.1.1.cookie", search: "" }).fbc).toBe("fb.1.1.cookie");
    expect(readMetaBrowserIds({ cookies: "", search: "?fbclid=novo", nowMs: 7 }).fbc).toBe("fb.1.7.novo");
    // Sem fbclid na URL, não mexe no que está guardado.
    expect(captureFbclid("?utm_source=google")).toBeNull();
    expect(window.sessionStorage.getItem(FBC_SESSION_KEY)).toBe("fb.1.1700000000000.IwAR0land");
  });

  it("descarta cookies fora do formato e devolve null sem fbclid", () => {
    const ids = readMetaBrowserIds({ cookies: "_fbp=lixo; _fbc=tambem-lixo", search: "?utm_source=google" });
    expect(ids).toEqual({ fbp: null, fbc: null });
  });
});

describe("trackMetaLead", () => {
  it("dispara fbq('track','Lead') com eventID para deduplicar com a CAPI", () => {
    const fbq = vi.fn();
    window.fbq = fbq;
    const ok = trackMetaLead({ eventId: "evt-1", formPath: "/orcamento", objetivo: "Short stay" });
    expect(ok).toBe(true);
    expect(fbq).toHaveBeenCalledWith(
      "track",
      "Lead",
      { content_name: "/orcamento", content_category: "Short stay" },
      { eventID: "evt-1" },
    );
  });

  it("não dispara sem consentimento, sem fbq ou dentro do /admin", () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    consent.accepted = false;
    expect(trackMetaLead({ eventId: "e", formPath: "/contato" })).toBe(false);

    consent.accepted = true;
    window.history.replaceState({}, "", "/admin/leads");
    expect(trackMetaLead({ eventId: "e", formPath: "/contato" })).toBe(false);

    window.history.replaceState({}, "", "/contato");
    delete window.fbq;
    expect(trackMetaLead({ eventId: "e", formPath: "/contato" })).toBe(false);
    expect(fbq).not.toHaveBeenCalled();
  });
});
