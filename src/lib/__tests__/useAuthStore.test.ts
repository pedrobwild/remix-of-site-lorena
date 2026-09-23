import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AuthCallback = (event: string, session: unknown) => void;

const h = vi.hoisted(() => {
  const state = {
    authCallback: null as AuthCallback | null,
    initialSession: null as unknown,
    adminQueries: 0,
    adminResponse: (): Promise<{ data: unknown; error: unknown }> =>
      Promise.resolve({ data: { user_id: "u-1" }, error: null }),
  };
  return { state };
});

vi.mock("@/integrations/supabase/client", () => {
  const builder = () => {
    const q = {
      select: () => q,
      eq: () => q,
      maybeSingle: () => {
        h.state.adminQueries += 1;
        return h.state.adminResponse();
      },
    };
    return q;
  };
  return {
    supabase: {
      from: () => builder(),
      auth: {
        onAuthStateChange: (cb: AuthCallback) => {
          h.state.authCallback = cb;
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        getSession: () => Promise.resolve({ data: { session: h.state.initialSession } }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
      },
    },
  };
});

import { __resetAuthStoreForTests, useAuth } from "@/lib/useAuth";

const session = (id: string) => ({ user: { id, email: `${id}@bewild.com.br` }, access_token: "t" });

beforeEach(() => {
  __resetAuthStoreForTests();
  h.state.authCallback = null;
  h.state.initialSession = session("u-1");
  h.state.adminQueries = 0;
  h.state.adminResponse = () => Promise.resolve({ data: { user_id: "u-1" }, error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAuth (store único)", () => {
  it("várias instâncias fazem UMA consulta a admin_users", async () => {
    const a = renderHook(() => useAuth());
    const b = renderHook(() => useAuth());
    const c = renderHook(() => useAuth());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    expect(a.result.current.isAdmin).toBe(true);
    expect(b.result.current.isAdmin).toBe(true);
    expect(c.result.current.isAdmin).toBe(true);
    expect(h.state.adminQueries).toBe(1);
  });

  it("SIGNED_IN ao voltar o foco e TOKEN_REFRESHED não refazem a verificação", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    act(() => {
      h.state.authCallback?.("SIGNED_IN", session("u-1"));
      h.state.authCallback?.("TOKEN_REFRESHED", session("u-1"));
      h.state.authCallback?.("SIGNED_IN", session("u-1"));
    });
    expect(h.state.adminQueries).toBe(1);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("rede instável depois da confirmação NÃO rebaixa o admin (editor aberto continua)", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    // A partir daqui qualquer consulta falharia — e o foco na aba não consulta.
    h.state.adminResponse = () => Promise.resolve({ data: null, error: { message: "Failed to fetch" } });
    act(() => {
      h.state.authCallback?.("SIGNED_IN", session("u-1"));
    });
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.adminError).toBeNull();
  });

  it("primeira verificação com erro expõe adminError (não 'sem permissão') e tenta de novo", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let fail = true;
    h.state.adminResponse = () =>
      Promise.resolve(
        fail
          ? { data: null, error: { message: "Failed to fetch" } }
          : { data: { user_id: "u-1" }, error: null },
      );
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.adminError).toBe("Failed to fetch"));
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.loading).toBe(false);

    fail = false;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_100);
    });
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    expect(result.current.adminError).toBeNull();
    expect(h.state.adminQueries).toBe(2);
  });

  it("troca de usuário refaz a verificação; logout limpa", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    h.state.adminResponse = () => Promise.resolve({ data: null, error: null });
    act(() => {
      h.state.authCallback?.("SIGNED_IN", session("u-2"));
    });
    await waitFor(() => expect(result.current.user?.id).toBe("u-2"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
    expect(h.state.adminQueries).toBe(2);

    act(() => {
      h.state.authCallback?.("SIGNED_OUT", null);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });
});
