/**
 * Estado de autenticação do painel — um store único por aba.
 *
 * Por que um store de módulo e não um estado por componente:
 * - `ProtectedRoute`, o shell do painel e as páginas chamavam `useAuth()` e
 *   cada instância consultava `admin_users` — 2–3 consultas iguais a cada
 *   troca de página e a cada foco na aba.
 * - No supabase-js v2, `SIGNED_IN` dispara de novo toda vez que a aba volta
 *   ao foco e `TOKEN_REFRESHED` a cada hora. A verificação de admin rodava de
 *   novo nesses eventos e, se a consulta falhasse (rede instável), virava
 *   "não é admin": o ProtectedRoute trocava o editor aberto pela tela "sem
 *   permissão" e o que estava sendo digitado se perdia.
 *
 * Regras:
 * - A verificação de admin só roda quando o USUÁRIO muda (id diferente).
 * - Resultado confirmado fica em cache por id; consultas simultâneas são
 *   deduplicadas.
 * - Erro na consulta NÃO rebaixa ninguém: mantém o último valor conhecido e
 *   tenta de novo com backoff. Sem valor conhecido, expõe `adminError`.
 */
import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthSnapshot = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  /** `true` até sabermos a sessão E (havendo usuário) o status de admin. */
  loading: boolean;
  /** Falha ao verificar o acesso quando ainda não há resultado conhecido. */
  adminError: string | null;
};

const INITIAL: AuthSnapshot = {
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  adminError: null,
};

let snapshot: AuthSnapshot = INITIAL;
const listeners = new Set<() => void>();
let started = false;

/** Resultado confirmado da verificação de admin, por id de usuário. */
const adminCache = new Map<string, boolean>();
/** Verificações em andamento, por id de usuário (deduplicação). */
const inflight = new Map<string, Promise<AdminCheckResult>>();
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;
const RETRY_MAX_ATTEMPTS = 8;

export type AdminCheckResult = { isAdmin: boolean; error: null } | { isAdmin: null; error: string };

function setSnapshot(patch: Partial<AuthSnapshot>) {
  const next = { ...snapshot, ...patch };
  const changed = (Object.keys(next) as (keyof AuthSnapshot)[]).some((k) => next[k] !== snapshot[k]);
  if (!changed) return;
  snapshot = next;
  listeners.forEach((l) => l());
}

function clearRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  retryAttempt = 0;
}

/**
 * Consulta `admin_users` para o usuário (deduplicada e com cache). Não mexe
 * no snapshot — quem decide o que fazer com erro é `applySession`.
 */
export function checkAdminStatus(userId: string, { force = false } = {}): Promise<AdminCheckResult> {
  if (!force && adminCache.has(userId)) {
    return Promise.resolve({ isAdmin: adminCache.get(userId) as boolean, error: null });
  }
  const running = inflight.get(userId);
  if (running) return running;

  const p = (async (): Promise<AdminCheckResult> => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return { isAdmin: null, error: error.message || "Falha ao verificar o acesso." };
      const isAdmin = !!data;
      adminCache.set(userId, isAdmin);
      return { isAdmin, error: null };
    } catch (e) {
      return { isAdmin: null, error: e instanceof Error ? e.message : String(e) };
    } finally {
      inflight.delete(userId);
    }
  })();
  inflight.set(userId, p);
  return p;
}

async function verifyCurrentUser(userId: string) {
  const result = await checkAdminStatus(userId);
  // O usuário pode ter mudado enquanto a consulta rodava.
  if (snapshot.user?.id !== userId) return;

  if (result.error === null) {
    clearRetry();
    setSnapshot({ isAdmin: result.isAdmin, loading: false, adminError: null });
    return;
  }

  // Erro: mantém o último valor conhecido para este usuário (não rebaixa).
  const known = adminCache.get(userId);
  setSnapshot({
    isAdmin: known ?? snapshot.isAdmin,
    loading: false,
    adminError: known === undefined ? result.error : null,
  });
  scheduleRetry(userId);
}

function scheduleRetry(userId: string) {
  if (retryTimer || retryAttempt >= RETRY_MAX_ATTEMPTS) return;
  const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** retryAttempt);
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (snapshot.user?.id === userId) void verifyCurrentUser(userId);
  }, delay);
}

function applySession(session: Session | null) {
  const user = session?.user ?? null;
  const prevId = snapshot.user?.id ?? null;

  if (!user) {
    clearRetry();
    adminCache.clear();
    setSnapshot({ user: null, session: null, isAdmin: false, loading: false, adminError: null });
    return;
  }

  if (user.id === prevId && !snapshot.loading) {
    // Mesmo usuário (foco na aba, refresh de token): só atualiza a sessão.
    setSnapshot({ session, user });
    return;
  }

  if (user.id !== prevId) clearRetry();
  const known = adminCache.get(user.id);
  if (known !== undefined) {
    setSnapshot({ session, user, isAdmin: known, loading: false, adminError: null });
    return;
  }
  setSnapshot({ session, user, isAdmin: false, loading: true, adminError: null });
  void verifyCurrentUser(user.id);
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  // Listener do ciclo de vida da aba inteira (não é desinscrito).
  supabase.auth.onAuthStateChange((_event, session) => {
    applySession(session);
  });
  supabase.auth
    .getSession()
    .then(({ data }) => applySession(data.session))
    .catch(() => {
      if (snapshot.loading && !snapshot.user) setSnapshot({ loading: false });
    });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

/** Tenta de novo a verificação de acesso agora (botão "tentar de novo"). */
export function retryAdminCheck() {
  const id = snapshot.user?.id;
  if (!id) return;
  clearRetry();
  setSnapshot({ loading: true, adminError: null });
  void verifyCurrentUser(id);
}

async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

async function signOut() {
  clearRetry();
  const { error } = await supabase.auth.signOut();
  // Mesmo com erro de rede o token local é descartado; garante o estado.
  applySession(null);
  return { error };
}

export function useAuth() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...state, signIn, signOut, retryAdminCheck };
}

/** Só para testes: volta o store ao estado inicial. */
export function __resetAuthStoreForTests() {
  clearRetry();
  adminCache.clear();
  inflight.clear();
  listeners.clear();
  snapshot = INITIAL;
  started = false;
}
