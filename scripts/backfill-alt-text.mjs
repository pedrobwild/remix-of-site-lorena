/**
 * Backfill de alt text das imagens do portfólio (e demais páginas públicas).
 *
 * Para cada imagem hospedada no storage do projeto, pede a um modelo de visão
 * uma descrição objetiva em pt-BR (boas práticas de alt text: descreve o que
 * se vê, sem "imagem de", até ~125 caracteres) e grava em `image_alt_texts`.
 *
 * Uso: LOVABLE_API_KEY=... bun scripts/backfill-alt-text.mjs
 * Reexecutar é seguro: URLs já descritas são puladas.
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aamlnkmqvjcowixdgqii.supabase.co";
const ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const AI_KEY = process.env.LOVABLE_API_KEY;
const MODEL = "google/gemini-3.1-flash-lite";
const CONCURRENCY = Number(process.env.ALT_CONCURRENCY || 8);

if (!ANON || !AI_KEY) throw new Error("Faltam VITE_SUPABASE_PUBLISHABLE_KEY / LOVABLE_API_KEY");

const rest = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

async function fetchAll(path) {
  const out = [];
  const step = 1000;
  for (let from = 0; ; from += step) {
    const res = await rest(`${path}&limit=${step}&offset=${from}`);
    if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < step) break;
  }
  return out;
}

function ctxOf(p) {
  const bits = [p.title, p.neighborhood ? `${p.neighborhood}, São Paulo` : null, p.area_m2 ? `${p.area_m2} m²` : null]
    .filter(Boolean)
    .join(" — ");
  return bits;
}

const PROMPT = (ctx) =>
  `Você escreve alt text para um site de arquitetura e reforma de apartamentos em São Paulo.
Contexto do projeto (use só se for coerente com a imagem): ${ctx || "projeto residencial"}.
Analise a imagem e escreva UM alt text em português do Brasil que descreva objetivamente o que aparece: tipo de ambiente, mobiliário e elementos principais, materiais, cores e iluminação. Se for planta baixa, render 3D, foto de obra ou detalhe de marcenaria, diga isso.
Regras: no máximo 125 caracteres; não comece com "Imagem", "Foto" ou "Render de"; sem ponto final; sem aspas; não invente marcas nem nomes. Responda apenas com o alt text.`;

async function describe(url, ctx) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": AI_KEY },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT(ctx) },
              { type: "image_url", image_url: { url } },
            ],
          },
        ],
      }),
    });
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt + Math.random() * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content;
    const text = (typeof raw === "string" ? raw : (raw ?? []).map((p) => p?.text ?? "").join(" "))
      .replace(/\s+/g, " ")
      .replace(/^["'“”]+|["'“”.]+$/g, "")
      .trim();
    if (!text) return null;
    return text.length > 150 ? `${text.slice(0, 147).trimEnd()}...` : text;
  }
  throw new Error("AI indisponível após retentativas");
}

async function main() {
  const projects = await fetchAll("projects?select=id,title,slug,neighborhood,area_m2,cover_url,gallery_urls,ready_gallery_urls,before_image_url,after_image_url,ready_image_url&order=id");
  const done = new Set((await fetchAll("image_alt_texts?select=url&order=url")).map((r) => r.url));

  const jobs = [];
  const seen = new Set();
  for (const p of projects) {
    const ctx = ctxOf(p);
    const urls = [
      p.cover_url,
      p.before_image_url,
      p.after_image_url,
      p.ready_image_url,
      ...(p.gallery_urls || []),
      ...(p.ready_gallery_urls || []),
    ].filter((u) => typeof u === "string" && u.startsWith("http"));
    for (const url of urls) {
      if (seen.has(url) || done.has(url)) continue;
      seen.add(url);
      jobs.push({ url, ctx });
    }
  }

  console.log(`total a descrever: ${jobs.length} (já prontas: ${done.size})`);
  let ok = 0;
  let fail = 0;
  let i = 0;
  const buffer = [];

  async function flush() {
    if (!buffer.length) return;
    const batch = buffer.splice(0, buffer.length);
    const res = await rest("image_alt_texts?on_conflict=url", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(batch),
    });
    if (!res.ok) console.error("erro ao gravar:", res.status, (await res.text()).slice(0, 300));
  }

  async function worker() {
    while (i < jobs.length) {
      const job = jobs[i++];
      try {
        const alt = await describe(job.url, job.ctx);
        if (alt) {
          buffer.push({ url: job.url, alt, model: MODEL });
          ok++;
        } else fail++;
      } catch (err) {
        fail++;
        console.error("falhou", job.url, String(err).slice(0, 200));
      }
      if (buffer.length >= 25) await flush();
      if ((ok + fail) % 100 === 0) console.log(`progresso ${ok + fail}/${jobs.length} (ok ${ok}, falhas ${fail})`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await flush();
  console.log(`concluído: ok ${ok}, falhas ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
