/** Âncoras geradas somente depois da sanitização, sem DOM e com saída igual no servidor e cliente. */
export function addHeadingIds(html: string): string {
  const heading = /<h([23])\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/h\1\s*>/gi;
  const attribute = /\s+([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  const existingId = (attrs: string): string | undefined => {
    for (const match of attrs.matchAll(attribute)) {
      if (match[1].toLowerCase() === "id") return match[2] ?? match[3] ?? match[4] ?? "";
    }
    return undefined;
  };
  const used = new Set<string>();
  for (const match of html.matchAll(heading)) {
    const id = existingId(match[2]);
    if (id !== undefined) used.add(id);
  }
  return html.replace(heading, (tag, _level: string, attrs: string, inner: string) => {
    if (existingId(attrs) !== undefined) return tag;
    const entities: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };
    const base = inner
      .replace(/<(?:"[^"]*"|'[^']*'|[^'">])*>/g, "")
      .replace(/&amp;|&quot;|&#39;|&lt;|&gt;/g, (entity) => entities[entity])
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "");
    if (!base) return tag;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    // Insere só o atributo; mantém tags, atributos e conteúdo literais.
    const opening = tag.match(/^<h[23]\b(?:"[^"]*"|'[^']*'|[^'">])*>/i)?.[0];
    if (!opening) return tag;
    return `${opening.slice(0, -1)} id="${id}">${tag.slice(opening.length)}`;
  });
}