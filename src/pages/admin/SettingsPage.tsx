import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  getCachedSiteSettings,
  invalidateSiteSettings,
  type SiteSettings,
} from "@/lib/useSiteSettings";
import {
  diffSettings,
  loadSettingsRow,
  missingColumns,
  saveSettingsPatch,
  type SettingsRow,
} from "@/lib/adminSiteSettings";
import { useUnsavedChangesGuard } from "@/lib/useUnsavedChangesGuard";

const optionalUrl = z
  .string()
  .trim()
  .max(300, "URL muito longa")
  .url("URL inválida (use https://…)")
  .or(z.literal(""))
  .optional()
  .nullable();

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} deve ter no máximo ${max} caracteres`).optional().nullable();

const settingsSchema = z.object({
  site_title: optionalText(80, "Nome do estúdio"),
  site_description: optionalText(280, "Descrição"),
  contact_email: z
    .string()
    .trim()
    .max(255, "Email muito longo")
    .email("Email inválido")
    .or(z.literal(""))
    .optional()
    .nullable(),
  contact_phone: z
    .string()
    .trim()
    .max(40, "Telefone muito longo")
    .regex(/^[+\d\s()\-.]*$/, "Use apenas dígitos, espaço, +, -, ( e )")
    .optional()
    .nullable(),
  address_street: optionalText(160, "Endereço"),
  address_city: optionalText(80, "Cidade"),
  address_region: optionalText(40, "UF"),
  instagram_url: optionalUrl,
  linkedin_url: optionalUrl,
  pinterest_url: optionalUrl,
  cnpj: z
    .string()
    .trim()
    .max(20, "CNPJ muito longo")
    .regex(/^[\d./-]*$/, "Use apenas dígitos, ponto, barra e hífen")
    .optional()
    .nullable(),
  cau: z
    .string()
    .trim()
    .max(20, "CAU muito longo")
    .regex(/^[A-Za-z0-9-]*$/, "Use apenas letras, dígitos e hífen")
    .optional()
    .nullable(),
  whatsapp_number: z
    .string()
    .trim()
    .max(20, "Número muito longo")
    .regex(/^\d*$/, "Use apenas dígitos no formato E.164 sem + (ex: 5534999998888)")
    .optional()
    .nullable(),
});

type FieldKey = keyof z.infer<typeof settingsSchema>;
type FieldErrors = Partial<Record<FieldKey, string>>;

/** Campos desta tela — o save envia só os que mudaram. */
const SETTINGS_FIELDS = Object.keys(settingsSchema.shape) as FieldKey[];

/**
 * Colunas que podem ainda não existir no banco de produção
 * (migração 20260525015000_site_settings_cnpj_cau_whatsapp.sql). Sem a
 * coluna, o campo aparece bloqueado com o valor que o site usa hoje (padrão
 * do código) e fica fora do save — antes, o save inteiro falhava.
 */
const OPTIONAL_COLUMNS: readonly FieldKey[] = ["cnpj", "cau", "whatsapp_number"];

export default function SettingsPage() {
  const [loaded, setLoaded] = useState<SettingsRow | null>(null);
  const [s, setS] = useState<SettingsRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingRow, setLoadingRow] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoadingRow(true);
    setLoadError(null);
    const { row, error } = await loadSettingsRow();
    if (error || !row) {
      setLoadError(error ?? "Não foi possível ler as configurações.");
    } else {
      setLoaded(row);
      setS(row);
    }
    setLoadingRow(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unavailable = useMemo(
    () => new Set<FieldKey>(loaded ? (missingColumns(loaded, OPTIONAL_COLUMNS) as FieldKey[]) : []),
    [loaded],
  );
  const editableFields = useMemo(
    () => SETTINGS_FIELDS.filter((f) => !unavailable.has(f)),
    [unavailable],
  );
  const pending = useMemo(
    () => (loaded && s ? diffSettings(loaded, s, editableFields) : {}),
    [loaded, s, editableFields],
  );
  const dirty = Object.keys(pending).length > 0;
  useUnsavedChangesGuard(dirty);

  function value(k: FieldKey): string {
    const v = s?.[k];
    return v === null || v === undefined ? "" : String(v);
  }

  function patch(k: FieldKey, v: string) {
    setS((p) => (p ? { ...p, [k]: v } : p));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function save() {
    if (!s || !loaded) return;
    setMsg(null);
    if (!dirty) {
      setMsg({ kind: "ok", text: "nada mudou." });
      return;
    }
    // Valida só o que vai ser gravado: um valor antigo fora do padrão num
    // campo não tocado não impede salvar os outros.
    const candidate: Record<string, string> = {};
    for (const k of Object.keys(pending)) candidate[k] = pending[k] ?? "";
    const parsed = settingsSchema.partial().safeParse(candidate);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as FieldKey;
        if (!fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      setMsg({ kind: "err", text: "verifique os campos destacados" });
      return;
    }
    const payload: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      payload[k] = v === "" || v == null ? null : String(v);
    }
    setSaving(true);
    const { error } = await saveSettingsPatch(payload);
    setSaving(false);
    if (error) {
      setMsg({ kind: "err", text: error });
      return;
    }
    setLoaded((prev) => (prev ? { ...prev, ...payload } : prev));
    setS((prev) => (prev ? { ...prev, ...payload } : prev));
    invalidateSiteSettings();
    setMsg({ kind: "ok", text: `salvo (${Object.keys(payload).length} campo(s)).` });
  }

  if (loadingRow && !s) {
    return (
      <AdminLayout active="settings">
        <p className="mono">carregando…</p>
      </AdminLayout>
    );
  }

  if (!s) {
    return (
      <AdminLayout active="settings">
        <div className="admin-flash admin-flash--err mono" role="alert" style={{ marginBottom: 16 }}>
          Não foi possível ler as configurações do site: {loadError}. O formulário fica bloqueado até
          a leitura funcionar, para não gravar valores padrão por cima dos reais.
        </div>
        <button type="button" className="admin-btn" onClick={() => void load()} disabled={loadingRow}>
          {loadingRow ? "tentando…" : "tentar de novo"}
        </button>
      </AdminLayout>
    );
  }

  const fallback = getCachedSiteSettings();

  /** Props de um input ligado a um campo que pode não existir no banco. */
  function optionalColumnProps(k: FieldKey) {
    if (!unavailable.has(k)) return { value: value(k), disabled: false };
    const inUse = fallback[k as keyof SiteSettings];
    return { value: inUse == null ? "" : String(inUse), disabled: true };
  }

  function optionalColumnHint(k: FieldKey, hint: string): string {
    return unavailable.has(k)
      ? `A coluna "${k}" ainda não existe no banco: o site usa este valor padrão do código. Aplique a migração site_settings_cnpj_cau_whatsapp para editar aqui.`
      : hint;
  }

  return (
    <AdminLayout active="settings">
      <div className="admin-form-head">
        <h1 className="admin-form-head__title">Configurações do site</h1>
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
              alterações não salvas
            </span>
          )}
          <button
            className="admin-btn admin-btn--primary"
            onClick={save}
            disabled={saving || !dirty}
          >
            {saving ? "salvando…" : "salvar"}
          </button>
        </div>
      </div>

      <p className="mono" style={{ opacity: 0.7, marginBottom: 24, maxWidth: 640 }}>
        Estes valores aparecem no footer, no menu mobile, na seção de contato e nos schemas SEO do
        site público.
      </p>

      <section className="admin-section">
        <h2 className="admin-section__title">Identidade</h2>
        <div className="admin-grid-2">
          <Field label="Nome do estúdio" error={errors.site_title}>
            <input
              className="admin-field__input"
              value={value("site_title")}
              onChange={(e) => patch("site_title", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Descrição curta" error={errors.site_description} full>
            <textarea
              className="admin-field__input"
              rows={2}
              value={value("site_description")}
              onChange={(e) => patch("site_description", e.target.value)}
              maxLength={280}
            />
          </Field>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section__title">Contato</h2>
        <div className="admin-grid-2">
          <Field label="Email" error={errors.contact_email}>
            <input
              type="email"
              className="admin-field__input"
              value={value("contact_email")}
              onChange={(e) => patch("contact_email", e.target.value)}
              maxLength={255}
              placeholder="contato@bewild.com.br"
            />
          </Field>
          <Field
            label="Telefone / WhatsApp (formato livre)"
            error={errors.contact_phone}
            hint="ex: +55 11 9 9999 9999"
          >
            <input
              className="admin-field__input"
              value={value("contact_phone")}
              onChange={(e) => patch("contact_phone", e.target.value)}
              maxLength={40}
              placeholder="+55 11 9 9999 9999"
            />
          </Field>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section__title">Endereço</h2>
        <div className="admin-grid-2">
          <Field label="Rua / número" error={errors.address_street} full>
            <input
              className="admin-field__input"
              value={value("address_street")}
              onChange={(e) => patch("address_street", e.target.value)}
              maxLength={160}
            />
          </Field>
          <Field label="Cidade" error={errors.address_city}>
            <input
              className="admin-field__input"
              value={value("address_city")}
              onChange={(e) => patch("address_city", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="UF" error={errors.address_region}>
            <input
              className="admin-field__input"
              value={value("address_region")}
              onChange={(e) => patch("address_region", e.target.value)}
              maxLength={40}
              placeholder="SP"
            />
          </Field>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section__title">Identidade profissional</h2>
        <p className="mono" style={{ opacity: 0.6, marginBottom: 16, fontSize: "var(--admin-fs-xs)" }}>
          Aparecem no footer do site, no rodapé da política de privacidade e nos schemas JSON-LD
          consumidos por Google e demais motores.
        </p>
        <div className="admin-grid-2">
          <Field
            label="CNPJ"
            error={errors.cnpj}
            hint={optionalColumnHint("cnpj", "formato livre, ex: 05.119.224/0001-30")}
          >
            <input
              className="admin-field__input"
              {...optionalColumnProps("cnpj")}
              onChange={(e) => patch("cnpj", e.target.value)}
              maxLength={20}
              placeholder="05.119.224/0001-30"
            />
          </Field>
          <Field label="Registro CAU" error={errors.cau} hint={optionalColumnHint("cau", "ex: A66583-5")}>
            <input
              className="admin-field__input"
              {...optionalColumnProps("cau")}
              onChange={(e) => patch("cau", e.target.value)}
              maxLength={20}
              placeholder="A66583-5"
            />
          </Field>
          <Field
            label="WhatsApp (E.164 sem +)"
            error={errors.whatsapp_number}
            hint={optionalColumnHint(
              "whatsapp_number",
              "só dígitos, ex: 5511911906183 — usado para gerar a URL wa.me do CTA",
            )}
            full
          >
            <input
              className="admin-field__input"
              {...optionalColumnProps("whatsapp_number")}
              onChange={(e) => patch("whatsapp_number", e.target.value.replace(/\D/g, ""))}
              maxLength={20}
              placeholder="5511911906183"
              inputMode="numeric"
            />
          </Field>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section__title">Redes sociais</h2>
        <div className="admin-grid-2">
          <Field label="Instagram (URL completa)" error={errors.instagram_url} full>
            <input
              className="admin-field__input"
              value={value("instagram_url")}
              onChange={(e) => patch("instagram_url", e.target.value)}
              placeholder="https://instagram.com/bewild"
            />
          </Field>
          <Field label="LinkedIn" error={errors.linkedin_url}>
            <input
              className="admin-field__input"
              value={value("linkedin_url")}
              onChange={(e) => patch("linkedin_url", e.target.value)}
              placeholder="https://linkedin.com/company/…"
            />
          </Field>
          <Field label="Pinterest" error={errors.pinterest_url}>
            <input
              className="admin-field__input"
              value={value("pinterest_url")}
              onChange={(e) => patch("pinterest_url", e.target.value)}
              placeholder="https://pinterest.com/…"
            />
          </Field>
        </div>
      </section>
    </AdminLayout>
  );
}

function Field({
  label,
  children,
  full,
  error,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <label className={`admin-field ${full ? "admin-field--full" : ""}`}>
      <span className="admin-field__label mono">{label}</span>
      {children}
      {error ? (
        <span className="mono" style={{ fontSize: "var(--admin-fs-xs)", color: "tomato", marginTop: 4 }}>
          {error}
        </span>
      ) : hint ? (
        <span className="mono" style={{ fontSize: "var(--admin-fs-xs)", opacity: 0.5, marginTop: 4 }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}
