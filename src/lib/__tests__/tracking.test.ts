/**
 * Pixel próprio e links rastreados: regras da edge function `px`
 * (supabase/functions/_shared/tracking.ts) e os endereços que o painel monta
 * (src/lib/tracking.ts) — o que o painel gera tem de ser o que a função aceita.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", async () => {
  const fake = await import("./helpers/supabaseFake");
  return { supabase: fake.fakeSupabase };
});

import {
  classifyAgent,
  cleanParam,
  FALLBACK_URL,
  hitRow,
  openPixelUrl,
  PIXEL_GIF,
  readTrackParams,
  safeDestination,
  withUtms,
} from "../../../supabase/functions/_shared/tracking";
import { buildPixelTag, buildPixelUrl, buildTrackedLink, EMPTY_TRACKING_FIELDS, invalidFields, pxBase } from "@/lib/tracking";

const BASE = "https://proj.supabase.co/functions/v1/px";

describe("função px — regras", () => {
  it("GIF de 1×1 válido", () => {
    expect(PIXEL_GIF.byteLength).toBe(42);
    expect(String.fromCharCode(...PIXEL_GIF.slice(0, 6))).toBe("GIF89a");
  });

  it("campos: letras com acento, números e pontuação simples; o resto é descartado", () => {
    expect(cleanParam("  nutrição   qualificados ")).toBe("nutrição qualificados");
    expect(cleanParam("feira-casa_cor:2026/set|a+b")).toBe("feira-casa_cor:2026/set|a+b");
    expect(cleanParam("<script>")).toBeNull();
    expect(cleanParam("ana@exemplo.com")).toBeNull();
    expect(cleanParam("")).toBeNull();
    expect(cleanParam(null)).toBeNull();
    expect(cleanParam("x".repeat(150))).toBe("x".repeat(100));
  });

  it("aceita nomes curtos e utm_*", () => {
    expect(readTrackParams(new URL(`${BASE}?c=camp&s=email&m=crm&n=post&t=etapa`))).toEqual({
      campaign: "camp",
      source: "email",
      medium: "crm",
      content: "post",
      term: "etapa",
    });
    expect(readTrackParams(new URL(`${BASE}?utm_campaign=x&utm_source=ig`))).toMatchObject({ campaign: "x", source: "ig", medium: null });
  });

  it("destino: só https dos hosts permitidos (e subdomínios), sem usuário/senha", () => {
    expect(safeDestination("https://bewild.com.br/orcamento")?.toString()).toBe("https://bewild.com.br/orcamento");
    expect(safeDestination("https://www.bewild.com.br/")).not.toBeNull();
    expect(safeDestination("https://wa.me/5511911906183")).not.toBeNull();
    expect(safeDestination("https://www.instagram.com/bewild.oficial")).not.toBeNull();
    expect(safeDestination("http://bewild.com.br/")).toBeNull();
    expect(safeDestination("https://bewild.com.br.evil.com/")).toBeNull();
    expect(safeDestination("https://evilbewild.com.br/")).toBeNull();
    expect(safeDestination("https://user:pass@bewild.com.br/")).toBeNull();
    expect(safeDestination("javascript:alert(1)")).toBeNull();
    expect(safeDestination("//bewild.com.br")).toBeNull();
    expect(safeDestination(null)).toBeNull();
    expect(FALLBACK_URL).toBe("https://bewild.com.br/");
  });

  it("no site, a campanha vira utm_* sem sobrescrever o que o link já tem; fora do site, nada muda", () => {
    const p = { campaign: "camp", source: "email", medium: "crm", content: null, term: null };
    expect(withUtms(new URL("https://bewild.com.br/orcamento?utm_source=ig"), p).toString()).toBe(
      "https://bewild.com.br/orcamento?utm_source=ig&utm_medium=crm&utm_campaign=camp",
    );
    expect(withUtms(new URL("https://wa.me/5511911906183?text=oi"), p).toString()).toBe("https://wa.me/5511911906183?text=oi");
  });

  it("agente: Gmail conta como abertura; prévias de link são robôs", () => {
    expect(classifyAgent("Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)")).toEqual({
      agent: "gmail_proxy",
      isBot: false,
    });
    expect(classifyAgent("WhatsApp/2.23.20.0 A")).toEqual({ agent: "bot", isBot: true });
    expect(classifyAgent("Slackbot-LinkExpanding 1.0").isBot).toBe(true);
    expect(classifyAgent("facebookexternalhit/1.1").isBot).toBe(true);
    expect(classifyAgent("Microsoft Outlook 16.0.1").agent).toBe("outlook");
    expect(classifyAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148").agent).toBe(
      "apple_mail",
    );
    expect(
      classifyAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1").agent,
    ).toBe("mobile");
    expect(classifyAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36").agent).toBe("desktop");
    expect(classifyAgent(null)).toEqual({ agent: "other", isBot: false });
  });

  it("linha gravada: sem IP; país só com duas letras; referer só o host; destino só o caminho", () => {
    const row = hitRow(
      "click",
      { campaign: "camp", source: null, medium: null, content: null, term: null },
      {
        userAgent: "WhatsApp/2.23",
        country: "br",
        referer: "https://mail.google.com/mail/u/0/#inbox/abc",
        target: new URL("https://bewild.com.br/orcamento?nome=Ana"),
      },
    );
    expect(row).toEqual({
      kind: "click",
      campaign: "camp",
      source: null,
      medium: null,
      content: null,
      term: null,
      target_host: "bewild.com.br",
      target_path: "/orcamento",
      agent: "bot",
      is_bot: true,
      country: "BR",
      referer_host: "mail.google.com",
    });
    expect(hitRow("open", row, { country: "XX" }).country).toBeNull();
    expect(hitRow("open", row, { country: "Brasil" }).country).toBeNull();
    expect(JSON.stringify(row)).not.toContain("Ana");
  });

  it("pixel da nutrição: campanha, conteúdo e etapa tirados dos utm_* do link do post", () => {
    const post =
      "https://bewild.com.br/conteudos/quanto-tempo?utm_source=email&utm_medium=crm&utm_campaign=nutricao_qualificados&utm_content=quanto-tempo&utm_term=proposta";
    expect(openPixelUrl("https://proj.supabase.co/functions/v1/", post)).toBe(
      "https://proj.supabase.co/functions/v1/px?c=nutricao_qualificados&s=email&m=crm&n=quanto-tempo&t=proposta",
    );
    expect(openPixelUrl("https://proj.supabase.co/functions/v1", "https://bewild.com.br/conteudos/x")).toBeNull();
    expect(openPixelUrl("https://proj.supabase.co/functions/v1", "não é url")).toBeNull();
  });
});

describe("painel — endereços para copiar", () => {
  const fields = { ...EMPTY_TRACKING_FIELDS, campaign: "feira-casa-cor", source: "qrcode", medium: "impresso", content: "stand" };

  it("base da função a partir da URL do projeto", () => {
    expect(pxBase("https://proj.supabase.co/")).toBe(BASE);
  });

  it("pixel exige a campanha; e=view para página externa; a função lê de volta os mesmos campos", () => {
    expect(buildPixelUrl(EMPTY_TRACKING_FIELDS, "open", BASE)).toBeNull();
    const open = buildPixelUrl(fields, "open", BASE)!;
    expect(open).toBe(`${BASE}?c=feira-casa-cor&s=qrcode&m=impresso&n=stand`);
    const view = buildPixelUrl(fields, "view", BASE)!;
    expect(new URL(view).searchParams.get("e")).toBe("view");
    expect(readTrackParams(new URL(view))).toEqual({ campaign: "feira-casa-cor", source: "qrcode", medium: "impresso", content: "stand", term: null });
    expect(buildPixelTag(open)).toBe(
      `<img src="${BASE}?c=feira-casa-cor&amp;s=qrcode&amp;m=impresso&amp;n=stand" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px" />`,
    );
  });

  it("link rastreado: destino permitido e campanha obrigatórios; a função aceita o que o painel gera", () => {
    const res = buildTrackedLink("https://bewild.com.br/orcamento", fields, BASE);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const url = new URL(res.url);
    expect(url.pathname).toBe("/functions/v1/px/go");
    expect(safeDestination(url.searchParams.get("u"))?.toString()).toBe("https://bewild.com.br/orcamento");
    expect(readTrackParams(url).campaign).toBe("feira-casa-cor");
    expect(buildTrackedLink("https://exemplo.com/", fields, BASE)).toMatchObject({ ok: false });
    expect(buildTrackedLink("https://bewild.com.br/", EMPTY_TRACKING_FIELDS, BASE)).toEqual({ ok: false, error: "Informe a campanha." });
  });

  it("aponta o campo com caractere inválido", () => {
    expect(invalidFields({ ...fields, content: "ana@exemplo.com" })).toEqual(["content"]);
    expect(invalidFields(fields)).toEqual([]);
  });
});
