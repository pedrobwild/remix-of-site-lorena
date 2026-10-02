import { optimizedImageUrl } from "./imageUrl";
/**
 * Loaders de SEO das rotas dinâmicas (projeto, artigo, bairro): buscam o
 * mínimo no banco para o `head()` sair certo no HTML bruto (SSR). As páginas
 * continuam carregando os dados completos no cliente, como antes; aqui é só
 * título/descrição/imagem. Falha de rede nunca derruba a página: cai no
 * fallback genérico e o `useSeo` do cliente corrige depois.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  projectMetaDescription,
  projectSeoTitleUnique,
  type ProjectSeoPeer,
} from "@/lib/projectSeo";
import { neighborhoodPages } from "@/lib/portfolioFilter";

export type RouteSeoData = {
  title: string;
  description: string;
  ogImage?: string | null;
  ogType?: "website" | "article";
  notFound?: boolean;
};

export const NOT_FOUND_SEO: RouteSeoData = {
  title: "404 · Página não encontrada · Bewild",
  description:
    "A página solicitada não existe ou foi movida. Conheça o portfólio de reformas de apartamentos e imóveis prontos da Bewild em São Paulo.",
  notFound: true,
};

const PEER_COLUMNS =
  "id, title, neighborhood, location, area_m2, project_type, status, seo_title, created_at";

export async function loadProjectSeo(slug: string): Promise<RouteSeoData> {
  try {
    const [projectRes, peersRes] = await Promise.all([
      supabase
        .from("projects")
        .select(`${PEER_COLUMNS}, slug, seo_description, summary, og_image_url, cover_url`)
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle(),
      supabase.from("projects").select(PEER_COLUMNS).eq("published", true).limit(1000),
    ]);
    const p = projectRes.data as
      | (ProjectSeoPeer & {
          slug: string;
          seo_description: string | null;
          summary: string | null;
          og_image_url: string | null;
          cover_url: string | null;
        })
      | null;
    if (!p) return NOT_FOUND_SEO;
    const peers = (peersRes.data ?? []) as unknown as ProjectSeoPeer[];
    return {
      title: projectSeoTitleUnique(p, peers),
      description: projectMetaDescription(
        p,
        "Reforma de apartamento em São Paulo com projeto, obra e marcenaria pela Bewild.",
      ),
      ogImage: p.og_image_url || p.cover_url || null,
    };
  } catch {
    return {
      title: "Reforma de apartamento em São Paulo | Bewild",
      description: "Projeto, obra e marcenaria integrados pela Bewild em São Paulo.",
    };
  }
}

type PostSeoRow = {
  title: string | null;
  meta_title: string | null;
  meta_description: string | null;
  excerpt: string | null;
  cover_image: string | null;
};

export async function loadPostSeo(slug: string): Promise<RouteSeoData> {
  try {
    const { data } = await supabase
      .from("bewild_posts" as never)
      .select("title, meta_title, meta_description, excerpt, cover_image")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    const post = data as PostSeoRow | null;
    if (!post) return NOT_FOUND_SEO;
    return {
      title: post.meta_title || `${post.title ?? "Conteúdo"} | Bewild`,
      description:
        post.meta_description ||
        post.excerpt ||
        "Guias práticos da Bewild sobre arquitetura, engenharia e reforma de apartamento em São Paulo.",
      ogImage: post.cover_image,
      ogType: "article",
    };
  } catch {
    return {
      title: "Conteúdos | Bewild",
      description:
        "Guias práticos da Bewild sobre arquitetura, engenharia e reforma de apartamento em São Paulo.",
      ogType: "article",
    };
  }
}

export async function loadBairroSeo(slug: string): Promise<RouteSeoData> {
  try {
    const { data } = await supabase
      .from("projects")
      .select("neighborhood, cover_url")
      .eq("published", true)
      .limit(1000);
    const list = (data ?? []) as Array<{ neighborhood: string | null; cover_url: string | null }>;
    const page = neighborhoodPages(list).find((n) => n.slug === slug);
    if (!page) return NOT_FOUND_SEO;
    return {
      title: `Reforma de apartamento em ${page.label}: projetos e orçamento | Bewild`,
      description: `${page.count} apartamentos reformados pela Bewild em ${page.label}, São Paulo: fotos reais de cada obra e orçamento sem custo para o seu imóvel no bairro.`,
    };
  } catch {
    return {
      title: "Reforma de apartamento em São Paulo: projetos e orçamento | Bewild",
      description:
        "Apartamentos reformados pela Bewild em São Paulo: fotos reais de cada obra e orçamento sem custo.",
    };
  }
}

// --- Versões puras (sem ida ao banco), usadas por contentLoaders.ts --------

type ProjectSeoRow = ProjectSeoPeer & {
  seo_description: string | null;
  summary: string | null;
  og_image_url: string | null;
  cover_url: string | null;
};

export function projectSeoFrom(p: ProjectSeoRow | null, peers: ProjectSeoPeer[], failed = false): RouteSeoData {
  if (failed || !p) {
    if (!failed) return NOT_FOUND_SEO;
    return {
      title: "Reforma de apartamento em São Paulo | Bewild",
      description: "Projeto, obra e marcenaria integrados pela Bewild em São Paulo.",
    };
  }
  return {
    title: projectSeoTitleUnique(p, peers),
    description: projectMetaDescription(
      p,
      "Reforma de apartamento em São Paulo com projeto, obra e marcenaria pela Bewild.",
    ),
    // Capa original tem ~3 MB; redes sociais recebem a versão de 1200 px.
    ogImage: p.og_image_url || (p.cover_url ? optimizedImageUrl(p.cover_url, 1200, 80) : null),
  };
}

export function postSeoFrom(post: PostSeoRow | null, failed = false): RouteSeoData {
  if (failed || !post) {
    if (!failed) return NOT_FOUND_SEO;
    return {
      title: "Conteúdos | Bewild",
      description:
        "Guias práticos da Bewild sobre arquitetura, engenharia e reforma de apartamento em São Paulo.",
      ogType: "article",
    };
  }
  return {
    title: post.meta_title || `${post.title ?? "Conteúdo"} | Bewild`,
    description:
      post.meta_description ||
      post.excerpt ||
      "Guias práticos da Bewild sobre arquitetura, engenharia e reforma de apartamento em São Paulo.",
    ogImage: post.cover_image,
    ogType: "article",
  };
}

export function bairroSeoFrom(
  slug: string,
  list: Array<{ neighborhood: string | null; cover_url: string | null }> | null,
): RouteSeoData {
  if (!list) {
    return {
      title: "Reforma de apartamento em São Paulo: projetos e orçamento | Bewild",
      description:
        "Apartamentos reformados pela Bewild em São Paulo: fotos reais de cada obra e orçamento sem custo.",
    };
  }
  const page = neighborhoodPages(list).find((n) => n.slug === slug);
  if (!page) return NOT_FOUND_SEO;
  return {
    title: `Reforma de apartamento em ${page.label}: projetos e orçamento | Bewild`,
    description: `${page.count} apartamentos reformados pela Bewild em ${page.label}, São Paulo: fotos reais de cada obra e orçamento sem custo para o seu imóvel no bairro.`,
  };
}
