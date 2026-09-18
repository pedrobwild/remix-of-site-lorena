export type SitemapSnapshot = {
  xml: string;
  urls: string[];
  total: number;
  projects: number;
  posts: number;
  pages: number;
  generatedAt: Date;
};

export function parseSitemapXml(xml: string, generatedAt = new Date()): SitemapSnapshot {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror") || document.documentElement.localName !== "urlset") {
    throw new Error("O arquivo recebido não é um sitemap XML válido.");
  }

  const urls = Array.from(document.getElementsByTagName("loc"))
    .map((node) => node.textContent?.trim() ?? "")
    .filter(Boolean);
  const uniqueUrls = [...new Set(urls)];

  if (uniqueUrls.length === 0) {
    throw new Error("O sitemap foi gerado sem nenhuma URL.");
  }
  if (uniqueUrls.length !== urls.length) {
    throw new Error("O sitemap contém URLs duplicadas.");
  }

  const projects = uniqueUrls.filter((url) => new URL(url).pathname.startsWith("/portfolio/")).length;
  const posts = uniqueUrls.filter((url) => new URL(url).pathname.startsWith("/conteudos/")).length;

  return {
    xml,
    urls: uniqueUrls,
    total: uniqueUrls.length,
    projects,
    posts,
    pages: uniqueUrls.length - projects - posts,
    generatedAt,
  };
}

export function downloadSitemap(snapshot: SitemapSnapshot) {
  const blob = new Blob([snapshot.xml], { type: "application/xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = "sitemap.xml";
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}