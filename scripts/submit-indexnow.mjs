// Envia as URLs do sitemap ao IndexNow (Bing, Yandex etc.).
// A chave precisa estar acessível em https://bewild.com.br/<KEY>.txt (arquivo em public/).
// Uso: node scripts/submit-indexnow.mjs   (ou: bun scripts/submit-indexnow.mjs)
//
// Sai com código ≠ 0 se o IndexNow recusar o envio — assim uma chave inválida
// (403), payload rejeitado (400/422) ou limite de taxa (429) não passa como
// "enviado" num log de CI.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const HOST = "bewild.com.br";
const KEY = "e335044b65f693784a464fb36d9557af";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
/** Limite do protocolo por requisição. */
const MAX_URLS = 10_000;

const MOTIVOS = {
  400: "requisição inválida (formato)",
  403: "chave não encontrada ou inválida em " + KEY_LOCATION,
  422: "URLs não pertencem ao host ou a chave não confere",
  429: "muitas requisições (limite de taxa) — tente mais tarde",
};

const xml = readFileSync(resolve("public/sitemap.xml"), "utf8");
const urlList = [...new Set([...xml.matchAll(/<loc>(https:\/\/bewild\.com\.br[^<]*)<\/loc>/g)].map((m) => m[1]))];

if (urlList.length === 0) {
  console.error("Nenhuma URL encontrada no sitemap.");
  process.exit(1);
}
if (urlList.length > MAX_URLS) {
  console.error(`Sitemap com ${urlList.length} URLs: acima do limite de ${MAX_URLS} por envio do IndexNow.`);
  process.exit(1);
}

let res;
try {
  res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
    signal: AbortSignal.timeout(30_000),
  });
} catch (err) {
  console.error(`IndexNow: falha de rede — ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

if (!res.ok) {
  const corpo = (await res.text().catch(() => "")).slice(0, 300);
  console.error(`IndexNow: HTTP ${res.status} — ${MOTIVOS[res.status] ?? "erro inesperado"}${corpo ? `\n${corpo}` : ""}`);
  process.exit(1);
}

// 200 = aceito; 202 = aceito, chave ainda em validação.
console.log(`IndexNow: HTTP ${res.status} — ${urlList.length} URLs enviadas`);
