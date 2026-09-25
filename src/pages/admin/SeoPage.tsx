import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSiteSettings, type SiteSettings } from "@/lib/useSiteSettings";
import { auditPublicPage, type PublicPageAudit } from "@/lib/seoAudit";
import { downloadSitemap, parseSitemapXml, type SitemapSnapshot } from "@/lib/sitemap";
import { refreshSeoEverywhere, validTrackerId } from "@/lib/useSeo";
import { validAdsLabel } from "@/lib/googleAds";
import {
  diffSettings,
  loadSettingsRow,
  saveSettingsPatch,
  settingsErrorMessage,
  type SettingsRow,
} from "@/lib/adminSiteSettings";
import { useUnsavedChangesGuard } from "@/lib/useUnsavedChangesGuard";
import { parseBastidoresPosts } from "@/lib/bastidoresJsonLd";
import { PUBLIC_PAGES, type PageSeoOverride, type PagesSeoMap } from "@/lib/publicPages";

const SITEMAP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`;
const ROBOTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/robots`;

type TabKey = "home" | "pages" | "bastidores" | "global" | "verify" | "analytics" | "local" | "sitemap" | "audit" | "guide";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "home", label: "Home" },
  { key: "pages", label: "Páginas" },
  { key: "bastidores", label: "Bastidores" },
  { key: "global", label: "Global" },
  { key: "verify", label: "Verificações" },
  { key: "analytics", label: "Analytics & Pixels" },
  { key: "local", label: "Negócio local" },
  { key: "sitemap", label: "Sitemap & Robots" },
  { key: "audit", label: "Auditoria" },
  { key: "guide", label: "Guia Google" },
];

/**
 * Campos que esta tela edita. O save envia SÓ os que mudaram em relação ao
 * que foi lido do banco — antes eram ~30 campos de uma vez, a partir de um
 * estado que podia ser os DEFAULTS do código (quando a leitura falhava), e
 * um clique em "salvar" apagava Pixel, GTM, códigos de verificação…
 */
const SEO_FIELDS = [
  // Home
  "home_seo_title",
  "home_seo_description",
  "home_og_title",
  "home_og_description",
  "home_og_image",
  "bastidores_seo",
  "pages_seo",
  // Global
  "seo_default_title",
  "seo_default_description",
  "seo_og_image",
  "seo_twitter_handle",
  "seo_canonical_base",
  "seo_robots",
  "seo_keywords",
  "seo_author",
  "seo_geo_region",
  "seo_geo_placename",
  "seo_geo_position",
  // Verificações
  "google_site_verification",
  "bing_site_verification",
  "yandex_verification",
  "facebook_domain_verification",
  "pinterest_site_verification",
  // Analytics & pixels
  "google_analytics_id",
  "google_tag_manager_id",
  "google_ads_conversion_id",
  "google_ads_lead_label",
  "google_ads_contact_label",
  "meta_pixel_id",
  "meta_capi_test_event_code",
  "hotjar_id",
  "clarity_id",
  // Local business
  "business_type",
  "business_founding_year",
  "business_price_range",
  "business_postal_code",
  "business_opening_hours",
  "google_maps_url",
  "google_business_profile_url",
] as const satisfies readonly (keyof SiteSettings)[];

type Msg = { kind: "ok" | "err"; text: string };

export default function SeoPage() {
  // `loaded` = o que está no banco; `s` = o que está na tela.
  const [loaded, setLoaded] = useState<SiteSettings | null>(null);
  const [s, setS] = useState<SiteSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingRow, setLoadingRow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [tab, setTab] = useState<TabKey>("home");
  const [audit, setAudit] = useState<PublicPageAudit | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const pending = useMemo(
    () =>
      loaded && s
        ? diffSettings(loaded as unknown as SettingsRow, s as unknown as SettingsRow, SEO_FIELDS)
        : {},
    [loaded, s],
  );
  const dirty = Object.keys(pending).length > 0;
  useUnsavedChangesGuard(dirty);

  const load = useCallback(async () => {
    setLoadingRow(true);
    setLoadError(null);
    const { row, error } = await loadSettingsRow();
    if (error || !row) {
      setLoadError(error ?? "Não foi possível ler as configurações.");
      setLoadingRow(false);
      return;
    }
    const settings = row as unknown as SiteSettings;
    setLoaded(settings);
    setS(settings);
    setLoadingRow(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patch<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) {
    setS((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  async function save() {
    if (!s || !loaded) return;
    setMsg(null);
    if (!dirty) {
      setMsg({ kind: "ok", text: "nada mudou desde a última gravação." });
      return;
    }
    setSaving(true);
    const { error } = await saveSettingsPatch(pending);
    setSaving(false);
    if (error) {
      setMsg({ kind: "err", text: error });
      return;
    }
    // O banco agora tem o que está na tela (só para os campos enviados).
    setLoaded((prev) => (prev ? ({ ...prev, ...pending } as SiteSettings) : prev));
    invalidateSiteSettings();
    const n = Object.keys(pending).length;
    setMsg({
      kind: "ok",
      text: `${n} campo(s) salvo(s). Recarregue o site para aplicar.`,
    });
  }

  /** Grava um carimbo de data em site_settings e reflete na tela sem sujar o formulário. */
  async function stampSetting(
    field: "seo_last_audit_at" | "seo_last_search_console_submit",
  ): Promise<string | null> {
    const now = new Date().toISOString();
    const { error } = await saveSettingsPatch({ [field]: now });
    if (error) return error;
    setLoaded((prev) => (prev ? { ...prev, [field]: now } : prev));
    setS((prev) => (prev ? { ...prev, [field]: now } : prev));
    return null;
  }

  async function runAudit(path: string) {
    if (!s) return;
    setAuditing(true);
    setAuditError(null);
    try {
      const result = await auditPublicPage(s, path);
      setAudit(result);
      const problems: string[] = [];
      const { error: logError } = await supabase.from("seo_audit_log").insert({
        kind: "audit",
        score: result.score,
        issues: result.issues,
        notes: `Página auditada: ${result.path}${result.timedOut ? " (render incompleto)" : ""}`,
      });
      if (logError) problems.push(`histórico: ${settingsErrorMessage(logError)}`);
      const stampError = await stampSetting("seo_last_audit_at");
      if (stampError) problems.push(`data da última auditoria: ${stampError}`);
      if (problems.length) {
        setAuditError(`A auditoria rodou, mas não foi registrada (${problems.join("; ")}).`);
      }
    } catch (e) {
      setAuditError(e instanceof Error ? e.message : String(e));
    } finally {
      setAuditing(false);
    }
  }

  async function markSubmitted() {
    setMsg(null);
    const { error: logError } = await supabase.from("seo_audit_log").insert({
      kind: "submit",
      notes: "Sitemap enviado ao Google Search Console",
    });
    const stampError = await stampSetting("seo_last_search_console_submit");
    if (logError || stampError) {
      const parts = [
        logError ? `histórico: ${settingsErrorMessage(logError)}` : null,
        stampError ? `data do envio: ${stampError}` : null,
      ].filter(Boolean);
      setMsg({ kind: "err", text: `Não foi possível registrar o envio (${parts.join("; ")}).` });
      return;
    }
    setMsg({ kind: "ok", text: "marcado como enviado." });
  }

  async function refreshSeo() {
    setRefreshing(true);
    setMsg(null);
    try {
      const result = await refreshSeoEverywhere({ pingSearchEngines: true });
      // Não recarrega o formulário: o que está na tela (inclusive edições
      // ainda não salvas) continua como está.
      const pingOk = result.ping?.results?.every((r) => r.ok);
      const pingMsg = result.ping
        ? pingOk
          ? " Google e Bing notificados."
          : " (ping aos buscadores falhou — pode tentar de novo depois)"
        : "";
      setMsg({
        kind: "ok",
        text: `SEO atualizado em todas as páginas.${pingMsg}${dirty ? " Há alterações não salvas no formulário." : ""}`,
      });
    } catch (err) {
      setMsg({ kind: "err", text: `falha ao atualizar SEO: ${String(err)}` });
    } finally {
      setRefreshing(false);
    }
  }

  if (loadingRow && !s) {
    return (
      <AdminLayout active="seo">
        <p className="mono">carregando…</p>
      </AdminLayout>
    );
  }

  if (!s) {
    return (
      <AdminLayout active="seo">
        <div className="admin-flash admin-flash--err mono" role="alert" style={{ marginBottom: 16 }}>
          Não foi possível ler as configurações de SEO: {loadError}. Nada foi alterado — o
          formulário fica bloqueado até a leitura funcionar, para não gravar valores padrão por
          cima dos reais.
        </div>
        <button type="button" className="admin-btn" onClick={() => void load()} disabled={loadingRow}>
          {loadingRow ? "tentando…" : "tentar de novo"}
        </button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout active="seo">
      <div className="admin-form-head">
        <h1 className="admin-form-head__title">SEO</h1>
        <div className="admin-form-head__actions">
          {msg && (
            <span
              className={`admin-flash admin-flash--${msg.kind} mono`}
              role={msg.kind === "err" ? "alert" : "status"}
            >
              {msg.text}
            </span>
          )}
          {dirty && !msg && (
            <span className="mono admin-hint" role="status">
              {Object.keys(pending).length} alteração(ões) não salva(s)
            </span>
          )}
          <button
            className="admin-btn"
            onClick={refreshSeo}
            disabled={refreshing || saving}
            title="Recarrega configurações, reaplica meta tags e JSON-LD em todas as páginas e notifica Google/Bing sobre o sitemap"
          >
            {refreshing ? "atualizando…" : "atualizar SEO"}
          </button>
          <button
            className="admin-btn admin-btn--primary"
            onClick={save}
            disabled={saving || refreshing || !dirty}
          >
            {saving ? "salvando…" : "salvar"}
          </button>
        </div>
      </div>

      <nav className="seo-tabs" role="tablist" aria-label="Seções de SEO">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`seo-tab ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "home" && <HomeTab s={s} patch={patch} />}
      {tab === "pages" && <PagesTab s={s} patch={patch} />}
      {tab === "bastidores" && <BastidoresTab s={s} patch={patch} />}
      {tab === "global" && <GlobalTab s={s} patch={patch} />}
      {tab === "verify" && <VerifyTab s={s} patch={patch} />}
      {tab === "analytics" && <AnalyticsTab s={s} patch={patch} />}
      {tab === "local" && <LocalTab s={s} patch={patch} />}
      {tab === "sitemap" && (
        <SitemapTab s={s} onMarkSubmitted={markSubmitted} />
      )}
      {tab === "audit" && (
        <AuditTab
          audit={audit}
          auditing={auditing}
          error={auditError}
          lastAuditAt={s.seo_last_audit_at}
          onRun={runAudit}
        />
      )}
      {tab === "guide" && <GuideTab s={s} />}
    </AdminLayout>
  );
}

// =============================================================
//  Aba: Páginas — título, descrição e Open Graph de cada página pública
// =============================================================

function PagesTab({
  s,
  patch,
}: {
  s: SiteSettings;
  patch: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void;
}) {
  const map: PagesSeoMap = s.pages_seo ?? {};
  const set = (path: string, key: keyof PageSeoOverride, value: string) => {
    const next: PagesSeoMap = { ...map, [path]: { ...(map[path] ?? {}), [key]: value } };
    patch("pages_seo", next);
  };
  return (
    <>
      <p className="mono" style={{ opacity: 0.7, marginBottom: 24, maxWidth: 680 }}>
        Textos de cada página do site. Campo vazio mantém o texto que a página já usa hoje. A home
        tem aba própria; artigos e projetos têm campos de SEO no próprio editor. Depois de salvar,
        publique o site para a mudança chegar ao endereço oficial.
      </p>
      {PUBLIC_PAGES.map((p) => {
        const cur = map[p.path] ?? {};
        return (
          <section key={p.path} className="admin-grid-2" style={{ marginBottom: 32 }}>
            <h3 className="mono" style={{ gridColumn: "1 / -1", margin: 0 }}>
              {p.label}{" "}
              <a href={`https://bewild.com.br${p.path}`} target="_blank" rel="noreferrer">
                {p.path}
              </a>
            </h3>
            <Field label="Título no Google (≤ 60 caracteres)" full>
              <input
                className="admin-field__input"
                value={cur.title ?? ""}
                placeholder="vazio = título atual da página"
                onChange={(e) => set(p.path, "title", e.target.value)}
                maxLength={90}
              />
              <Hint count={(cur.title ?? "").length} max={60} />
            </Field>
            <Field label="Descrição no Google (≤ 160 caracteres)" full>
              <textarea
                className="admin-field__input"
                rows={3}
                value={cur.description ?? ""}
                placeholder="vazio = descrição atual da página"
                onChange={(e) => set(p.path, "description", e.target.value)}
                maxLength={220}
              />
              <Hint count={(cur.description ?? "").length} max={160} />
            </Field>
            <Field label="Título ao compartilhar (Open Graph) — vazio usa o do Google" full>
              <input
                className="admin-field__input"
                value={cur.og_title ?? ""}
                placeholder={cur.title || "vazio = título do Google"}
                onChange={(e) => set(p.path, "og_title", e.target.value)}
                maxLength={90}
              />
              <Hint count={(cur.og_title ?? "").length} max={60} />
            </Field>
            <Field label="Descrição ao compartilhar (Open Graph) — vazio usa a do Google" full>
              <textarea
                className="admin-field__input"
                rows={3}
                value={cur.og_description ?? ""}
                placeholder={cur.description || "vazio = descrição do Google"}
                onChange={(e) => set(p.path, "og_description", e.target.value)}
                maxLength={220}
              />
              <Hint count={(cur.og_description ?? "").length} max={160} />
            </Field>
            <Field label="Imagem ao compartilhar — URL pública https, 1200×630" full>
              <input
                className="admin-field__input"
                value={cur.og_image ?? ""}
                placeholder="vazio = imagem padrão do site"
                onChange={(e) => set(p.path, "og_image", e.target.value)}
              />
            </Field>
          </section>
        );
      })}
    </>
  );
}

// =============================================================
//  Aba: Bastidores — título e descrição de cada post (dados estruturados)
// =============================================================
const BASTIDORES_POSTS = parseBastidoresPosts();

function BastidoresTab({
  s,
  patch,
}: {
  s: SiteSettings;
  patch: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void;
}) {
  const map = s.bastidores_seo ?? {};
  const set = (code: string, key: "title" | "description", value: string) => {
    const next = { ...map, [code]: { ...(map[code] ?? {}), [key]: value } };
    patch("bastidores_seo", next);
  };
  return (
    <>
      <p className="mono" style={{ opacity: 0.7, marginBottom: 24, maxWidth: 680 }}>
        Título e descrição que o Google lê para cada post dos Bastidores na home. Campo vazio usa o
        texto do card (mostrado em cinza). Os posts não têm endereço próprio, então a prévia ao
        compartilhar continua sendo a da home (aba Home).
      </p>
      {BASTIDORES_POSTS.map((p, i) => {
        const defTitle = `${p.name} | Bastidores Bewild`;
        const cur = map[p.code] ?? {};
        return (
          <section key={p.code} className="admin-grid-2" style={{ marginBottom: 32 }}>
            <h3 className="mono" style={{ gridColumn: "1 / -1", margin: 0 }}>
              Post {i + 1} · {p.name}{" "}
              <a href={`https://www.instagram.com/p/${p.code}/`} target="_blank" rel="noreferrer">
                ver no Instagram
              </a>
            </h3>
            <Field label={`Título (≤ 60 caracteres) — post ${i + 1}`} full>
              <input
                className="admin-field__input"
                value={cur.title ?? ""}
                placeholder={defTitle}
                onChange={(e) => set(p.code, "title", e.target.value)}
                maxLength={90}
              />
              <Hint count={(cur.title ?? "").length} max={60} />
            </Field>
            <Field label={`Descrição (≤ 160 caracteres) — post ${i + 1}`} full>
              <textarea
                className="admin-field__input"
                rows={3}
                value={cur.description ?? ""}
                placeholder={p.description}
                onChange={(e) => set(p.code, "description", e.target.value)}
                maxLength={220}
              />
              <Hint count={(cur.description ?? "").length} max={160} />
            </Field>
          </section>
        );
      })}
    </>
  );
}

// =============================================================
//  Aba: Home — título, descrição e Open Graph da página inicial
// =============================================================
const HOME_DEFAULT_TITLE = "Arquitetura, engenharia e reforma de apartamento em SP | Bewild";
const HOME_DEFAULT_DESC =
  "Reforma completa de apartamentos em São Paulo: projeto, obra, marcenaria e mobília, com preço e prazo fechados. Veja os bastidores da equipe em obra.";

function HomeTab({
  s,
  patch,
}: {
  s: SiteSettings;
  patch: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void;
}) {
  const title = s.home_seo_title?.trim() || HOME_DEFAULT_TITLE;
  const desc = s.home_seo_description?.trim() || HOME_DEFAULT_DESC;
  const ogTitle = s.home_og_title?.trim() || title;
  const ogDesc = s.home_og_description?.trim() || desc;
  const ogImage =
    s.home_og_image?.trim() || s.seo_og_image?.trim() || "https://bewild.com.br/og_final_v2.jpg";

  return (
    <>
      <p className="mono" style={{ opacity: 0.7, marginBottom: 24, maxWidth: 680 }}>
        Textos da página inicial. Campo vazio usa o texto padrão (mostrado em cinza). Depois de
        salvar, publique o site para a mudança chegar ao endereço oficial.
      </p>

      <div className="admin-grid-2">
        <Field label="Título no Google (≤ 60 caracteres)" full>
          <input
            className="admin-field__input"
            value={s.home_seo_title ?? ""}
            placeholder={HOME_DEFAULT_TITLE}
            onChange={(e) => patch("home_seo_title", e.target.value)}
            maxLength={90}
          />
          <Hint count={(s.home_seo_title ?? "").length} max={60} />
        </Field>
        <Field label="Descrição no Google (≤ 160 caracteres)" full>
          <textarea
            className="admin-field__input"
            rows={3}
            value={s.home_seo_description ?? ""}
            placeholder={HOME_DEFAULT_DESC}
            onChange={(e) => patch("home_seo_description", e.target.value)}
            maxLength={220}
          />
          <Hint count={(s.home_seo_description ?? "").length} max={160} />
        </Field>
        <Field label="Título ao compartilhar (Open Graph) — vazio usa o do Google" full>
          <input
            className="admin-field__input"
            value={s.home_og_title ?? ""}
            placeholder={title}
            onChange={(e) => patch("home_og_title", e.target.value)}
            maxLength={90}
          />
          <Hint count={(s.home_og_title ?? "").length} max={60} />
        </Field>
        <Field label="Descrição ao compartilhar (Open Graph) — vazio usa a do Google" full>
          <textarea
            className="admin-field__input"
            rows={3}
            value={s.home_og_description ?? ""}
            placeholder={desc}
            onChange={(e) => patch("home_og_description", e.target.value)}
            maxLength={220}
          />
          <Hint count={(s.home_og_description ?? "").length} max={160} />
        </Field>
        <Field label="Imagem ao compartilhar — URL pública https, 1200×630" full>
          <input
            className="admin-field__input"
            value={s.home_og_image ?? ""}
            placeholder={ogImage}
            onChange={(e) => patch("home_og_image", e.target.value)}
          />
        </Field>
      </div>

      <h3 className="mono" style={{ marginTop: 32, marginBottom: 12 }}>Prévia no Google</h3>
      <div style={{ border: "1px solid currentColor", padding: 16, maxWidth: 640, opacity: 0.9 }}>
        <div className="mono" style={{ fontSize: 12, opacity: 0.7 }}>https://bewild.com.br/</div>
        <div style={{ fontSize: 18, fontWeight: 600, margin: "4px 0" }}>{title}</div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>{desc}</div>
      </div>

      <h3 className="mono" style={{ marginTop: 32, marginBottom: 12 }}>
        Prévia ao compartilhar (WhatsApp, LinkedIn, Facebook)
      </h3>
      <div style={{ border: "1px solid currentColor", maxWidth: 480 }}>
        <img
          src={ogImage}
          alt="Imagem de compartilhamento da home"
          style={{ display: "block", width: "100%", aspectRatio: "1200 / 630", objectFit: "cover" }}
        />
        <div style={{ padding: 12 }}>
          <div className="mono" style={{ fontSize: 11, opacity: 0.7 }}>BEWILD.COM.BR</div>
          <div style={{ fontWeight: 600, margin: "4px 0" }}>{ogTitle}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{ogDesc}</div>
        </div>
      </div>
    </>
  );
}

// =============================================================
//  Aba: Global
// =============================================================
function GlobalTab({
  s,
  patch,
}: {
  s: SiteSettings;
  patch: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void;
}) {
  const previewTitle = s.seo_default_title || s.site_title || "Bewild";
  const previewDesc =
    s.seo_default_description || s.site_description || "Bewild prepara studios para short stay.";
  const base = (s.seo_canonical_base || "https://bewild.com.br").replace(/\/$/, "");

  return (
    <>
      <p className="mono" style={{ opacity: 0.7, marginBottom: 24, maxWidth: 640 }}>
        Estes valores são usados como padrão em todas as páginas que não definem SEO próprio. Cada
        projeto pode sobrescrever título, descrição e imagem na aba SEO do projeto.
      </p>

      <div className="admin-grid-2">
        <Field label="Título padrão (≤ 60 caracteres)">
          <input
            className="admin-field__input"
            value={s.seo_default_title ?? ""}
            onChange={(e) => patch("seo_default_title", e.target.value)}
            maxLength={70}
          />
          <Hint count={(s.seo_default_title ?? "").length} max={60} />
        </Field>
        <Field label="URL canônica base">
          <input
            className="admin-field__input"
            value={s.seo_canonical_base ?? ""}
            onChange={(e) => patch("seo_canonical_base", e.target.value)}
            placeholder="https://bewild.com.br"
          />
        </Field>
        <Field label="Descrição padrão (≤ 160 caracteres)" full>
          <textarea
            className="admin-field__input"
            rows={3}
            value={s.seo_default_description ?? ""}
            onChange={(e) => patch("seo_default_description", e.target.value)}
            maxLength={200}
          />
          <Hint count={(s.seo_default_description ?? "").length} max={160} />
        </Field>
        <Field label="Imagem padrão (Open Graph) — URL pública 1200×630" full>
          <input
            className="admin-field__input"
            value={s.seo_og_image ?? ""}
            onChange={(e) => patch("seo_og_image", e.target.value)}
            placeholder="https://…/og.jpg"
          />
        </Field>
        <Field label="Palavras-chave (separadas por vírgula)" full>
          <textarea
            className="admin-field__input"
            rows={2}
            value={s.seo_keywords ?? ""}
            onChange={(e) => patch("seo_keywords", e.target.value)}
            placeholder="short stay em São Paulo, preparação de studio…"
          />
        </Field>
        <Field label="Autor/Marca">
          <input
            className="admin-field__input"
            value={s.seo_author ?? ""}
            onChange={(e) => patch("seo_author", e.target.value)}
          />
        </Field>
        <Field label="Handle do Twitter (opcional)">
          <input
            className="admin-field__input"
            value={s.seo_twitter_handle ?? ""}
            onChange={(e) => patch("seo_twitter_handle", e.target.value)}
            placeholder="@bewild"
          />
        </Field>
        <Field label="Região (geo.region)">
          <input
            className="admin-field__input"
            value={s.seo_geo_region ?? ""}
            onChange={(e) => patch("seo_geo_region", e.target.value)}
            placeholder="BR-MG"
          />
        </Field>
        <Field label="Cidade (geo.placename)">
          <input
            className="admin-field__input"
            value={s.seo_geo_placename ?? ""}
            onChange={(e) => patch("seo_geo_placename", e.target.value)}
            placeholder="São Paulo, SP"
          />
        </Field>
        <Field label="Coordenadas geográficas (lat;lng)" full>
          <input
            className="admin-field__input"
            value={s.seo_geo_position ?? ""}
            onChange={(e) => patch("seo_geo_position", e.target.value)}
            placeholder="-18.9186;-48.2772"
          />
        </Field>
        <Field label="Diretiva de robots" full>
          <select
            className="admin-field__input"
            value={s.seo_robots ?? "index, follow"}
            onChange={(e) => patch("seo_robots", e.target.value)}
          >
            <option value="index, follow">index, follow (público)</option>
            <option value="noindex, nofollow">noindex, nofollow (oculto dos buscadores)</option>
          </select>
        </Field>
      </div>

      <section className="admin-section">
        <h2 className="admin-section__title">Preview no Google</h2>
        <div className="seo-preview seo-preview--google">
          <div className="seo-preview__url">{base}</div>
          <div className="seo-preview__title">{previewTitle}</div>
          <div className="seo-preview__desc">{previewDesc}</div>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section__title">Preview Open Graph (Facebook / WhatsApp)</h2>
        <div className="seo-preview seo-preview--og">
          {s.seo_og_image ? (
            <img
              className="seo-preview__og-img"
              src={s.seo_og_image}
              alt=""
              loading="lazy"
              decoding="async"
              width={1200}
              height={630}
            />
          ) : (
            <div className="seo-preview__og-img seo-preview__og-img--empty mono">
              sem imagem padrão
            </div>
          )}
          <div className="seo-preview__og-meta">
            <div className="seo-preview__og-domain mono">{base.replace(/^https?:\/\//, "")}</div>
            <div className="seo-preview__title">{previewTitle}</div>
            <div className="seo-preview__desc">{previewDesc}</div>
          </div>
        </div>
      </section>
    </>
  );
}

// =============================================================
//  Aba: Verificações
// =============================================================
function VerifyTab({
  s,
  patch,
}: {
  s: SiteSettings;
  patch: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void;
}) {
  return (
    <>
      <p className="mono" style={{ opacity: 0.7, marginBottom: 24, maxWidth: 640 }}>
        Para comprovar a propriedade do site nos buscadores e redes, cole aqui apenas o valor
        (content) que cada plataforma oferece — geralmente uma string curta. As meta tags serão
        injetadas automaticamente no &lt;head&gt; do site.
      </p>

      <div className="admin-grid-2">
        <Field label="Google Search Console (content)" full>
          <input
            className="admin-field__input"
            value={s.google_site_verification ?? ""}
            onChange={(e) => patch("google_site_verification", e.target.value)}
            placeholder="abc123XYZ…"
          />
          <p className="mono" style={{ fontSize: "var(--admin-fs-xs)", opacity: 0.6, marginTop: 4 }}>
            Em search.google.com/search-console, escolha "HTML tag" e cole apenas o content.
          </p>
        </Field>
        <Field label="Bing Webmaster (msvalidate.01)">
          <input
            className="admin-field__input"
            value={s.bing_site_verification ?? ""}
            onChange={(e) => patch("bing_site_verification", e.target.value)}
          />
        </Field>
        <Field label="Yandex">
          <input
            className="admin-field__input"
            value={s.yandex_verification ?? ""}
            onChange={(e) => patch("yandex_verification", e.target.value)}
          />
        </Field>
        <Field label="Facebook domain verification">
          <input
            className="admin-field__input"
            value={s.facebook_domain_verification ?? ""}
            onChange={(e) => patch("facebook_domain_verification", e.target.value)}
          />
        </Field>
        <Field label="Pinterest (p:domain_verify)">
          <input
            className="admin-field__input"
            value={s.pinterest_site_verification ?? ""}
            onChange={(e) => patch("pinterest_site_verification", e.target.value)}
          />
        </Field>
      </div>

      <section className="admin-section">
        <h2 className="admin-section__title">Status</h2>
        <ul className="seo-status-list mono">
          <StatusRow label="Google Search Console" ok={!!s.google_site_verification} />
          <StatusRow label="Bing Webmaster" ok={!!s.bing_site_verification} />
          <StatusRow label="Yandex" ok={!!s.yandex_verification} />
          <StatusRow label="Facebook" ok={!!s.facebook_domain_verification} />
          <StatusRow label="Pinterest" ok={!!s.pinterest_site_verification} />
        </ul>
      </section>
    </>
  );
}

// =============================================================
//  Aba: Analytics & Pixels
// =============================================================
function AnalyticsTab({
  s,
  patch,
}: {
  s: SiteSettings;
  patch: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void;
}) {
  const adsId = (s.google_ads_conversion_id ?? "").trim();
  const adsIdInvalid = !!adsId && !validTrackerId("googleAds", adsId);
  const labelInvalid = (v: string | null) => !!(v ?? "").trim() && !validAdsLabel(v);
  const testCode = (s.meta_capi_test_event_code ?? "").trim();

  return (
    <>
      <p className="mono" style={{ opacity: 0.7, marginBottom: 24, maxWidth: 640 }}>
        Cole os IDs das plataformas de analytics. Os scripts serão carregados automaticamente no
        site — não é necessário editar código. Tudo só roda para quem aceitou os cookies.
      </p>

      <div className="admin-grid-2">
        <Field label="Google Analytics 4 (G-XXXXXXX)">
          <input
            className="admin-field__input"
            value={s.google_analytics_id ?? ""}
            onChange={(e) => patch("google_analytics_id", e.target.value)}
            placeholder="G-ABC123XYZ"
          />
        </Field>
        <Field label="Google Tag Manager (GTM-XXXXXXX)">
          <input
            className="admin-field__input"
            value={s.google_tag_manager_id ?? ""}
            onChange={(e) => patch("google_tag_manager_id", e.target.value)}
            placeholder="GTM-XXXXXXX"
          />
        </Field>
        <Field label="Google Ads — ID da conta (AW-XXXXXXX)">
          <input
            className="admin-field__input"
            value={s.google_ads_conversion_id ?? ""}
            onChange={(e) => patch("google_ads_conversion_id", e.target.value)}
            placeholder="AW-123456789"
            aria-invalid={adsIdInvalid || undefined}
          />
          <FieldHint warn={adsIdInvalid}>
            {adsIdInvalid
              ? "Formato inválido: use AW- seguido só de números. Assim a tag não é carregada."
              : "Carrega a tag do Google Ads no site. Sem os rótulos abaixo, nenhuma conversão é enviada."}
          </FieldHint>
        </Field>
        <Field label="Google Ads — rótulo da conversão de lead">
          <input
            className="admin-field__input"
            value={s.google_ads_lead_label ?? ""}
            onChange={(e) => patch("google_ads_lead_label", e.target.value)}
            placeholder="AbC-D_efG-h12"
            aria-invalid={labelInvalid(s.google_ads_lead_label) || undefined}
          />
          <FieldHint warn={labelInvalid(s.google_ads_lead_label)}>
            {labelInvalid(s.google_ads_lead_label)
              ? "Rótulo inválido: só letras, números, - e _."
              : "No Google Ads: Metas › Conversões › a ação de lead › Configuração da tag › a parte depois de \"AW-…/\". Enviada nos formulários de orçamento e contato, com conversões otimizadas (e-mail e telefone)."}
          </FieldHint>
        </Field>
        <Field label="Google Ads — rótulo da conversão de contato (opcional)">
          <input
            className="admin-field__input"
            value={s.google_ads_contact_label ?? ""}
            onChange={(e) => patch("google_ads_contact_label", e.target.value)}
            placeholder="XyZ-1_abC-d34"
            aria-invalid={labelInvalid(s.google_ads_contact_label) || undefined}
          />
          <FieldHint warn={labelInvalid(s.google_ads_contact_label)}>
            {labelInvalid(s.google_ads_contact_label)
              ? "Rótulo inválido: só letras, números, - e _."
              : "Clique em WhatsApp ou telefone. Deixe vazio se não quiser contar isso como conversão."}
          </FieldHint>
        </Field>
        <Field label="Meta Pixel (Facebook)">
          <input
            className="admin-field__input"
            value={s.meta_pixel_id ?? ""}
            onChange={(e) => patch("meta_pixel_id", e.target.value)}
            placeholder="1234567890"
          />
          <FieldHint>
            Além do PageView: Lead (formulários de cliente), Contact (WhatsApp/telefone) e
            ViewContent (páginas de projeto). O lead também vai pela API de Conversões, com o mesmo
            id — o Meta conta uma vez só.
          </FieldHint>
        </Field>
        <Field label="Meta — código de teste da API de Conversões (opcional)">
          <input
            className="admin-field__input"
            value={s.meta_capi_test_event_code ?? ""}
            onChange={(e) => patch("meta_capi_test_event_code", e.target.value)}
            placeholder="TEST12345"
          />
          <FieldHint warn={!!testCode}>
            {testCode
              ? "Modo de teste ligado: os leads enviados pelo servidor aparecem em Gerenciador de Eventos › Testar eventos e NÃO contam nas campanhas. Apague o código quando terminar."
              : "Só para validar a integração (Gerenciador de Eventos › Testar eventos). Vazio = eventos reais."}
          </FieldHint>
        </Field>
        <Field label="Microsoft Clarity">
          <input
            className="admin-field__input"
            value={s.clarity_id ?? ""}
            onChange={(e) => patch("clarity_id", e.target.value)}
          />
        </Field>
        <Field label="Hotjar Site ID">
          <input
            className="admin-field__input"
            value={s.hotjar_id ?? ""}
            onChange={(e) => patch("hotjar_id", e.target.value)}
          />
        </Field>
      </div>
    </>
  );
}

// =============================================================
//  Aba: Local Business
// =============================================================
function LocalTab({
  s,
  patch,
}: {
  s: SiteSettings;
  patch: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void;
}) {
  return (
    <>
      <p className="mono" style={{ opacity: 0.7, marginBottom: 24, maxWidth: 720 }}>
        Dados de negócio local ajudam o Google a exibir seu estúdio em buscas geográficas, Maps e
        no "Google Meu Negócio". Preencha com precisão — o schema LocalBusiness gerado é enviado
        a cada carregamento de página.
      </p>

      <div className="admin-grid-2">
        <Field label="Tipo de negócio (schema.org)">
          <select
            className="admin-field__input"
            value={s.business_type ?? "ProfessionalService"}
            onChange={(e) => patch("business_type", e.target.value)}
          >
            <option value="ProfessionalService">ProfessionalService</option>
            <option value="LocalBusiness">LocalBusiness</option>
            <option value="Architect">Architect</option>
            <option value="InteriorDesignStudio">InteriorDesignStudio</option>
          </select>
        </Field>
        <Field label="Ano de fundação">
          <input
            className="admin-field__input"
            value={s.business_founding_year ?? ""}
            onChange={(e) => patch("business_founding_year", e.target.value)}
            placeholder="2020"
          />
        </Field>
        <Field label="Faixa de preço (priceRange)">
          <select
            className="admin-field__input"
            value={s.business_price_range ?? "$$$"}
            onChange={(e) => patch("business_price_range", e.target.value)}
          >
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
            <option value="$$$$">$$$$</option>
          </select>
        </Field>
        <Field label="CEP">
          <input
            className="admin-field__input"
            value={s.business_postal_code ?? ""}
            onChange={(e) => patch("business_postal_code", e.target.value)}
            placeholder="38400-000"
          />
        </Field>
        <Field label="Horário de atendimento" full>
          <input
            className="admin-field__input"
            value={s.business_opening_hours ?? ""}
            onChange={(e) => patch("business_opening_hours", e.target.value)}
            placeholder="Mo-Fr 09:00-18:00"
          />
          <p className="mono" style={{ fontSize: "var(--admin-fs-xs)", opacity: 0.6, marginTop: 4 }}>
            Formato schema.org: Mo, Tu, We, Th, Fr, Sa, Su — intervalos 24h.
          </p>
        </Field>
        <Field label="URL do Google Maps" full>
          <input
            className="admin-field__input"
            value={s.google_maps_url ?? ""}
            onChange={(e) => patch("google_maps_url", e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
          />
        </Field>
        <Field label="Google Business Profile (perfil público)" full>
          <input
            className="admin-field__input"
            value={s.google_business_profile_url ?? ""}
            onChange={(e) => patch("google_business_profile_url", e.target.value)}
            placeholder="https://g.page/…"
          />
        </Field>
      </div>
    </>
  );
}

// =============================================================
//  Aba: Sitemap & Robots
// =============================================================
function SitemapTab({
  s,
  onMarkSubmitted,
}: {
  s: SiteSettings;
  onMarkSubmitted: () => void;
}) {
  const base = (s.seo_canonical_base || "https://bewild.com.br").replace(/\/$/, "");
  const sitemapPublic = `${base}/sitemap.xml`;
  const [generating, setGenerating] = useState(false);
  const [snapshot, setSnapshot] = useState<SitemapSnapshot | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const lastSubmit = s.seo_last_search_console_submit
    ? new Date(s.seo_last_search_console_submit).toLocaleString("pt-BR")
    : "nunca";

  async function generateSitemap() {
    setGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch(`${SITEMAP_URL}?refresh=${Date.now()}`, {
        headers: { Accept: "application/xml" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Falha ao gerar o sitemap (HTTP ${response.status}).`);
      const nextSnapshot = parseSitemapXml(await response.text());
      setSnapshot(nextSnapshot);
    } catch (error) {
      setSnapshot(null);
      setGenerationError(error instanceof Error ? error.message : "Não foi possível gerar o sitemap.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <p className="mono" style={{ opacity: 0.7, marginBottom: 16, maxWidth: 720 }}>
        São gerados dinamicamente a partir dos projetos visíveis. Use estas URLs para enviar ao
        Google Search Console.
      </p>

      <section className="admin-section" aria-labelledby="sitemap-generator-title">
        <div className="admin-section__head">
          <div>
            <h2 className="admin-section__title" id="sitemap-generator-title">
              Gerador do sitemap
            </h2>
            <p className="mono seo-sitemap-note">
              Lê os projetos visíveis e publicados e gera o XML atualizado na hora.
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={generateSitemap}
            disabled={generating}
          >
            {generating ? "gerando…" : "gerar sitemap agora"}
          </button>
        </div>

        {generationError && (
          <p className="admin-flash admin-flash--err mono" role="alert">
            {generationError}
          </p>
        )}

        {!snapshot && !generationError && (
          <p className="mono seo-sitemap-empty">Gere o arquivo para conferir as URLs incluídas.</p>
        )}

        {snapshot && (
          <div aria-live="polite">
            <p className="admin-flash admin-flash--ok mono">
              Sitemap válido gerado em {snapshot.generatedAt.toLocaleString("pt-BR")}.
            </p>
            <div className="admin-cards seo-sitemap-stats">
              <Stat label="Total de URLs" value={snapshot.total} />
              <Stat label="Projetos" value={snapshot.projects} />
              <Stat label="Conteúdos" value={snapshot.posts} />
              <Stat label="Páginas fixas" value={snapshot.pages} />
            </div>
            <div className="seo-sitemap-actions">
              <a className="admin-btn" href={SITEMAP_URL} target="_blank" rel="noreferrer">
                abrir XML
              </a>
              <button type="button" className="admin-btn" onClick={() => downloadSitemap(snapshot)}>
                baixar sitemap.xml
              </button>
            </div>
            <details className="seo-sitemap-preview">
              <summary>Ver URLs incluídas</summary>
              <ol>
                {snapshot.urls.map((url) => (
                  <li key={url} className="mono">{url}</li>
                ))}
              </ol>
            </details>
          </div>
        )}
      </section>

      <p className="mono seo-sitemap-publish-note">
        O sitemap dinâmico acima é atualizado imediatamente. O arquivo público em {sitemapPublic} é
        substituído automaticamente na próxima publicação do site.
      </p>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 180 }}>Recurso</th>
              <th>URL</th>
              <th style={{ width: 140 }}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">sitemap.xml (público)</td>
              <td>
                <a className="admin-link" href={sitemapPublic} target="_blank" rel="noreferrer">
                  {sitemapPublic}
                </a>
              </td>
              <td style={{ textAlign: "right" }}>
                <CopyBtn text={sitemapPublic} />
              </td>
            </tr>
            <tr>
              <td className="mono">sitemap.xml (edge)</td>
              <td>
                <a className="admin-link" href={SITEMAP_URL} target="_blank" rel="noreferrer">
                  {SITEMAP_URL}
                </a>
              </td>
              <td style={{ textAlign: "right" }}>
                <CopyBtn text={SITEMAP_URL} />
              </td>
            </tr>
            <tr>
              <td className="mono">robots.txt</td>
              <td>
                <a className="admin-link" href={ROBOTS_URL} target="_blank" rel="noreferrer">
                  {ROBOTS_URL}
                </a>
              </td>
              <td style={{ textAlign: "right" }}>
                <CopyBtn text={ROBOTS_URL} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="admin-section">
        <h2 className="admin-section__title">Envie ao Google</h2>
        <ol className="seo-steps">
          <li>
            Abra o{" "}
            <a
              className="admin-link"
              href="https://search.google.com/search-console/sitemaps"
              target="_blank"
              rel="noreferrer"
            >
              Google Search Console › Sitemaps
            </a>
            .
          </li>
          <li>Cole a URL do sitemap público acima e clique em "Enviar".</li>
          <li>Aguarde de 24h a 7 dias para o Google processar.</li>
          <li>
            Volte aqui e clique em "marcar como enviado" para registrar a data.
          </li>
        </ol>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
          <button className="admin-btn admin-btn--ghost" onClick={onMarkSubmitted}>
            marcar como enviado agora
          </button>
          <span className="mono" style={{ opacity: 0.65 }}>
            Último envio registrado: {lastSubmit}
          </span>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section__title">Atalhos úteis</h2>
        <div className="admin-link-grid">
          <ExternalLink
            href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(base)}`}
            title="Teste de Resultados Enriquecidos"
            desc="Verifica seu JSON-LD"
          />
          <ExternalLink
            href={`https://pagespeed.web.dev/?url=${encodeURIComponent(base)}`}
            title="PageSpeed Insights"
            desc="Core Web Vitals"
          />
          <ExternalLink
            href={`https://search.google.com/test/mobile-friendly?url=${encodeURIComponent(base)}`}
            title="Teste Mobile-Friendly"
            desc="Compatibilidade móvel"
          />
          <ExternalLink
            href={`https://www.google.com/search?q=site%3A${encodeURIComponent(
              base.replace(/^https?:\/\//, "")
            )}`}
            title="Ver páginas indexadas"
            desc="site: no Google"
          />
        </div>
      </section>
    </>
  );
}

// =============================================================
//  Aba: Auditoria
// =============================================================
function AuditTab({
  audit,
  auditing,
  error,
  lastAuditAt,
  onRun,
}: {
  audit: PublicPageAudit | null;
  auditing: boolean;
  error: string | null;
  lastAuditAt: string | null;
  onRun: (path: string) => void;
}) {
  const [path, setPath] = useState("/");
  const grouped = useMemo(() => {
    if (!audit) return {} as Record<string, PublicPageAudit["issues"]>;
    const g: Record<string, PublicPageAudit["issues"]> = {};
    for (const i of audit.issues) {
      g[i.area] = g[i.area] || [];
      g[i.area].push(i);
    }
    return g;
  }, [audit]);

  return (
    <>
      <p className="mono" style={{ opacity: 0.7, marginBottom: 16, maxWidth: 720 }}>
        A auditoria abre a página pública escolhida numa janela oculta, espera o site terminar de
        carregar e analisa título, descrição, canonical, hierarquia, imagens e dados estruturados
        dela — não desta tela do painel. Por padrão, a home.
      </p>

      <form
        style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!auditing) onRun(path);
        }}
      >
        <label className="admin-field" htmlFor="seo-audit-path" style={{ margin: 0, minWidth: 260 }}>
          <span className="admin-field__label mono">Página a auditar</span>
          <input
            id="seo-audit-path"
            className="admin-field__input"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/ ou /portfolio"
            spellCheck={false}
          />
        </label>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={auditing}>
          {auditing ? "auditando…" : "rodar auditoria agora"}
        </button>
        {audit && !auditing && (
          <span className="mono" style={{ opacity: 0.7 }}>
            {audit.path} · {audit.issues.length} verificações · score {audit.score}/100
          </span>
        )}
      </form>

      {lastAuditAt && (
        <p className="mono admin-hint" style={{ marginTop: -12, marginBottom: 16 }}>
          Última auditoria registrada: {new Date(lastAuditAt).toLocaleString("pt-BR")}
        </p>
      )}

      {error && (
        <p className="admin-flash admin-flash--err mono" role="alert">
          {error}
        </p>
      )}

      {audit?.timedOut && (
        <p className="admin-flash admin-flash--err mono" role="status">
          A página demorou para terminar de carregar; o resultado pode estar incompleto. Rode de novo
          se algo parecer errado.
        </p>
      )}

      {audit && (
        <>
          <div className={`seo-score seo-score--${scoreClass(audit.score)}`}>
            <div className="seo-score__value">{audit.score}</div>
            <div className="seo-score__label mono">de 100 · {audit.path}</div>
          </div>

          <section className="admin-section">
            <h2 className="admin-section__title">Estatísticas</h2>
            <div className="admin-cards">
              <Stat label="Título" value={`${audit.stats.titleLen} car.`} />
              <Stat label="Descrição" value={`${audit.stats.descLen} car.`} />
              <Stat label="h1 / h2" value={`${audit.stats.h1Count} / ${audit.stats.h2Count}`} />
              <Stat
                label="Imagens sem alt"
                value={`${audit.stats.imagesWithoutAlt} / ${audit.stats.imagesTotal}`}
              />
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section__title">Problemas e sugestões</h2>
            {Object.entries(grouped).map(([area, items]) => (
              <div key={area} style={{ marginBottom: 16 }}>
                <h3 className="mono" style={{ fontSize: "var(--admin-fs-sm)", opacity: 0.7, marginBottom: 6 }}>
                  {area}
                </h3>
                <ul className="seo-issues">
                  {items.map((i) => (
                    <li key={i.id} className={`seo-issue seo-issue--${i.level}`}>
                      <span className={`seo-issue__dot seo-issue__dot--${i.level}`} />
                      <div>
                        <strong>{i.message}</strong>
                        {i.hint && <p className="mono seo-issue__hint">{i.hint}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}

function scoreClass(n: number) {
  if (n >= 85) return "good";
  if (n >= 60) return "warn";
  return "bad";
}

// =============================================================
//  Aba: Guia Google
// =============================================================
function GuideTab({ s }: { s: SiteSettings }) {
  const base = (s.seo_canonical_base || "https://bewild.com.br").replace(/\/$/, "");
  const domain = base.replace(/^https?:\/\//, "");

  return (
    <>
      <p className="mono" style={{ opacity: 0.7, marginBottom: 24, maxWidth: 720 }}>
        Guia passo-a-passo para registrar oficialmente o site no Google e começar a aparecer nas
        buscas. Siga na ordem — leva cerca de 30 minutos e o Google reconhece seu site em 3 a 14
        dias.
      </p>

      <div className="seo-guide">
        <GuideStep
          n="01"
          title="Crie sua conta no Google Search Console"
          desc="É a ferramenta oficial do Google para donos de site. Essencial para monitorar buscas, erros de indexação e performance."
          action={{
            label: "Abrir Search Console",
            href: "https://search.google.com/search-console/welcome",
          }}
        />
        <GuideStep
          n="02"
          title="Adicione o domínio como propriedade"
          desc={`Escolha o tipo "Domínio" e adicione ${domain}. É preciso adicionar um registro DNS TXT no seu provedor (Registro.br, GoDaddy, etc.). Se preferir mais simples, escolha "Prefixo do URL" e cole ${base}.`}
        />
        <GuideStep
          n="03"
          title="Verifique a propriedade via meta tag"
          desc="Se escolheu 'Prefixo do URL', o Google mostra um código (ex.: google123abc). Copie só o conteúdo entre aspas do atributo content e cole em Admin › SEO › Verificações › Google Search Console. Salve, aguarde 1 minuto e clique em 'Verificar'."
        />
        <GuideStep
          n="04"
          title="Envie seu sitemap.xml"
          desc={`Em Search Console › Sitemaps, envie: ${base}/sitemap.xml. Se seu host não redireciona /sitemap.xml para a edge function, use a URL direta que aparece na aba Sitemap & Robots.`}
          action={{
            label: "Abrir aba Sitemaps",
            href: "https://search.google.com/search-console/sitemaps",
          }}
        />
        <GuideStep
          n="05"
          title="Solicite a indexação da home"
          desc="Em Search Console, cole a URL da home no campo de inspeção no topo. O Google verifica e mostra um botão 'Solicitar indexação'. Repita para as páginas mais importantes (portfólio, projetos em destaque)."
        />
        <GuideStep
          n="06"
          title="Crie seu Perfil da Empresa (Google Business Profile)"
          desc="Essencial para buscas locais em São Paulo. Adicione foto, endereço, telefone, horário e link do site. Leva até 14 dias para o Google verificar por carta ou telefone."
          action={{
            label: "Abrir Google Business",
            href: "https://business.google.com/create",
          }}
        />
        <GuideStep
          n="07"
          title="Configure o Google Analytics 4 (GA4)"
          desc="Crie uma propriedade GA4 e copie o ID (começa com G-). Cole em Admin › SEO › Analytics & Pixels. O tracking é ativado automaticamente."
          action={{
            label: "Abrir Analytics",
            href: "https://analytics.google.com/analytics/web/",
          }}
        />
        <GuideStep
          n="08"
          title="Registre no Bing Webmaster (opcional)"
          desc="O Bing alimenta também o ChatGPT e o Copilot. Vale o esforço de 2 minutos."
          action={{
            label: "Abrir Bing Webmaster",
            href: "https://www.bing.com/webmasters",
          }}
        />
        <GuideStep
          n="09"
          title="Monitore após 7 dias"
          desc="Volte ao Search Console em uma semana para checar: (a) páginas indexadas, (b) consultas que trazem tráfego, (c) erros de rastreamento. Ajuste títulos e descrições com base nas palavras-chave que os usuários digitam."
        />
        <GuideStep
          n="10"
          title="Auditoria mensal"
          desc="Rode a aba Auditoria deste admin todo mês para detectar imagens sem alt, h1 duplicados e problemas que podem derrubar seu score."
        />
      </div>
    </>
  );
}

// =============================================================
//  Sub-componentes
// =============================================================
function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    // `alignContent: start`: um campo com dica mais longa ao lado não estica
    // a caixa de texto deste.
    <label className={`admin-field ${full ? "admin-field--full" : ""}`} style={{ alignContent: "start" }}>
      <span className="admin-field__label mono">{label}</span>
      {children}
    </label>
  );
}

function FieldHint({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <span
      className="mono"
      role={warn ? "alert" : undefined}
      style={{
        display: "block",
        fontSize: "var(--admin-fs-xs)",
        opacity: warn ? 1 : 0.6,
        marginTop: 4,
        color: warn ? "#b3261e" : undefined,
      }}
    >
      {children}
    </span>
  );
}

function Hint({ count, max }: { count: number; max: number }) {
  const over = count > max;
  return (
    <span
      className="mono"
      style={{
        fontSize: "var(--admin-fs-xs)",
        opacity: 0.6,
        marginTop: 4,
        color: over ? "tomato" : undefined,
      }}
    >
      {count} / {max}
    </span>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="seo-status-row">
      <span className={`seo-status-dot ${ok ? "is-ok" : "is-off"}`} />
      <span className="seo-status-label">{label}</span>
      <span className="seo-status-state mono">{ok ? "configurado" : "não configurado"}</span>
    </li>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      className="admin-btn admin-btn--ghost admin-btn--sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("copied");
        } catch {
          // Clipboard bloqueado (permissão/iframe): o link continua visível ao lado.
          setState("failed");
        }
        setTimeout(() => setState("idle"), 1500);
      }}
    >
      {state === "copied" ? "copiado" : state === "failed" ? "não copiou" : "copiar"}
    </button>
  );
}

function ExternalLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <a className="admin-ext-link" href={href} target="_blank" rel="noreferrer">
      <span className="admin-ext-link__title">{title}</span>
      <span className="admin-ext-link__desc mono">{desc}</span>
      <span className="admin-ext-link__arrow" aria-hidden>
        ↗
      </span>
    </a>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-card">
      <span className="admin-card__label mono">{label}</span>
      <span className="admin-card__value">{value}</span>
    </div>
  );
}

function GuideStep({
  n,
  title,
  desc,
  action,
}: {
  n: string;
  title: string;
  desc: string;
  action?: { label: string; href: string };
}) {
  return (
    <article className="seo-guide__step">
      <div className="seo-guide__num mono">{n}</div>
      <div className="seo-guide__body">
        <h3 className="seo-guide__title">{title}</h3>
        <p className="seo-guide__desc">{desc}</p>
        {action && (
          <a
            className="admin-btn admin-btn--ghost admin-btn--sm"
            href={action.href}
            target="_blank"
            rel="noreferrer"
          >
            {action.label} ↗
          </a>
        )}
      </div>
    </article>
  );
}
