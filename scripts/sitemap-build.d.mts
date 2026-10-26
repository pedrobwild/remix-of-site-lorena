/** Tipos de scripts/sitemap-build.mjs para quem importa o módulo em TypeScript (src/lib/sitemapServer.ts). */

export const BASE_URL: string;
export const LASTMOD_BAIRROS: string;
export const LASTMOD_VIDEOS: string;
export const LASTMOD_FILES: Record<string, string[]>;

export type StaticPage = {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: "projects" | "posts" | "faq";
  files?: string[];
  fallback?: string;
};
export const STATIC_PAGES: StaticPage[];

export type VideoMetaJson = {
  youtube: Record<string, { name?: string; description?: string; thumbnailUrl?: string; duration?: string; uploadDate?: string }>;
  files: Record<string, { name?: string; description?: string; thumbnailUrl?: string; duration?: string; uploadDate?: string }>;
};
export type VideoPageJson = {
  slug: string;
  kind: string;
  title: string;
  description: string;
  youtube?: string;
  file?: string;
};
export type VideoContext = {
  videoMeta: VideoMetaJson;
  videoPages: VideoPageJson[];
  pagedYouTube: Set<string>;
  pagedFiles: Set<string>;
};
export function videoContext(videoMeta: unknown, videoPages: unknown): VideoContext;

export type SitemapProject = {
  slug: string | null;
  neighborhood?: string | null;
  cover_url?: string | null;
  created_at?: string | null;
  content_updated_at?: string | null;
};
export type SitemapPost = {
  slug: string | null;
  title?: string | null;
  body?: string | null;
  meta_description?: string | null;
  excerpt?: string | null;
  youtube_video_id?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  content_updated_at?: string | null;
};
export type SitemapFaqRow = { updated_at?: string | null };

export type SitemapVideo = {
  id: string;
  thumb: string;
  title: string;
  desc: string;
  player?: string;
  content?: string;
  secs: number | null;
  date: string | null;
};
export type SitemapUrl = {
  loc: string;
  lastmod?: string | null;
  changefreq: string;
  priority: string;
  videos?: SitemapVideo[];
  label?: string;
  count?: number;
};
export type VideoPageEntry = {
  slug: string;
  loc: string;
  name: string;
  kind: string;
  duration: string | null;
  video: SitemapVideo;
};

export function xmlEscape(s: unknown): string;
export function day(...candidates: Array<string | null | undefined>): string | null;
export function urlTag(u: SitemapUrl): string;
export function videoDate(value: unknown): string | null;
export function videoPageEntries(ctx: VideoContext): VideoPageEntry[];
export function postVideos(post: SitemapPost, ctx: VideoContext): SitemapVideo[];
export function unpagedPostVideoIds(post: SitemapPost, ctx: VideoContext): string[];
export function noBairro(label: unknown): string;
export function hoodSlug(v: unknown): string;
export function hoodEntries(projects: SitemapProject[], hoodPageLastmod: string | null): SitemapUrl[];

export function buildSitemap(input: {
  projects: SitemapProject[] | null | undefined;
  posts: SitemapPost[] | null | undefined;
  faqRows: SitemapFaqRow[] | null | undefined;
  lastmod: Record<string, string | null> | null | undefined;
  ctx: VideoContext;
}): { xml: string; urls: SitemapUrl[]; hoodUrls: SitemapUrl[]; videoEntries: VideoPageEntry[]; warnings: string[] };

export function videoLlmsLines(entries: VideoPageEntry[]): string[];
export function buildLlmsTxt(
  template: string,
  input: { posts: SitemapPost[] | null | undefined; hoodUrls: SitemapUrl[]; videoEntries: VideoPageEntry[] },
): { text: string; warnings: string[]; counts: { posts: number; bairros: number; videos: number } };
