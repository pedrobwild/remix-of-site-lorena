/**
 * Utilitários de navegador do guia com tratamento de falha: área de
 * transferência, ids aleatórios e armazenamento local. Nenhuma função aqui
 * lança exceção — navegador antigo, aba privada ou permissão negada viram
 * um retorno "falhou" que a interface pode mostrar.
 */

/**
 * Copia texto para a área de transferência. Devolve `true` só quando a cópia
 * de fato aconteceu (a UI só deve mostrar "Copiado!" nesse caso).
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* permissão negada, contexto inseguro ou iframe: tenta o caminho antigo */
  }
  try {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.top = "0";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    const ok = document.execCommand("copy");
    campo.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Id aleatório. `crypto.randomUUID` só existe no Safari ≥ 15.4 e em contexto
 * seguro; sem ele, monta um UUID v4 com `getRandomValues` (ou, em último
 * caso, com tempo + Math.random — suficiente para chave de lista local).
 */
export function gerarId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") {
    try {
      return c.randomUUID();
    } catch {
      /* contexto inseguro em alguns navegadores */
    }
  }
  if (c && typeof c.getRandomValues === "function") {
    const b = c.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type Area = "local" | "session";

function area(tipo: Area): Storage | null {
  try {
    // O simples acesso a window.localStorage lança SecurityError com cookies bloqueados.
    return tipo === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Lê e valida um JSON salvo. Qualquer falha (sem storage, JSON inválido, formato errado) → null. */
export function lerJSON<T>(tipo: Area, chave: string, validar: (v: unknown) => v is T): T | null {
  try {
    const bruto = area(tipo)?.getItem(chave);
    if (!bruto) return null;
    const valor: unknown = JSON.parse(bruto);
    return validar(valor) ? valor : null;
  } catch {
    return null;
  }
}

/** Grava um JSON. Devolve false se o navegador recusar (cota, aba privada, bloqueio). */
export function gravarJSON(tipo: Area, chave: string, valor: unknown): boolean {
  try {
    const s = area(tipo);
    if (!s) return false;
    s.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}
