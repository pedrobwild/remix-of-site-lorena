import { rewriteGuiaLinksInHtml } from "@/lib/radarLinks";
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
import { notFound, redirect } from "@tanstack/react-router";
import { lookupActiveRedirect } from "@/lib/notFoundLog";
import { isSafeRedirectTarget } from "@/lib/seoRedirects";
import { supabase } from "@/integrations/supabase/client";
import { wrapArticleTables } from "@/lib/articleTables";
import { NOT_FOUND_SEO, postSeoFrom, projectSeoFrom, bairroSeoFrom, type RouteSeoData } from "@/lib/seoLoaders";
import { normalizeBewildPost, type BewildPost } from "@/lib/useBewildPosts";
import { withPostCols } from "@/lib/useBewildPost";
import { PROJECT_COLUMNS, type BewildProjectFull } from "@/lib/useBewildProject";
import { PROJECTS_LIST_COLUMNS, type BewildProject } from "@/lib/useBewildProjects";
import { PEER_COLUMNS } from "@/lib/useProjectSeoPeers";
import type { ProjectSeoPeer } from "@/lib/projectSeo";
import { neighborhoodPages } from "@/lib/portfolioFilter";
import type { BairroPageLink } from "@/lib/bairrosSp";
import { fetchAlts, type AltMap } from "@/lib/useImageAlts";
import { readyPhotos, renderPhotos } from "@/lib/projectPhotos";

/** Lista de posts sem `body` (o índice /conteudos não usa o corpo). */
const POST_LIST_COLS =
  "id, slug, title, meta_title, meta_description, og_image, category, excerpt, cover_image, faq, reading_time, author, featured, published, published_at, created_at";

/**
 * `null` = sanitizador falhou: a página sai só com título e resumo.
 *
 * `marked` e o sanitizador (dompurify + xss, ~90 kB juntos) entram por import
 * dinâmico: este arquivo é carregado por toda rota com loader, então o import
 * estático levava os dois para o pacote inicial de TODAS as páginas — a home
 * no celular incluída —, quando só o artigo usa.
 */
async function renderBody(body: string | null | undefined): Promise<string | null> {
  if (!body) return "";
  try {
    const [{ marked }, { sanitizeBlogHtml }] = await Promise.all([
      import("marked"),
      import("@/lib/sanitizeHtml"),
    ]);
    const raw = marked.parse(body, { async: false, gfm: true, breaks: false }) as string;
    return wrapArticleTables(rewriteGuiaLinksInHtml(sanitizeBlogHtml(raw)));
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
    const { data, error } = await withPostCols((cols) =>
      supabase.from("bewild_posts" as never).select(cols).eq("slug", slug).eq("published", true).maybeSingle(),
    );
    if (error) throw error;
    if (!data) return { seo: NOT_FOUND_SEO, post: null, related: [] };
    const post = normalizeBewildPost(data as unknown as BewildPost) as BewildPost;

    let related: BewildPost[] | null = null;
    if (post.category) {
      const category = post.category;
      const rel = await withPostCols((cols) =>
        supabase
          .from("bewild_posts" as never)
          .select(cols)
          .eq("published", true)
          .eq("category", category)
          .neq("id", post.id)
          .order("published_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(3),
      );
      if (!rel.error) {
        related = ((rel.data ?? []) as unknown as BewildPost[]).map(normalizeBewildPost) as BewildPost[];
      }
    } else {
      related = [];
    }

    return { seo: postSeoFrom(post), post, related, bodyHtml: await renderBody(post.body) };
  } catch {
    return { seo: postSeoFrom(null, true) };
  }
}

// --- /portfolio/$slug -------------------------------------------------------

export type ProjectLoaderData = {
  seo: RouteSeoData;
  project?: BewildProjectFull | null;
  peers?: ProjectSeoPeer[] | null;
  alts?: AltMap;
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
    // created_at não está em PROJECT_COLUMNS: vem da lista de pares, como na
    // página, para o <title> do servidor sair com a mesma data do navegador.
    const self = peers?.find((o) => o.id === project.id);
    const seoRow = self ? { ...project, created_at: self.created_at } : project;
    const urls = [project.cover_url, project.before_image_url, project.after_image_url,
      ...renderPhotos(project), ...readyPhotos(project)].filter((url): url is string => !!url);
    // A mesma descrição por URL já sai no HTML inicial; falha de alt não oculta o projeto.
    // Uma segunda tentativa cobre falha passageira da consulta: sem ela a
    // página sairia do servidor com o texto numerado até o navegador reabrir.
    const altUrls = Array.from(new Set(urls));
    const alts = await fetchAlts(altUrls)
      .catch(() => fetchAlts(altUrls))
      .catch(() => ({}));
    return { seo: projectSeoFrom(seoRow, peers ?? []), project, peers, alts };
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

/** Links das páginas de bairro para as listas estáticas de bairros (serviço e /onde-atuamos). */
export type BairroLinksLoaderData = { bairroPages: BairroPageLink[] | null };

export async function loadBairroLinks(): Promise<BairroLinksLoaderData> {
  const { projects } = await loadProjectList();
  if (!projects) return { bairroPages: null };
  return { bairroPages: neighborhoodPages(projects).map(({ slug, label }) => ({ slug, label })) };
}

// --- /licenca-* (painel /admin/licencas) ------------------------------------

export type LicencaLoaderData = { title: string; intro: string; bodyHtml: string | null; citationModel: string };

/** Texto da licença no HTML do servidor; banco vazio ou fora do ar = texto padrão. */
export async function loadLicenca(slug: import("@/content/pages/licencas").LicencaSlug): Promise<LicencaLoaderData> {
  const { mergeLicenca } = await import("@/content/pages/licencas");
  let row: { title: string | null; intro: string | null; body: string | null; citation_model: string | null } | null = null;
  try {
    const { data } = await supabase.rpc("get_public_license", { p_slug: slug }).maybeSingle();
    row = data ?? null;
  } catch {
    row = null;
  }
  const merged = mergeLicenca(slug, row);
  return { title: merged.title, intro: merged.intro, bodyHtml: await renderBody(merged.body), citationModel: merged.citationModel };
}
