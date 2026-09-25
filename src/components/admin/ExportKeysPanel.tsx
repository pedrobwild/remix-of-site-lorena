/**
 * Exportação para planilha e BI — bloco de /admin/integracoes.
 *
 * Cria chaves (nome + conjuntos), mostra a chave UMA vez com os endereços
 * prontos (fórmula do Google Sheets, CSV e JSON) e lista as chaves com o
 * último uso, para revogar. Quem entrega os dados é a edge function
 * `data-export` (docs/INTEGRACOES.md › Exportação); nenhum conjunto tem dado
 * pessoal.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Copy, KeyRound } from "lucide-react";
import AdminAlert from "@/components/admin/AdminAlert";
import {
  buildExportUrl,
  createExportKey,
  datasetLabel,
  DATASETS,
  EXPORT_DATASETS,
  fetchExportKeys,
  importDataFormula,
  revokeExportKey,
  type CreatedExportKey,
  type ExportDataset,
  type ExportKeyRow,
} from "@/lib/dataExport";
import { relativeTime } from "@/lib/metaAds";

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function ExportKeysPanel() {
  const [keys, setKeys] = useState<ExportKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<ExportDataset[]>([]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedExportKey | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchExportKeys();
    setKeys(res.keys);
    if (res.error) setError(`Não foi possível ler as chaves: ${res.error}`);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(d: ExportDataset) {
    setPicked((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await createExportKey(name, picked);
    setCreating(false);
    if (res.error || !res.key) {
      setError(res.error ?? "Não foi possível criar a chave.");
      return;
    }
    setCreated(res.key);
    setName("");
    setPicked([]);
    void load();
  }

  async function onRevoke(k: ExportKeyRow) {
    const ok = window.confirm(
      `Revogar a chave "${k.name}" (${k.prefix}…)?\n\nAs planilhas e painéis que usam esta chave param de atualizar na hora. Não dá para desfazer.`,
    );
    if (!ok) return;
    setRevoking(k.id);
    setError(null);
    const res = await revokeExportKey(k.id);
    setRevoking(null);
    if (res.error) {
      setError(`Não foi possível revogar: ${res.error}`);
      return;
    }
    if (created?.id === k.id) setCreated(null);
    void load();
  }

  async function onCopy(id: string, text: string) {
    const ok = await copyText(text);
    setCopied(ok ? id : null);
    if (ok) window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
  }

  const active = keys.filter((k) => !k.revoked_at);
  const revoked = keys.filter((k) => k.revoked_at);

  return (
    <section className="bw-admin__section" data-testid="export-keys">
      <header className="bw-admin__section-head">
        <h2 className="bw-admin__section-title">Exportação para planilha e BI</h2>
        <p className="bw-admin__section-desc">
          Leads, formulários e campanhas da Meta, visitas e pixel próprio — sem dados pessoais — em CSV ou JSON para Google
          Sheets, Looker Studio, Excel e Power BI. Cada chave vale só para os conjuntos escolhidos e pode ser revogada.
        </p>
      </header>

      {error && (
        <AdminAlert kind="err" onClose={() => setError(null)}>
          {error}
        </AdminAlert>
      )}

      {created && (
        <div
          role="status"
          data-testid="created-key"
          style={{
            border: "1px solid #BFD7EA",
            background: "#F3F8FC",
            borderRadius: 3,
            padding: 16,
            display: "grid",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 14.5 }}>Chave “{created.name}” criada — copie agora</strong>
            <button type="button" className="bw-admin__btn bw-admin__btn--sm" onClick={() => setCreated(null)}>
              Já copiei
            </button>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
            Ela não aparece de novo: o banco guarda só uma impressão digital (hash). Quem tiver a chave ou um destes endereços
            lê os conjuntos escolhidos até você revogar — use uma chave por planilha ou painel.
          </p>
          <CopyField id="token" label="Chave" value={created.token} copied={copied === "token"} onCopy={onCopy} />
          {created.datasets.map((d) => {
            const csv = buildExportUrl(d, created.token, "csv");
            return (
              <div key={d} style={{ display: "grid", gap: 8, paddingTop: 10, borderTop: "1px solid #D6E6F2" }}>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{DATASETS[d].label}</span>
                <CopyField
                  id={`${d}-sheets`}
                  label="Google Sheets — cole numa célula vazia"
                  value={importDataFormula(csv)}
                  copied={copied === `${d}-sheets`}
                  onCopy={onCopy}
                />
                <CopyField
                  id={`${d}-csv`}
                  label="CSV — Excel e Power BI (Obter dados › Da Web)"
                  value={csv}
                  copied={copied === `${d}-csv`}
                  onCopy={onCopy}
                />
                <CopyField
                  id={`${d}-json`}
                  label="JSON"
                  value={buildExportUrl(d, created.token, "json")}
                  copied={copied === `${d}-json`}
                  onCopy={onCopy}
                />
              </div>
            );
          })}
        </div>
      )}

      <form className="bw-admin__form" onSubmit={(e) => void onSubmit(e)} aria-label="Nova chave de exportação">
        <div className="bw-admin__field">
          <label htmlFor="export-key-name">Nome da chave</label>
          <input
            id="export-key-name"
            className="bw-admin__input"
            type="text"
            value={name}
            maxLength={80}
            placeholder="ex.: Planilha de marketing"
            onChange={(e) => setName(e.target.value)}
          />
          <span className="hint">Para quem ou para qual planilha — ajuda a saber o que revogar depois.</span>
        </div>
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 10, minWidth: 0 }}>
          <legend
            style={{
              fontFamily: "var(--bw-mono)",
              fontSize: 10.5,
              fontWeight: 500,
              color: "var(--bw-navy)",
              textTransform: "uppercase",
              letterSpacing: ".1em",
              marginBottom: 8,
              padding: 0,
            }}
          >
            Conjuntos de dados
          </legend>
          {EXPORT_DATASETS.map((d) => (
            <label key={d} className="bw-admin__check" style={{ alignItems: "flex-start" }}>
              <input type="checkbox" checked={picked.includes(d)} onChange={() => toggle(d)} style={{ marginTop: 3, flex: "none" }} />
              <span style={{ minWidth: 0 }}>
                <strong>{DATASETS[d].label}</strong>
                <span className="muted" style={{ display: "block", fontSize: 12.5, fontWeight: 400 }}>
                  {DATASETS[d].description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="bw-admin__form-foot">
          <span className="muted" style={{ fontSize: 12.5 }}>
            A chave completa aparece uma vez só, logo depois de criada.
          </span>
          <button type="submit" className="bw-admin__btn bw-admin__btn--primary" disabled={creating || !name.trim() || !picked.length}>
            <KeyRound aria-hidden /> {creating ? "Criando…" : "Criar chave"}
          </button>
        </div>
      </form>

      <h3 style={{ fontSize: 15, margin: "26px 0 8px" }}>Chaves</h3>
      {loading ? (
        <p className="bw-admin__empty">Carregando…</p>
      ) : keys.length === 0 ? (
        <p className="bw-admin__empty">Nenhuma chave criada ainda.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="bw-admin__table" data-testid="export-keys-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Chave</th>
                <th>Conjuntos</th>
                <th>Criada</th>
                <th>Último uso</th>
                <th className="num">Usos</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {[...active, ...revoked].map((k) => (
                <tr key={k.id} className={k.revoked_at ? "muted" : undefined}>
                  <td>{k.name}</td>
                  <td style={{ fontFamily: "var(--bw-mono, monospace)", fontSize: 12.5, whiteSpace: "nowrap" }}>{k.prefix}…</td>
                  <td style={{ fontSize: 12.5 }}>{k.datasets.map(datasetLabel).join(", ")}</td>
                  <td className="muted" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
                    {fmtDate(k.created_at)}
                    {k.created_by_email ? <span style={{ display: "block" }}>{k.created_by_email}</span> : null}
                  </td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {k.last_used_at ? relativeTime(k.last_used_at) : "nunca"}
                  </td>
                  <td className="num">{k.use_count}</td>
                  <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                    {k.revoked_at ? (
                      <span className="bw-admin__tag bw-admin__tag--off">revogada {fmtDate(k.revoked_at)}</span>
                    ) : (
                      <button
                        type="button"
                        className="bw-admin__btn bw-admin__btn--sm bw-admin__btn--danger"
                        onClick={() => void onRevoke(k)}
                        disabled={revoking === k.id}
                      >
                        {revoking === k.id ? "Revogando…" : "Revogar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="muted" style={{ fontSize: 12.5, marginTop: 12, display: "grid", gap: 6 }}>
        <p style={{ margin: 0 }}>
          <strong>Google Sheets:</strong> a fórmula traz os dados e atualiza sozinha (mais ou menos a cada hora). Looker
          Studio: conecte essa planilha. <strong>Excel e Power BI:</strong> Obter dados › Da Web, com o endereço CSV ou
          JSON. Para baixar um arquivo e abrir direto no Excel, acrescente <code>&amp;sep=semicolon</code> ao endereço CSV.
        </p>
        <p style={{ margin: 0 }}>
          Período: os últimos 90 dias. Acrescente <code>&amp;days=365</code> (até 731) ou{" "}
          <code>&amp;from=2026-01-01&amp;to=2026-06-30</code>. Datas e horas no fuso de São Paulo; decimal com vírgula
          (planilha em inglês: <code>&amp;dec=dot</code>).
        </p>
      </div>
    </section>
  );
}

function CopyField({
  id,
  label,
  value,
  copied,
  onCopy,
}: {
  id: string;
  label: string;
  value: string;
  copied: boolean;
  onCopy: (id: string, value: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
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
            background: "#fff",
          }}
        />
        <button type="button" className="bw-admin__btn bw-admin__btn--sm" onClick={() => onCopy(id, value)}>
          <Copy aria-hidden /> {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
