/** XML de imagens a partir dos artigos públicos no sitemap canônico, sem dados privados. */
import { JSDOM } from "jsdom";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const BLOG_ORIGIN = "https://bewild.com.br";
const escapeXml = (value) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] ?? c);

export function articleUrls(xml) {
  const dom = new JSDOM(xml, { contentType: "application/xml" });
  return [...new Set([...dom.window.document.getElementsByTagName("loc")].map((node) => node.textContent ?? "").filter((url) => url.startsWith(`${BLOG_ORIGIN}/conteudos/`)))].sort();
}

export function articleImages(html, articleUrl) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  if (doc.querySelector('meta[name="robots"]')?.getAttribute("content")?.includes("noindex")) return [];
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute("href");
  if (canonical && canonical !== articleUrl) return [];
  const article = doc.querySelector("article#main");
  if (!article) throw new Error(`Corpo do artigo ausente: ${articleUrl}`);
  const urls = new Set();
  const add = (value) => {
    if (!value) return;
    const url = new URL(value, articleUrl);
    if (url.protocol !== "https:" || url.username || url.password) return;
    url.hash = "";
    urls.add(url.href);
  };
  for (const img of article.querySelectorAll(".pt-body img, .pt-cover img")) add(img.getAttribute("src"));
  for (const source of article.querySelectorAll(".pt-body picture source")) {
    for (const candidate of (source.getAttribute("srcset") ?? "").split(",")) add(candidate.trim().split(/\s+/)[0]);
  }
  // Gráficos interativos mantêm o SVG original no link de download.
  for (const link of article.querySelectorAll('.pt-body a[href$=".svg"]')) add(link.getAttribute("href"));
  return [...urls].sort();
}

export function imageSitemap(entries) {
  const rows = entries.filter((entry) => entry.images.length).map(({ url, images }) => {
    if (images.length > 1000) throw new Error(`Mais de 1.000 imagens no artigo: ${url}`);
    return `  <url><loc>${escapeXml(url)}</loc>${[...new Set(images)].map((image) => `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`).join("")}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows.join("\n")}\n</urlset>\n`;
}

async function read(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`Falha ao ler ${url}: HTTP ${response.status}`);
  if (response.url !== url) throw new Error(`Endereço redirecionado: ${url}`);
  return response.text();
}

export async function generateBlogImageSitemap() {
  const urls = articleUrls(await read(`${BLOG_ORIGIN}/sitemap.xml`));
  if (!urls.length) throw new Error("Nenhum artigo público encontrado");
  const entries = [];
  for (const url of urls) entries.push({ url, images: articleImages(await read(url), url) });
  // Só grava depois de todas as leituras terminarem; falhas não deixam XML parcial.
  await writeFile("public/sitemap-imagens-blog.xml", imageSitemap(entries), "utf8");
  console.log(`${entries.length} artigos lidos; ${entries.filter((e) => e.images.length).length} com imagens; ${entries.reduce((n, e) => n + e.images.length, 0)} referências de imagens.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generateBlogImageSitemap();
}