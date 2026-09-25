/**
 * /admin/integracoes — o que está ligado entre o site, a Meta, o Google e o
 * CRM, e o último sinal de cada integração.
 *
 * Quatro blocos:
 *  1. Status: Pixel da Meta, API de Conversões, campanhas/formulários da Meta,
 *     Google Ads, GA4/GTM e o pixel próprio (regras em src/lib/integrations.ts).
 *  2. Pixel próprio e links rastreados: monta o pixel 1×1 (e-mail ou página
 *     externa) e o link rastreado para copiar, e mostra o resumo por campanha
 *     dos últimos 30 dias (edge function `px`, tabela `tracking_hits`).
 *  3. Exportação para planilha e BI: chaves revogáveis da edge function
 *     `data-export` (src/components/admin/ExportKeysPanel.tsx).
 *  4. Registro: os últimos envios à Meta e rodadas da sincronização
 *     (`integration_log`, sem dados pessoais).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import BewildAdminShell from "@/components/admin/BewildAdminShell";
import AdminAlert from "@/components/admin/AdminAlert";
import ExportKeysPanel from "@/components/admin/ExportKeysPanel";
import {
  capiStatus,
  fetchIntegrationLog,
  fetchIntegrationSettings,
  googleAdsStatus,
  googleAnalyticsStatus,
  INTEGRATION_LABEL,
  logDetail,
  metaAdsStatus,
  pixelProprioStatus,
  pixelStatus,
  type IntegrationLogRow,
  type IntegrationSettings,
  type IntegrationStatus,
  type Tone,
} from "@/lib/integrations";
import { fetchMetaSyncStates, relativeTime, type MetaSyncStateRow } from "@/lib/metaAds";
import {
  buildPixelTag,
  buildPixelUrl,
  buildTrackedLink,
  EMPTY_TRACKING_FIELDS,
  fetchHitSummary,
  fetchPixelActivity,
  invalidFields,
  REDIRECT_HOSTS,
  type HitSummaryRow,
  type TrackingFields,
} from "@/lib/tracking";

const TONE_TAG: Record<Tone, string> = {
  ok: "bw-admin__tag bw-admin__tag--ok",
  warn: "bw-admin__tag bw-admin__tag--warn",
  error: "bw-admin__tag bw-admin__tag--warn",
  off: "bw-admin__tag bw-admin__tag--off",
};

const LOG_TAG: Record<string, string> = {
  sent: "bw-admin__tag bw-admin__tag--ok",
  skipped: "bw-admin__tag bw-admin__tag--off",
  error: "bw-admin__tag bw-admin__tag--warn",
};
const LOG_LABEL: Record<string, string> = { sent: "enviado", skipped: "pulado", error: "erro" };

const FIELD_LABEL: Record<keyof TrackingFields, string> = {
  campaign: "Campanha (utm_campaign)",
  source: "Origem (utm_source)",
  medium: "Meio (utm_medium)",
  content: "Conteúdo (utm_content)",
  term: "Termo (utm_term)",
};

const FIELD_HINT: Record<keyof TrackingFields, string> = {
  campaign: "obrigatória — ex.: nutricao_qualificados, feira-casa-cor",
  source: "ex.: email, instagram, qrcode",
  medium: "ex.: crm, bio, impresso",
  content: "ex.: o post ou a peça",
  term: "opcional",
};

function fmtDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function IntegracoesPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<IntegrationSettings | null>(null);
  const [logs, setLogs] = useState<IntegrationLogRow[]>([]);
  const [states, setStates] = useState<MetaSyncStateRow[]>([]);
  const [activity, setActivity] = useState<{ lastAt: string | null; last7d: number | null }>({ lastAt: null, last7d: null });
  const [summary, setSummary] = useState<HitSummaryRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fields, setFields] = useState<TrackingFields>(EMPTY_TRACKING_FIELDS);
  const [destination, setDestination] = useState("https://bewild.com.br/");
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const [s, l, st, act, sum] = await Promise.all([
      fetchIntegrationSettings(),
      fetchIntegrationLog(200),
      fetchMetaSyncStates(),
      fetchPixelActivity(now),
      fetchHitSummary(new Date(now.getTime() - 30 * 86_400_000), now),
    ]);
    setSettings(s.settings);
    setLogs(l.rows);
    setStates(st.states);
    setActivity({ lastAt: act.lastAt, last7d: act.last7d });
    setSummary(sum.rows);
    setErrors([s.error, l.error, st.error, act.error, sum.error].filter((e): e is string => !!e));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const statuses: IntegrationStatus[] = useMemo(() => {
    const s: IntegrationSettings = settings ?? {
      meta_pixel_id: null,
      meta_capi_test_event_code: null,
      google_ads_conversion_id: null,
      google_ads_lead_label: null,
      google_ads_contact_label: null,
      google_analytics_id: null,
      google_tag_manager_id: null,
    };
    return [
      pixelStatus(s),
      capiStatus(s, logs),
      metaAdsStatus(states),
      googleAdsStatus(s),
      googleAnalyticsStatus(s),
      pixelProprioStatus(activity.lastAt, activity.last7d),
    ];
  }, [settings, logs, states, activity]);

  const bad = invalidFields(fields);
  const openUrl = bad.length ? null : buildPixelUrl(fields, "open");
  const viewUrl = bad.length ? null : buildPixelUrl(fields, "view");
  const link = bad.length ? null : buildTrackedLink(destination, fields);

  async function doCopy(key: string, text: string) {
    const ok = await copy(text);
    setCopied(ok ? key : null);
    if (ok) window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
  }

  return (
    <BewildAdminShell
      active="site"
      eyebrow="Site"
      title="Integrações"
      description="O que está ligado entre o site, a Meta, o Google e o CRM — e o último sinal de cada integração. Tokens e chaves ficam nos segredos do projeto, nunca aqui."
      actions={
        <button type="button" className="bw-admin__btn bw-admin__btn--sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw aria-hidden /> {loading ? "Carregando…" : "Atualizar"}
        </button>
      }
    >
      {errors.length > 0 && !loading && (
        <AdminAlert kind="warn">Parte das informações não pôde ser lida: {errors.join(" · ")}</AdminAlert>
      )}

      <section className="bw-admin__section">
        <header className="bw-admin__section-head">
          <h2 className="bw-admin__section-title">Status</h2>
          <p className="bw-admin__section-desc">Estado atual de cada integração.</p>
        </header>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}
          data-testid="integration-status"
        >
          {statuses.map((st) => (
            <div key={st.key} className="bw-admin__kpi-card" style={{ display: "grid", gap: 8, alignContent: "start" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <p className="bw-admin__kpi-label" style={{ margin: 0 }}>
                  {st.label}
                </p>
                <span className={TONE_TAG[st.tone]}>{loading ? "…" : st.value}</span>
              </div>
              <p className="bw-admin__kpi-sub" style={{ margin: 0 }}>
                {loading ? "Carregando…" : st.detail}
              </p>
              {st.href && (
                <a className="bw-admin__section-link" href={st.href} style={{ justifySelf: "start" }}>
                  {st.hrefLabel ?? "abrir"}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bw-admin__section">
        <header className="bw-admin__section-head">
          <h2 className="bw-admin__section-title">Pixel próprio e links rastreados</h2>
          <p className="bw-admin__section-desc">
            Conta aberturas de e-mail, visitas a páginas de fora do site e cliques — por campanha, sem guardar dado de
            quem abriu ou clicou. Nunca coloque e-mail ou nome nos campos.
          </p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {(Object.keys(FIELD_LABEL) as (keyof TrackingFields)[]).map((k) => (
            <label key={k} style={{ display: "grid", gap: 4, fontSize: 13, alignContent: "start" }}>
              <span style={{ fontWeight: 600 }}>{FIELD_LABEL[k]}</span>
              <input
                type="text"
                value={fields[k]}
                maxLength={100}
                onChange={(e) => setFields((f) => ({ ...f, [k]: e.target.value }))}
                aria-invalid={bad.includes(k)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: `1px solid ${bad.includes(k) ? "#B3261E" : "var(--bw-border, #d6d3cc)"}`,
                  fontSize: 14,
                }}
              />
              <span className="muted" style={{ fontSize: 12 }}>
                {bad.includes(k) ? "Use letras, números, espaço e . _ - : / + |" : FIELD_HINT[k]}
              </span>
            </label>
          ))}
        </div>

        <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
          <Output
            label="Pixel de abertura (e-mail) — cole no HTML do e-mail"
            value={openUrl ? buildPixelTag(openUrl) : null}
            empty="Informe a campanha para gerar o pixel."
            copied={copied === "open"}
            onCopy={(v) => void doCopy("open", v)}
          />
          <Output
            label="Pixel de visualização (página fora do site)"
            value={viewUrl ? buildPixelTag(viewUrl) : null}
            empty="Informe a campanha para gerar o pixel."
            copied={copied === "view"}
            onCopy={(v) => void doCopy("view", v)}
          />
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            <span style={{ fontWeight: 600 }}>Destino do link rastreado</span>
            <input
              type="url"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid var(--bw-border, #d6d3cc)", fontSize: 14 }}
            />
            <span className="muted" style={{ fontSize: 12 }}>
              Só https de {REDIRECT_HOSTS.join(", ")}. No site, a campanha vira utm_* e a visita aparece atribuída no
              Analytics.
            </span>
          </label>
          <Output
            label="Link rastreado (e-mail, WhatsApp, QR code, bio)"
            value={link && link.ok ? link.url : null}
            empty={link && !link.ok ? link.error : "Informe a campanha e um destino válido."}
            copied={copied === "link"}
            onCopy={(v) => void doCopy("link", v)}
          />
        </div>

        <h3 style={{ fontSize: 15, margin: "26px 0 8px" }}>Últimos 30 dias por campanha</h3>
        {loading ? (
          <p className="bw-admin__empty">Carregando…</p>
        ) : summary.length === 0 ? (
          <p className="bw-admin__empty">Nenhum acesso ainda. A nutrição por e-mail já sai com o pixel de abertura.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="bw-admin__table" data-testid="hits-summary">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Origem · meio</th>
                  <th>Conteúdo</th>
                  <th className="num">Aberturas</th>
                  <th className="num">Visualizações</th>
                  <th className="num">Cliques</th>
                  <th className="num">Robôs (fora)</th>
                  <th>Último</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((r, i) => (
                  <tr key={`${r.campaign}-${r.source}-${r.medium}-${r.content}-${i}`}>
                    <td>{r.campaign ?? "—"}</td>
                    <td className="muted">{[r.source, r.medium].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="muted">{r.content ?? "—"}</td>
                    <td className="num">{r.opens}</td>
                    <td className="num">{r.views}</td>
                    <td className="num">{r.clicks}</td>
                    <td className="num muted">{r.bots}</td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>
                      {relativeTime(r.last_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          Aberturas contam quando o programa de e-mail baixa as imagens: o Apple Mail baixa sozinho (conta a mais) e
          alguns programas bloqueiam imagens (conta a menos). Prévias de link do WhatsApp, Slack e Facebook ficam em
          "robôs" e não entram nas contagens.
        </p>
      </section>

      <ExportKeysPanel />

      <section className="bw-admin__section">
        <header className="bw-admin__section-head">
          <h2 className="bw-admin__section-title">Registro das integrações</h2>
          <p className="bw-admin__section-desc">Envios à Meta e rodadas da sincronização, sem dados pessoais.</p>
        </header>
        {loading ? (
          <p className="bw-admin__empty">Carregando…</p>
        ) : logs.length === 0 ? (
          <p className="bw-admin__empty">Nenhum envio registrado ainda.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="bw-admin__table" data-testid="integration-log">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Integração</th>
                  <th>Evento</th>
                  <th>Resultado</th>
                  <th>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 50).map((r) => (
                  <tr key={r.id}>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>
                      {fmtDateTime(r.created_at)}
                    </td>
                    <td>{INTEGRATION_LABEL[r.integration] ?? r.integration}</td>
                    <td className="muted">{r.event_name ?? "—"}</td>
                    <td>
                      <span className={LOG_TAG[r.status] ?? "bw-admin__tag"}>{LOG_LABEL[r.status] ?? r.status}</span>
                      {r.http_status ? <span className="muted" style={{ fontSize: 12 }}> · HTTP {r.http_status}</span> : null}
                    </td>
                    <td className="muted" style={{ fontSize: 12.5 }}>
                      {logDetail(r)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </BewildAdminShell>
  );
}

function Output({
  label,
  value,
  empty,
  copied,
  onCopy,
}: {
  label: string;
  value: string | null;
  empty: string;
  copied: boolean;
  onCopy: (value: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {value ? (
        <div style={{ display: "flex", gap: 8, alignItems: "stretch", minWidth: 0 }}>
          <input
            readOnly
            value={value}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={label}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--bw-border, #d6d3cc)",
              fontFamily: "var(--bw-mono, monospace)",
              fontSize: 12.5,
              background: "#FBFAF5",
            }}
          />
          <button type="button" className="bw-admin__btn bw-admin__btn--sm" onClick={() => onCopy(value)}>
            <Copy aria-hidden /> {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      ) : (
        <span className="muted" style={{ fontSize: 12.5 }}>
          {empty}
        </span>
      )}
    </div>
  );
}
