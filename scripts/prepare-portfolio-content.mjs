/** Valida texto editorial revisado e gera SQL de dados sem acessar o banco. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    input: { type: "string" },
    source: { type: "string" },
    sql: { type: "string" },
    review: { type: "string" },
    report: { type: "string" },
    keywords: { type: "string" },
  },
});
if (!values.input || !values.source) {
  throw new Error(
    "Use --input textos.json --source cadastro.json [--sql lote.sql --review revisao.md --report validacao.json --keywords palavras-chave.csv]"
  );
}
const entries = JSON.parse(await readFile(values.input, "utf8"));
const source = JSON.parse(await readFile(values.source, "utf8"));
if (!Array.isArray(entries) || !entries.length || !Array.isArray(source)) {
  throw new Error("Os textos devem ser uma lista não vazia, e o cadastro deve ser uma lista.");
}
const bySlug = new Map(source.map((p) => [p.slug, p]));
const bodyFields = ["summary", "intro", "challenge", "solution", "result_text"];
const columns = [...bodyFields, "scope", "seo_title", "seo_description", "cover_alt"];
const ranges = {
  summary: [40, 70],
  intro: [80, 150],
  challenge: [40, 80],
  solution: [50, 100],
  result_text: [30, 60],
};
const errors = [],
  warnings = [],
  seen = new Set(),
  stats = [];
const words = (s) => s.trim().split(/\s+/).filter(Boolean);
const clean = (s) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
const grams = (s) => {
  const w = words(clean(s));
  return new Set(w.slice(0, -4).map((_, i) => w.slice(i, i + 5).join(" ")));
};
const paragraphs = new Map();
for (const entry of entries) {
  const initialErrors = errors.length;
  const p = bySlug.get(entry.slug);
  if (!p || seen.has(entry.slug)) {
    errors.push(`Slug ausente no cadastro ou repetido: ${entry.slug}`);
    continue;
  }
  seen.add(entry.slug);
  for (const field of columns) {
    if (field === "scope") continue;
    if (typeof entry[field] !== "string" || !entry[field].trim())
      errors.push(`${entry.slug}: ${field} vazio`);
  }
  if (errors.length > initialErrors) continue;
  const text = bodyFields.map((field) => entry[field]).join(" ");
  const publicText = columns
    .map((field) => (Array.isArray(entry[field]) ? entry[field].join(" ") : entry[field]))
    .join(" ");
  if (/R\$|\b(?:reais|BDI|markup)\b|São Paulo, São Paulo/i.test(publicText))
    errors.push(`${entry.slug}: dado financeiro ou duplicação de local`);
  if (/\b[A-ZÀ-Ú&0-9]{1,5}\s[-–—]\s/.test(publicText))
    errors.push(`${entry.slug}: possível código interno no texto público`);
  if (
    (p.status === "em_projeto" || p.status === "em_obra") &&
    /\b(?:entregue|entregues|reformado|reformada|concluída|concluído)\b/i.test(publicText)
  )
    errors.push(`${entry.slug}: obra ainda em fase descrita como concluída`);
  const areas = [...publicText.matchAll(/(\d+(?:[,.]\d+)?)\s*m²/g)].map((m) =>
    Number(m[1].replace(",", "."))
  );
  if (areas.some((area) => area !== p.area_m2))
    errors.push(`${entry.slug}: metragem sem respaldo no cadastro`);
  const count = words(text).length;
  const min = entry.pouca_variacao_visual ? 150 : 250;
  if (count < min || count > 450)
    errors.push(`${entry.slug}: corpo com ${count} palavras (alvo ${min}–450)`);
  for (const field of bodyFields) {
    const n = words(entry[field]).length;
    const [lo, hi] = ranges[field];
    if (n < lo || n > hi)
      warnings.push(`${entry.slug}: ${field} com ${n} palavras (referência ${lo}–${hi})`);
    for (const paragraph of entry[field].split(/\n\s*\n/)) {
      const key = clean(paragraph),
        prev = paragraphs.get(key);
      if (prev && prev !== entry.slug) errors.push(`${entry.slug}: parágrafo repetido de ${prev}`);
      paragraphs.set(key, entry.slug);
    }
  }
  for (const field of ["seo_title", "seo_description", "cover_alt"]) {
    const [lo, hi] =
      field === "seo_title" ? [1, 65] : field === "seo_description" ? [120, 158] : [80, 140];
    if (entry[field].length < lo || entry[field].length > hi)
      errors.push(
        `${entry.slug}: ${field} com ${entry[field].length} caracteres (alvo ${lo}–${hi})`
      );
  }
  if (
    !Array.isArray(entry.scope) ||
    entry.scope.length < 5 ||
    entry.scope.length > 8 ||
    entry.scope.some((item) => typeof item !== "string" || !item.trim())
  )
    errors.push(`${entry.slug}: escopo deve ter 5–8 itens`);
  if (!entry.notas_revisao) errors.push(`${entry.slug}: faltam notas para revisão humana`);
  stats.push({
    slug: entry.slug,
    body_words: count,
    field_words: Object.fromEntries(bodyFields.map((f) => [f, words(entry[f]).length])),
    title_chars: entry.seo_title.length,
    description_chars: entry.seo_description.length,
    cover_alt_chars: entry.cover_alt.length,
  });
}
const overlaps = [];
for (let i = 0; i < entries.length; i++)
  for (let j = i + 1; j < entries.length; j++) {
    const a = entries[i],
      b = entries[j];
    for (const f of ["seo_title", "seo_description", "scope"])
      if (JSON.stringify(a[f]) === JSON.stringify(b[f]))
        errors.push(`${a.slug} / ${b.slug}: ${f} idêntico`);
    const ga = grams(bodyFields.map((f) => a[f] || "").join(" ")),
      gb = grams(bodyFields.map((f) => b[f] || "").join(" "));
    const common = [...ga].filter((g) => gb.has(g)).length;
    // Sobreposição relativa ao menor texto: mais conservadora que Jaccard.
    const ratio = common / Math.max(1, Math.min(ga.size, gb.size));
    overlaps.push({ a: a.slug, b: b.slug, overlap_5grams: Number(ratio.toFixed(4)) });
    if (ratio > 0.3)
      errors.push(`${a.slug} / ${b.slug}: sobreposição ${(ratio * 100).toFixed(1)}%`);
  }
const report = {
  projects: entries.length,
  errors,
  warnings,
  stats,
  largest_overlaps: overlaps.sort((a, b) => b.overlap_5grams - a.overlap_5grams).slice(0, 10),
};
async function save(path, text) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text);
}
if (values.report) await save(values.report, JSON.stringify(report, null, 2) + "\n");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const literal = (v) =>
    v == null
      ? "NULL"
      : Array.isArray(v)
        ? `ARRAY[${v.map(literal).join(", ")}]::text[]`
        : `'${String(v).replaceAll("'", "''")}'`;
  if (values.sql) {
    const updates = entries.map((e) => {
      const old = bySlug.get(e.slug);
      const evidenceFields = [
        "title",
        "neighborhood",
        "location",
        "area_m2",
        "project_type",
        "cover_url",
        "gallery_urls",
        "ready_gallery_urls",
      ];
      const guards = [...columns, ...evidenceFields]
        .map((field) => `    AND ${field} IS NOT DISTINCT FROM ${literal(old[field])}`)
        .join("\n");
      return `  UPDATE public.projects\n  SET ${columns.map((field) => `${field} = ${literal(e[field])}`).join(",\n      ")}\n  WHERE slug = ${literal(e.slug)}\n    AND id = ${literal(old.id)}::uuid\n    AND status IS NOT DISTINCT FROM ${literal(old.status)}\n${guards};\n  GET DIAGNOSTICS affected = ROW_COUNT;\n  IF affected <> 1 THEN\n    RAISE EXCEPTION 'Cadastro alterado ou slug ausente: %; revise antes de aplicar', ${literal(e.slug)};\n  END IF;`;
    });
    await save(
      values.sql,
      `-- PILOTO PARA REVISÃO DE PEDRO. NÃO APLICADO AO BANCO.\n-- Aplicar somente após aprovação editorial e publicação coordenada por Matheus.\n-- Atualiza apenas os nove campos editoriais; aborta se os textos ou suas evidências divergirem do snapshot fornecido.\nBEGIN;\nDO $portfolio_pilot$\nDECLARE affected integer;\nBEGIN\n${updates.join("\n\n")}\nEND;\n$portfolio_pilot$;\nCOMMIT;\n`
    );
  }
  if (values.review) {
    const blocks = entries.map((e) => {
      const p = bySlug.get(e.slug),
        phases =
          p.status === "em_projeto"
            ? "Em projeto, apenas renders 3D"
            : p.status === "em_obra"
              ? "Em obra"
              : p.ready_gallery_urls?.length
                ? "Obra fotografada, com renders separados"
                : "Galeria 3D, sem prova fotográfica da entrega";
      const cover =
        p.cover_url?.replace("/object/public/", "/render/image/public/") +
        "?width=680&quality=70&resize=contain";
      return `## ${e.seo_title.replace(/ \| Bewild$/, "")}\n\n[Ver página atual](https://bewild.com.br/portfolio/${e.slug}) · ${phases}\n\n![${e.cover_alt}](${cover})\n\n**Abertura**\n\n${e.summary}\n\n**Arquitetura e interiores**\n\n${e.intro}\n\n**Desafio**\n\n${e.challenge}\n\n**Solução**\n\n${e.solution}\n\n**Resultado${p.status === "em_projeto" ? " proposto" : ""}**\n\n${e.result_text}\n\n**Escopo visual**\n\n${e.scope.map((s) => `- ${s}`).join("\n")}\n\n**Descrição para busca:** ${e.seo_description}\n\n**Alt da capa:** ${e.cover_alt}\n\n**Revisão:** ${e.notas_revisao}\n\n**Palavras-chave sugeridas:** ${(e.palavras_chave || []).join("; ")}\n`;
    });
    await save(
      values.review,
      `# Bewild: piloto editorial do portfólio\n\nPreparado em 30/09/2026. ${entries.length} projetos para revisão de Pedro; os textos ainda não foram publicados. Bairro e área somente quando constam no cadastro. Materiais são descritos pela aparência quando a especificação não está confirmada.\n\n${blocks.join("\n---\n\n")}\n`
    );
  }
  if (values.keywords) {
    const csv = (v) => `"${String(v).replaceAll('"', '""')}"`;
    const rows = entries.flatMap((e) =>
      (e.palavras_chave || []).map((k) => [
        e.slug,
        k,
        "Sugestão editorial; validar no Google Ads",
        "Frase / exata",
        `https://bewild.com.br/portfolio/${e.slug}`,
      ])
    );
    await save(
      values.keywords,
      [
        ["slug", "palavra_chave", "origem", "correspondencia_sugerida", "pagina"]
          .map(csv)
          .join(","),
        ...rows.map((r) => r.map(csv).join(",")),
      ].join("\n") + "\n"
    );
  }
  console.log(
    JSON.stringify(
      {
        projects: entries.length,
        valid: true,
        warnings,
        max_overlap_5grams: report.largest_overlaps[0]?.overlap_5grams ?? 0,
        body_words_range: [
          Math.min(...stats.map((s) => s.body_words)),
          Math.max(...stats.map((s) => s.body_words)),
        ],
      },
      null,
      2
    )
  );
}
