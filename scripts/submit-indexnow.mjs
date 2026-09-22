// Envia as URLs do sitemap ao IndexNow (Bing, Yandex etc.).
// A chave precisa estar acessível em https://bewild.com.br/<KEY>.txt (arquivo em public/).
// Uso: bun scripts/submit-indexnow.mjs

import { readFileSync } from "fs"
import { resolve } from "path"

const HOST = "bewild.com.br"
const KEY = "e335044b65f693784a464fb36d9557af"
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`

const xml = readFileSync(resolve("public/sitemap.xml"), "utf8")
const urlList = [...xml.matchAll(/<loc>(https:\/\/bewild\.com\.br[^<]*)<\/loc>/g)].map((m) => m[1])

if (urlList.length === 0) {
  console.error("Nenhuma URL encontrada no sitemap.")
  process.exit(1)
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
})

console.log(`IndexNow: HTTP ${res.status} — ${urlList.length} URLs enviadas`)
