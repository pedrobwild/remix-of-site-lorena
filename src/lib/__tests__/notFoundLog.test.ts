/**
 * DB-01 — a chamada de `log_404` precisa casar com UMA sobrecarga só.
 *
 * Produção tem `log_404(p_path, p_referrer)` e
 * `log_404(p_path, p_referrer, p_reason)`, ambas com DEFAULT. Enviar só
 * `{p_path, p_referrer}` é ambíguo para o PostgREST (PGRST203) e nada é
 * gravado — `seo_404_log` está em 0 linhas desde sempre. Estes testes travam
 * o contrato do cliente: sempre mandar `p_reason`, e sempre ler o `error`
 * (supabase-js não lança, então o try/catch sozinho não protege nada).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const selectMaybeSingle = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle: () => selectMaybeSingle() }) }),
      }),
    }),
  },
}));

const devWarn = vi.fn();
vi.mock("@/lib/devLog", () => ({
  devWarn: (...args: unknown[]) => devWarn(...args),
  devLog: vi.fn(),
}));

import { DEFAULT_404_REASON, logNotFound, lookupActiveRedirect, safeRedirectTarget } from "../notFoundLog";

beforeEach(() => {
  rpc.mockReset();
  selectMaybeSingle.mockReset();
  devWarn.mockReset();
  sessionStorage.clear();
  rpc.mockResolvedValue({ data: null, error: null });
});

describe("logNotFound", () => {
  it("envia p_reason para casar só com a sobrecarga de 3 argumentos", async () => {
    await logNotFound("/rota-que-nao-existe", "https://google.com/");

    expect(rpc).toHaveBeenCalledTimes(1);
    const [fn, args] = rpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(fn).toBe("log_404");
    expect(Object.keys(args).sort()).toEqual(["p_path", "p_reason", "p_referrer"]);
    expect(args.p_reason).toBe(DEFAULT_404_REASON);
  });

  it("manda p_referrer string vazia (e não undefined) quando não há referrer", async () => {
    await logNotFound("/outra-rota");

    const [, args] = rpc.mock.calls[0] as [string, Record<string, unknown>];
    // `undefined` sumiria no JSON.stringify e mudaria a assinatura enviada.
    expect(args).toHaveProperty("p_referrer", "");
    expect(JSON.parse(JSON.stringify(args))).toHaveProperty("p_referrer", "");
  });

  it("avisa quando a RPC responde erro — supabase-js não lança", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "PGRST203", message: "Could not choose the best candidate function" },
    });

    await logNotFound("/rota-com-erro");

    expect(devWarn).toHaveBeenCalledWith(
      "[notFoundLog] log_404 respondeu erro:",
      expect.objectContaining({ code: "PGRST203" }),
    );
  });

  it("não registra a home nem repete o mesmo path na mesma sessão", async () => {
    await logNotFound("/");
    expect(rpc).not.toHaveBeenCalled();

    await logNotFound("/repetida");
    await logNotFound("/repetida");
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});

/**
 * ADM-04 — redirecionamentos do admin (/admin/seo/404) precisam funcionar para
 * o visitante anônimo, que não tem SELECT em `seo_404_log`: a leitura passa
 * pela RPC SECURITY DEFINER `resolve_404_redirect`, com fallback para a
 * leitura direta enquanto a migração não chega. Só destino interno.
 */
describe("lookupActiveRedirect", () => {
  it("usa a RPC resolve_404_redirect e devolve o caminho interno", async () => {
    rpc.mockResolvedValue({ data: "/conteudos/novo-slug", error: null });
    await expect(lookupActiveRedirect("/post-antigo")).resolves.toBe("/conteudos/novo-slug");
    expect(rpc).toHaveBeenCalledWith("resolve_404_redirect", { p_path: "/post-antigo" });
    expect(selectMaybeSingle).not.toHaveBeenCalled();
  });

  it("RPC sem redirecionamento (null) → null, sem cair no fallback", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(lookupActiveRedirect("/x")).resolves.toBeNull();
    expect(selectMaybeSingle).not.toHaveBeenCalled();
  });

  it.each(["PGRST202", "42883"])("RPC ainda inexistente (%s) → leitura direta", async (code) => {
    rpc.mockResolvedValue({ data: null, error: { code, message: "function not found" } });
    selectMaybeSingle.mockResolvedValue({ data: { redirect_to: "/portfolio", status: "redirect" }, error: null });
    await expect(lookupActiveRedirect("/obras")).resolves.toBe("/portfolio");
    expect(selectMaybeSingle).toHaveBeenCalledTimes(1);
  });

  it("outro erro da RPC → null (sem fallback, sem lançar)", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "500", message: "boom" } });
    await expect(lookupActiveRedirect("/x")).resolves.toBeNull();
    expect(selectMaybeSingle).not.toHaveBeenCalled();
  });

  it("destino externo vindo do banco é recusado (open redirect)", async () => {
    rpc.mockResolvedValue({ data: "//evil.example/phish", error: null });
    await expect(lookupActiveRedirect("/x")).resolves.toBeNull();
  });
});

describe("safeRedirectTarget", () => {
  it.each([
    ["/portfolio", "/portfolio"],
    ["  /conteudos/a?x=1#faq ", "/conteudos/a?x=1#faq"],
    ["https://bewild.com.br/faq?x=1", "/faq?x=1"],
    ["https://www.bewild.com.br/contato", "/contato"],
  ])("aceita %j → %j", (raw, out) => {
    expect(safeRedirectTarget(raw)).toBe(out);
  });

  it.each([
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/x",
    "javascript:alert(1)",
    "portfolio",
    "/a\nb",
    "/a b",
    "",
    null,
    42,
  ])("recusa %j", (raw) => {
    expect(safeRedirectTarget(raw)).toBeNull();
  });

  it("recusa redirecionar para o próprio caminho (laço)", () => {
    expect(safeRedirectTarget("/obras/", "/obras")).toBeNull();
  });
});
