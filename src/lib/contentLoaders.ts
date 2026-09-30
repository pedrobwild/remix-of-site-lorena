/**
 * Loaders de CONTEÚDO das rotas públicas: buscam no servidor (SSR) os dados
 * completos que as páginas antes só carregavam no cliente, para o HTML bruto
 * já trazer o texto e os links (Bing e robôs de IA não executam JS).
 *
 * Cada loader devolve `{ seo, ...dados }`. Falha de rede nunca derruba a
 * página: os dados voltam `null` e o hook da página busca no cliente como
 * antes. Quando o banco confirma que NÃO existe, o loader segue o
 * redirecionamento ativo (`seo_404_log`) com 301 ou lança `notFound()` para o
 * servidor responder 404 de verdade (a página de 404 registra no cliente).
 */
import { marked } from "marked";
import { notFound, redirect } from "@tanstack/react-router";
import { lookupActiveRedirect } from "@/lib/notFoundLog";
import { isSafeRedirectTarget } from "@/lib/seoRedirects";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeBlogHtml } from "@/lib/sanitizeHtml";
import { NOT_FOUND_SEO, postSeoFrom, projectSeoFrom, bairroSeoFrom, type RouteSeoData } from "@/lib/seoLoaders";
import { normalizeBewildPost, type BewildPost } from "@/lib/useBewildPosts";
import { POST_SELECT_COLS } from "@/lib/useBewildPost";
import { PROJECT_COLUMNS, type BewildProjectFull } from "@/lib/useBewildProject";
import { PROJECTS_LIST_COLUMNS, type BewildProject } from "@/lib/useBewildProjects";
import { PEER_COLUMNS } from "@/lib/useProjectSeoPeers";
import type { ProjectSeoPeer } from "@/lib/projectSeo";

marked.setOptions({ gfm: true, breaks: false });

/** Lista de posts sem `body` (o índice /conteudos não usa o corpo). */
const POST_LIST_COLS =
  "id, slug, title, meta_title, meta_description, category, excerpt, cover_image, faq, reading_time, author, featured, published, published_at, created_at";

/** `null` = sanitizador falhou: a página sai só com título e resumo. */
function renderBody(body: string | null | undefined): string | null {
  if (!body) return "";
  try {
    const raw = marked.parse(body, { async: false }) as string;
    return sanitizeBlogHtml(raw);
  } catch {
    return null;
  }
}

/**
 * Conteúdo inexistente confirmado pelo banco: 301 para o redirecionamento
 * ativo (se houver destino seguro) ou 404. Nunca chamado em falha de rede.
 */
export async function notFoundOrRedirect(path: string): Promise<never> {
  const target = await lookupActiveRedirect(path);
  if (target && isSafeRedirectTarget(target) && target !== path) {
    throw redirect({ href: target, statusCode: 301 });
  }
  throw notFound();
}

// --- /conteudos/$slug -------------------------------------------------------

export type PostLoaderData = {
  seo: RouteSeoData;
  /** `undefined` = falha de rede (cliente busca); `null` = não existe. */
  post?: BewildPost | null;
  related?: BewildPost[] | null;
  bodyHtml?: string | null;
};

export async function loadPostContent(slug: string): Promise<PostLoaderData> {
  const res = await fetchPostContent(slug);
  if (res.post === null) return notFoundOrRedirect(`/conteudos/${slug}`);
  return res;
}

async function fetchPostContent(slug: string): Promise<PostLoaderData> {
  try {
    const { data, error } = await supabase
      .from("bewild_posts" as never)
      .select(POST_SELECT_COLS)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { seo: NOT_FOUND_SEO, post: null, related: [] };
    const post = normalizeBewildPost(data as unknown as BewildPost) as BewildPost;

    let related: BewildPost[] | null = null;
    if (post.category) {
      const rel = await supabase
        .from("bewild_posts" as never)
        .select(POST_SELECT_COLS)
        .eq("published", true)
        .eq("category", post.category)
        .neq("id", post.id)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(3);
      if (!rel.error) {
        related = ((rel.data ?? []) as unknown as BewildPost[]).map(normalizeBewildPost) as BewildPost[];
      }
    } else {
      related = [];
    }

    return { seo: postSeoFrom(post), post, related, bodyHtml: renderBody(post.body) };
  } catch {
    return { seo: postSeoFrom(null, true) };
  }
}

// --- /portfolio/$slug -------------------------------------------------------

export type ProjectLoaderData = {
  seo: RouteSeoData;
  project?: BewildProjectFull | null;
  peers?: ProjectSeoPeer[] | null;
};

export async function loadProjectContent(slug: string): Promise<ProjectLoaderData> {
  const res = await fetchProjectContent(slug);
  if (res.project === null) return notFoundOrRedirect(`/portfolio/${slug}`);
  return res;
}

async function fetchProjectContent(slug: string): Promise<ProjectLoaderData> {
  try {
    const [projectRes, peersRes] = await Promise.all([
      supabase.from("projects").select(PROJECT_COLUMNS).eq("slug", slug).eq("published", true).maybeSingle(),
      supabase.from("projects").select(PEER_COLUMNS).eq("published", true).limit(1000),
    ]);
    if (projectRes.error) throw projectRes.error;
    const peers = peersRes.error ? null : ((peersRes.data ?? []) as unknown as ProjectSeoPeer[]);
    const project = (projectRes.data ?? null) as unknown as BewildProjectFull | null;
    if (!project) return { seo: NOT_FOUND_SEO, project: null, peers };
    return { seo: projectSeoFrom(project, peers ?? []), project, peers };
  } catch {
    return { seo: projectSeoFrom(null, [], true) };
  }
}

// --- listas de projetos (/portfolio, /mapa-do-site, /reforma/$slug) --------

async function fetchProjectList(): Promise<BewildProject[] | null> {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECTS_LIST_COLUMNS)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return null;
    return (data ?? []) as unknown as BewildProject[];
  } catch {
    return null;
  }
}

export type ProjectListLoaderData = { projects: BewildProject[] | null };

export async function loadProjectList(): Promise<ProjectListLoaderData> {
  return { projects: await fetchProjectList() };
}

export type BairroLoaderData = { seo: RouteSeoData; projects: BewildProject[] | null };

export async function loadBairroContent(slug: string): Promise<BairroLoaderData> {
  const projects = await fetchProjectList();
  const seo = bairroSeoFrom(slug, projects);
  // Lista carregada e bairro inexistente = 404 (falha de rede: lista null, segue 200).
  if (projects !== null && seo.notFound) return notFoundOrRedirect(`/reforma/${slug}`);
  return { seo, projects };
}

// --- /conteudos -------------------------------------------------------------

export type PostListLoaderData = { posts: BewildPost[] | null };

export async function loadPostList(): Promise<PostListLoaderData> {
  try {
    const { data, error } = await supabase
      .from("bewild_posts" as never)
      .select(POST_LIST_COLS)
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) return { posts: null };
    const rows = ((data ?? []) as unknown as BewildPost[]).map((r) => ({ ...r, body: "" }));
    return { posts: rows.map(normalizeBewildPost) as BewildPost[] };
  } catch {
    return { posts: null };
  }
}

// --- /mapa-do-site ----------------------------------------------------------

export type SiteMapLoaderData = { projects: BewildProject[] | null; posts: BewildPost[] | null };

/** Projetos + posts em paralelo: o mapa do site linka /portfolio/*, /reforma/* e /conteudos/* no HTML do servidor. */
export async function loadSiteMapContent(): Promise<SiteMapLoaderData> {
  const [{ projects }, { posts }] = await Promise.all([loadProjectList(), loadPostList()]);
  return { projects, posts };
}
