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

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

const devWarn = vi.fn();
vi.mock("@/lib/devLog", () => ({
  devWarn: (...args: unknown[]) => devWarn(...args),
  devLog: vi.fn(),
}));

import { DEFAULT_404_REASON, logNotFound } from "../notFoundLog";

beforeEach(() => {
  rpc.mockReset();
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
