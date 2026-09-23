/**
 * Regras de SEO específicas dos posts (/conteudos/:slug), aplicadas pelo
 * plano "Blog Bewild: SEO + IA" (21/09/2026):
 *
 *  - autor como Person no JSON-LD quando o post é assinado por uma pessoa
 *    (nome, cargo e registro profissional quando conhecidos), e Organization
 *    quando assina "Equipe Bewild";
 *  - datePublished/dateModified reais (updated_at do banco), com a linha
 *    "Atualizado em" visível só quando houve alteração depois da publicação;
 *  - título de fallback derivado do slug enquanto o banco não responde
 *    (achado SEO-14: o snapshot do Googlebot via "Carregando | Bewild" sem H1).
 *
 * Os dados dos autores vêm da fonte oficial do site (rodapé: "RESP. TÉCNICO ·
 * THIAGO DANTAS DO AMOR · CAU A162437-7", docs/internal/gpt-knowledge/03).
 * Nomes sem registro conhecido viram Person só com o nome. Nada é inventado.
 */

export type PostAuthor = {
  name: string;
  jobTitle?: string;
  /** Registro profissional público (ex.: CAU). */
  credential?: string;
};

const ORG_NAME = "Bewild";
const BASE_URL = "https://bewild.com.br";

const KNOWN_AUTHORS: PostAuthor[] = [
  {
    name: "Thiago Dantas do Amor",
    jobTitle: "Arquiteto e urbanista, responsável técnico da Bewild",
    credential: "CAU A162437-7",
  },
];

/** Assinaturas que significam "a empresa assina", não uma pessoa. */
const TEAM_SIGNATURES = new Set(["", "bewild", "equipe bewild", "time bewild"]);

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Resolve o texto livre do campo "Autor" do admin. Devolve `null` quando a
 * organização assina; um autor conhecido quando o nome bate (aceita a forma
 * curta "Thiago Dantas"); senão, Person só com o nome digitado.
 */
export function resolvePostAuthor(author: string | null | undefined): PostAuthor | null {
  const raw = (author ?? "").trim();
  const key = norm(raw);
  if (TEAM_SIGNATURES.has(key)) return null;
  const words = key.split(" ").length;
  const known = KNOWN_AUTHORS.find((k) => {
    const kn = norm(k.name);
    return kn === key || (words >= 2 && kn.startsWith(key + " "));
  });
  return known ?? { name: raw };
}

export function postAuthorJsonLd(author: string | null | undefined): Record<string, unknown> {
  const org = { "@type": "Organization", name: ORG_NAME, url: `${BASE_URL}/` };
  const person = resolvePostAuthor(author);
  if (!person) return org;
  return {
    "@type": "Person",
    name: person.name,
    ...(person.jobTitle ? { jobTitle: person.jobTitle } : {}),
    ...(person.credential ? { identifier: person.credential } : {}),
    worksFor: org,
  };
}

/** Linha de assinatura visível: "Thiago Dantas do Amor · CAU A162437-7" ou "Equipe Bewild". */
export function postAuthorByline(author: string | null | undefined): string {
  const person = resolvePostAuthor(author);
  if (!person) return "Equipe Bewild";
  return person.credential ? `${person.name} · ${person.credential}` : person.name;
}

/**
 * Título legível a partir do slug, para o `<title>` e o H1 enquanto o post
 * não chegou do banco. "quanto-custa-reformar-studio" → "Quanto custa reformar studio".
 */
export function postTitleFromSlug(slug: string | null | undefined): string {
  const words = (slug ?? "")
    .split("-")
    .map((w) => w.trim())
    .filter(Boolean);
  if (words.length === 0) return "Conteúdo";
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type PostDates = {
  /** ISO da publicação (published_at, senão created_at). */
  published: string | null;
  /** ISO da última alteração: updated_at quando é posterior à publicação. */
  modified: string | null;
  /** true quando o dia de `modified` é posterior ao dia de `published` (dias em São Paulo). */
  showUpdated: boolean;
};

/** Fuso da operação: é nele que "a data do post" é lida, para qualquer visitante. */
export const BEWILD_TIME_ZONE = "America/Sao_Paulo";

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Meia-noite UTC exata (`2026-09-22T00:00:00+00:00`): data gravada sem hora. */
const MIDNIGHT_UTC_RE = /^(\d{4})-(\d{2})-(\d{2})[T ]00:00(?::00(?:\.0+)?)?(?:Z|[+-]00(?::?00)?)$/i;

let spDayFormat: Intl.DateTimeFormat | null = null;

/**
 * Dia civil (`YYYY-MM-DD`) de uma data do banco, lido em São Paulo.
 *
 * - Data sem hora (`2026-09-22`) e meia-noite UTC exata — o que o Postgres
 *   devolve quando alguém grava só a data num timestamptz — são datas de
 *   calendário: valem como estão. Convertidas de fuso, viravam "21 set" no
 *   Brasil (UTC−3).
 * - Timestamps reais (`new Date().toISOString()` do admin) são convertidos
 *   para o dia em São Paulo, igual para todo visitante (antes: fuso do
 *   navegador na tela, dia UTC na comparação de "Atualizado em").
 */
export function bewildCalendarDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const s = iso.trim();
  const m = s.match(DATE_ONLY_RE) ?? s.match(MIDNIGHT_UTC_RE);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  spDayFormat ??= new Intl.DateTimeFormat("en-US", {
    timeZone: BEWILD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(spDayFormat.formatToParts(d).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const day = bewildCalendarDay;

export function postDates(
  post: { published_at?: string | null; created_at?: string | null; updated_at?: string | null } | null | undefined,
): PostDates {
  if (!post) return { published: null, modified: null, showUpdated: false };
  const published = post.published_at ?? post.created_at ?? null;
  const updated = post.updated_at ?? null;
  const later = !!(published && updated && Date.parse(updated) > Date.parse(published));
  const modified = later ? updated : published;
  const showUpdated = later && day(updated) !== day(published);
  return { published, modified, showUpdated };
}
