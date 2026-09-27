/**
 * /admin/central — central de edição rápida: Projetos, Contatos e Formulários
 * em abas, sem recarregar a página. Edição inline com salvamento otimista.
 * Status de contato passa por `updateLeadStatus` (grava o histórico).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_STATUSES, isLeadStatus, updateLeadStatus, type LeadStatus } from "@/lib/adminLeads";

type Aba = "projetos" | "contatos" | "formularios";

type Projeto = {
  id: string;
  slug: string;
  title: string;
  neighborhood: string | null;
  area_m2: number | null;
  published: boolean;
  featured: boolean;
};

type Contato = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  status: string;
  form_path: string | null;
  lead_source: string | null;
  created_at: string;
};

type Envio = {
  id: string;
  partner_name: string;
  partner_type: string | null;
  company: string | null;
  whatsapp: string;
  status: string;
  created_at: string;
};

const PAGE = 1000;
const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  descartado: "Descartado",
};

const dataBR = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let off = 0; ; off += PAGE) {
    const { data, error } = await build(off, off + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

const inputStyle: React.CSSProperties = { width: "100%", minHeight: 36, padding: "4px 8px" };

export default function CentralPage() {
  const [aba, setAba] = useState<Aba>("projetos");
  const [busca, setBusca] = useState("");
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [p, c, e] = await Promise.all([
        fetchAll<Projeto>((a, b) =>
          supabase
            .from("projects")
            .select("id, slug, title, neighborhood, area_m2, published, featured")
            .order("title")
            .order("id")
            .range(a, b),
        ),
        fetchAll<Contato>((a, b) =>
          supabase
            .from("leads")
            .select("id, name, whatsapp, email, status, form_path, lead_source, created_at")
            .order("created_at", { ascending: false })
            .order("id")
            .range(a, b),
        ),
        fetchAll<Envio>((a, b) =>
          supabase
            .from("partner_referrals")
            .select("id, partner_name, partner_type, company, whatsapp, status, created_at")
            .order("created_at", { ascending: false })
            .order("id")
            .range(a, b),
        ),
      ]);
      setProjetos(p);
      setContatos(c);
      setEnvios(e);
    } catch (err) {
      setErro(`Não foi possível carregar os dados: ${(err as Error).message}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function salvarProjeto(p: Projeto, patch: Partial<Projeto>) {
    const antes = p;
    setProjetos((prev) => prev.map((r) => (r.id === p.id ? { ...r, ...patch } : r)));
    const { data, error } = await supabase.from("projects").update(patch).eq("id", p.id).select("id");
    if (error || !data?.length) {
      setProjetos((prev) => prev.map((r) => (r.id === p.id ? antes : r)));
      setMsg({ kind: "err", text: `Não foi possível salvar "${p.title}": ${error?.message ?? "sem permissão"}` });
      return;
    }
    setMsg({ kind: "ok", text: `"${p.title}" salvo.` });
  }

  async function mudarStatus(c: Contato, next: string) {
    if (!isLeadStatus(next) || next === c.status) return;
    const antes = c.status;
    setContatos((prev) => prev.map((r) => (r.id === c.id ? { ...r, status: next } : r)));
    const res = await updateLeadStatus(c.id, isLeadStatus(antes) ? antes : null, next);
    if (!res.ok) {
      setContatos((prev) => prev.map((r) => (r.id === c.id ? { ...r, status: antes } : r)));
      setMsg({ kind: "err", text: `Não foi possível mudar o status: ${res.error}` });
      return;
    }
    setMsg({ kind: "ok", text: `Status de ${c.name} atualizado.` });
  }

  const q = busca.trim().toLowerCase();
  const projetosF = useMemo(
    () => projetos.filter((p) => !q || `${p.title} ${p.slug} ${p.neighborhood ?? ""}`.toLowerCase().includes(q)),
    [projetos, q],
  );
  const contatosF = useMemo(
    () => contatos.filter((c) => !q || `${c.name} ${c.email ?? ""} ${c.whatsapp}`.toLowerCase().includes(q)),
    [contatos, q],
  );
  const enviosF = useMemo(
    () => envios.filter((e) => !q || `${e.partner_name} ${e.company ?? ""}`.toLowerCase().includes(q)),
    [envios, q],
  );

  const abas: { key: Aba; label: string; n: number }[] = [
    { key: "projetos", label: "Projetos", n: projetos.length },
    { key: "contatos", label: "Contatos", n: contatos.length },
    { key: "formularios", label: "Formulários", n: envios.length },
  ];

  return (
    <AdminLayout
      active="central"
      title="Central"
      description="Projetos, contatos e formulários num lugar só. As mudanças salvam na hora, sem recarregar a página."
    >
      <div className="bw-admin__period" role="tablist" aria-label="Áreas" style={{ marginBottom: 14 }}>
        {abas.map((a) => (
          <button
            key={a.key}
            type="button"
            role="tab"
            aria-selected={aba === a.key}
            className={aba === a.key ? "is-active" : ""}
            onClick={() => setAba(a.key)}
          >
            {a.label} ({a.n})
          </button>
        ))}
      </div>

      <input
        type="search"
        aria-label="Buscar"
        placeholder="Buscar…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ ...inputStyle, maxWidth: 360, marginBottom: 14 }}
      />

      {msg && (
        <p className={`admin-flash admin-flash--${msg.kind} mono`} role="status">
          {msg.text}
        </p>
      )}

      {erro ? (
        <p className="admin-flash admin-flash--err mono" role="alert">{erro}</p>
      ) : loading ? (
        <p className="mono">carregando…</p>
      ) : aba === "projetos" ? (
        projetosF.length === 0 ? (
          <p className="mono">nenhum projeto encontrado.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Bairro</th>
                  <th>m²</th>
                  <th>Publicado</th>
                  <th>Destaque</th>
                </tr>
              </thead>
              <tbody>
                {projetosF.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        aria-label={`Título de ${p.slug}`}
                        defaultValue={p.title}
                        style={inputStyle}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== p.title) void salvarProjeto(p, { title: v });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Bairro de ${p.title}`}
                        defaultValue={p.neighborhood ?? ""}
                        style={inputStyle}
                        onBlur={(e) => {
                          const v = e.target.value.trim() || null;
                          if (v !== p.neighborhood) void salvarProjeto(p, { neighborhood: v });
                        }}
                      />
                    </td>
                    <td style={{ width: 90 }}>
                      <input
                        aria-label={`Metragem de ${p.title}`}
                        type="number"
                        min={1}
                        defaultValue={p.area_m2 ?? ""}
                        style={inputStyle}
                        onBlur={(e) => {
                          const v = e.target.value ? Math.round(Number(e.target.value)) : null;
                          if (v !== p.area_m2) void salvarProjeto(p, { area_m2: v });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Publicar ${p.title}`}
                        checked={p.published}
                        onChange={(e) => void salvarProjeto(p, { published: e.target.checked })}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Destacar ${p.title}`}
                        checked={p.featured}
                        onChange={(e) => void salvarProjeto(p, { featured: e.target.checked })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : aba === "contatos" ? (
        contatosF.length === 0 ? (
          <p className="mono">nenhum contato encontrado.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nome</th>
                  <th>Contato</th>
                  <th>Origem</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contatosF.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{dataBR(c.created_at)}</td>
                    <td>{c.name}</td>
                    <td className="mono">
                      {c.whatsapp}
                      {c.email ? <br /> : null}
                      {c.email}
                    </td>
                    <td className="mono">{c.form_path || c.lead_source || "—"}</td>
                    <td>
                      <select
                        aria-label={`Status de ${c.name}`}
                        value={c.status}
                        onChange={(e) => void mudarStatus(c, e.target.value)}
                        style={inputStyle}
                      >
                        {!isLeadStatus(c.status) && <option value={c.status}>{c.status}</option>}
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : enviosF.length === 0 ? (
        <p className="mono">nenhum envio encontrado.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <p className="mono" style={{ marginBottom: 8 }}>
            Cadastros de parceiros, incorporadoras e indicações (somente leitura — edite em Indicações).
          </p>
          <table className="admin-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Empresa</th>
                <th>WhatsApp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {enviosF.map((e) => (
                <tr key={e.id}>
                  <td className="mono">{dataBR(e.created_at)}</td>
                  <td>{e.partner_name}</td>
                  <td>{e.partner_type || "—"}</td>
                  <td>{e.company || "—"}</td>
                  <td className="mono">{e.whatsapp}</td>
                  <td className="mono">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
