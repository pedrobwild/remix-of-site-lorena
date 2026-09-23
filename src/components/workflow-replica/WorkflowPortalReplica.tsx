import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardSignature,
  Clock,
  DollarSign,
  FileDown,
  FileText,
  FolderOpen,
  GanttChartSquare,
  Lock,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  activities,
  curveData,
  milestones,
  project,
  reportPhotos,
  reports,
  type WorkflowActivity,
} from "./workflowReplicaData";
import "./workflow-portal-replica.css";

type TabId = "schedule" | "curve" | "reports" | "finance" | "documents" | "formalizations" | "issues";

const TABS = [
  { id: "schedule", label: "Cronograma", icon: GanttChartSquare },
  { id: "curve", label: "Evolução de Obra", icon: TrendingUp },
  { id: "reports", label: "Relatórios", icon: FileText },
  { id: "finance", label: "Financeiro", icon: DollarSign },
  { id: "documents", label: "Documentos", icon: FolderOpen },
  { id: "formalizations", label: "Formalizações", icon: ClipboardSignature },
  { id: "issues", label: "Pendências", icon: AlertCircle },
] as const;

const FONT_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap";

function StatusPill({ activity }: { activity: WorkflowActivity }) {
  const done = activity.status === "Concluído";
  const progress = activity.status === "Em andamento";
  const Icon = done ? CheckCircle2 : Clock;
  return <span className={`wf-status ${done ? "done" : progress ? "progress" : "pending"}`}><Icon size={12} />{activity.status}</span>;
}

function IdentificationCard() {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <section className="wf-card wf-ident" aria-labelledby="wf-project-title">
        <div className="wf-ident-main">
          <strong className="wf-wordmark">Bwild</strong>
          <div className="wf-project">
            <h3 id="wf-project-title">{project.title}</h3>
            <p>Cliente: {project.client}</p>
            <p>{project.address}</p>
          </div>
          <div className="wf-pending" aria-label="1 pendência"><Bell size={15} /><span>Pendências</span><b>1</b></div>
        </div>
        <div className="wf-current">
          <div><span className="wf-label">Etapa atual</span><strong>{project.currentStage}</strong></div>
          <div className="wf-current-meta"><span className="wf-badge">{project.activityCount}</span><span>{project.period}</span></div>
        </div>
        <button className="wf-details-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Ocultar detalhes" : "Ver detalhes"}
        </button>
        <div className={`wf-mobile-details ${expanded ? "open" : ""}`}>
          <p className="wf-address">{project.address}</p>
          <div className="wf-milestones" aria-label="Marcos concluídos">
            {milestones.map((milestone) => <div className="wf-milestone" key={milestone.label}><Check size={12} /><strong>{milestone.label}</strong><time>{milestone.date}</time></div>)}
          </div>
        </div>
      </section>
      <section className="wf-card wf-progress" aria-label="Progresso de obra">
        <div className="wf-progress-head"><h3>Progresso de obra</h3><strong>{project.progress}%</strong></div>
        <div className="wf-progress-track"><i style={{ width: `${project.progress}%` }} /></div>
        <div className="wf-progress-months"><span>AGO</span><span>SET</span><span>OUT</span></div>
        <p className="wf-progress-foot">Previsto: {project.plannedProgress}% / Realizado: {project.progress}%</p>
      </section>
    </>
  );
}

function SchedulePanel() {
  return (
    <div>
      <header className="wf-section-head">
        <div className="wf-section-title"><CalendarDays /><div><h3>Cronograma</h3><p>12 atividades • 7 concluídas</p></div></div>
        <button className="wf-button" type="button"><FileDown size={14} />Exportar PDF</button>
      </header>
      <div className="wf-table-wrap">
        <table className="wf-table">
          <thead><tr><th>Atividade</th><th>Início Prev.</th><th>Término Prev.</th><th>Início Real</th><th>Término Real</th><th>Status</th></tr></thead>
          <tbody>{activities.map((activity) => <tr className={activity.number === "08" ? "wf-current-row" : ""} key={activity.number}>
            <td><div className="wf-activity-name"><span className="wf-activity-number">{activity.number}</span><div className="wf-activity-copy"><strong>{activity.name}</strong><span className="wf-stage">{activity.stage}</span></div></div></td>
            <td>{activity.plannedStart}</td><td>{activity.plannedEnd}</td><td>{activity.actualStart}</td><td>{activity.actualEnd}</td><td><StatusPill activity={activity} /></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="wf-mobile-activities">{activities.map((activity) => <article className={`wf-mobile-activity ${activity.number === "08" ? "current" : ""}`} key={activity.number}>
        <div className="wf-mobile-activity-head"><span className="wf-activity-number">{activity.number}</span><div><strong>{activity.name}</strong><br /><span className="wf-stage">{activity.stage}</span></div></div>
        <div className="wf-mobile-activity-foot"><span>Prev. {activity.plannedStart} a {activity.plannedEnd}</span><StatusPill activity={activity} /></div>
      </article>)}</div>
    </div>
  );
}

function CurveTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="wf-tooltip"><strong>{label}</strong><span>Etapa em execução</span>{payload.map((item) => item.value === undefined ? null : <span key={item.name}>{item.name}: {item.value}%</span>)}</div>;
}

function TodayLabel({ viewBox }: { viewBox?: { x?: number } }) {
  const x = viewBox?.x;
  if (typeof x !== "number") return null;
  return <g transform={`translate(${x - 30},8)`}><rect className="wf-reference-pill" width="60" height="18" rx="9" /><text className="wf-reference-label" x="30" y="12" textAnchor="middle">52% Execução</text></g>;
}

function CurvePanel() {
  const [showAll, setShowAll] = useState(false);
  const data = showAll ? curveData : curveData.slice(2, 18);
  return (
    <div>
      <header className="wf-section-head">
        <div className="wf-section-title"><TrendingUp className="wf-chart-icon" /><div><h3>Cronograma Previsto x Realizado</h3><p>Janela de 45 dias (-30 a +15 dias do hoje)</p></div></div>
        <div><span className="wf-date-chip">04/08/2026 a 10/10/2026</span> <button className="wf-button" type="button" onClick={() => setShowAll((value) => !value)}>{showAll ? "30 dias" : "Ver tudo"}</button></div>
      </header>
      <div className="wf-chart-frame">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 27, right: 15, left: -16, bottom: 28 }}>
            <CartesianGrid vertical={false} stroke="var(--wf-border)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 8, fill: "var(--wf-muted-foreground)" }} angle={-45} textAnchor="end" height={42} axisLine={false} tickLine={false} interval={2} />
            <YAxis domain={[0,100]} ticks={[0,25,50,75,100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 9, fill: "var(--wf-muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CurveTooltip />} />
            <ReferenceLine x="04/08" stroke="var(--wf-muted-foreground)" strokeDasharray="4 4" label={{ value: "Início", position: "insideTopLeft", fill: "var(--wf-muted-foreground)", fontSize: 9 }} />
            <ReferenceLine x="19/09" stroke="var(--wf-primary)" strokeDasharray="4 4" label={<TodayLabel />} />
            <ReferenceLine x="09/10" stroke="var(--wf-success)" strokeDasharray="4 4" label={{ value: "Entrega", position: "insideTopRight", fill: "var(--wf-success)", fontSize: 9 }} />
            <Line type="monotone" dataKey="previsto" name="Previsto" stroke="var(--wf-primary)" strokeWidth={2} strokeOpacity={0.5} strokeDasharray="6 4" dot={{ r: 2, fill: "var(--wf-primary)" }} isAnimationActive={false} />
            <Line type="monotone" dataKey="realizado" name="Realizado" stroke="#22c55e" strokeWidth={3.5} connectNulls={false} dot={{ r: 4, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="wf-chart-legend"><span><i />Previsto</span><span><i className="real" />Realizado</span></div>
    </div>
  );
}

function ReportDetail({ onBack }: { onBack: () => void }) {
  return <article className="wf-report-detail">
    <div className="wf-report-actions"><button className="wf-button" type="button" onClick={onBack}>Ver todos</button><button className="wf-button" type="button">Anterior</button><button className="wf-button" type="button">Próxima</button><button className="wf-button" type="button"><FileDown size={13} />PDF</button></div>
    <div className="wf-report-overview"><div><span className="wf-badge">Semana 6</span><h3>15/09/2026 - 19/09/2026</h3><p>Etapa: Instalação de marcenaria</p></div><strong className="wf-report-percent">52%</strong></div>
    <div className="wf-report-progress" style={{ "--planned": "55%" } as React.CSSProperties}><i style={{ width: "52%" }} /></div>
    <section className="wf-report-section"><h4>Galeria de Fotos (3)</h4><div className="wf-report-body wf-gallery">{reportPhotos.map((photo) => <figure key={photo.caption}><img src={photo.src} alt={photo.alt} loading="lazy" /><figcaption>{photo.caption}</figcaption></figure>)}</div></section>
    <section className="wf-report-section"><h4>Resumo Executivo</h4><div className="wf-report-body"><p>Instalação de ar-condicionado e primeira demão de pintura concluídas. Início da instalação de marcenaria.</p><h5>Entregáveis concluídos na semana</h5><ul><li>Ar-condicionado instalado</li><li>Primeira demão de pintura</li></ul></div></section>
    <section className="wf-report-section"><h4>Na próxima semana vamos focar em:</h4><div className="wf-report-body"><ul><li>Instalação de marcenaria e ajustes</li><li>Instalação de rodapé e acabamentos de civil</li></ul></div></section>
    <section className="wf-report-section"><h4>Decisões e Aprovações do Cliente</h4><div className="wf-report-body wf-decision"><span>Puxador da marcenaria da cozinha aprovado</span><time>17/09</time><span className="wf-approved">Aprovado</span></div></section>
    <footer className="wf-report-footer">Gestão de Obras · Bwild</footer>
  </article>;
}

function ReportsPanel() {
  const [detail, setDetail] = useState(false);
  return <div className={`wf-reports-layout ${detail ? "detail" : ""}`}>
    <section className="wf-report-list"><div className="wf-report-list-head"><h3>Histórico de Relatórios</h3><span>6 relatórios</span></div>
      {reports.map((report) => <button className="wf-report-row" type="button" aria-current={report.current ? "true" : undefined} key={report.week} onClick={() => setDetail(true)}><span className="wf-week">Sem {report.week}</span><span><strong>{report.dates}{report.current ? " · Atual" : ""}</strong><p>Etapa: {report.stage}</p><span className="wf-report-progress" style={{ "--planned": `${report.planned}%` } as React.CSSProperties}><i style={{ width: `${report.progress}%` }} /></span></span><ChevronRight size={15} /></button>)}
      <div className="wf-report-row wf-coming"><span className="wf-week"><Lock size={14} /></span><span><strong>Sem 7</strong><p>Disponível em breve</p></span></div>
    </section>
    <ReportDetail onBack={() => setDetail(false)} />
  </div>;
}

function EmptyPanel() {
  return <div className="wf-empty"><div><Lock size={25} /><p>Área disponível para o cliente no portal</p></div></div>;
}

export default function WorkflowPortalReplica() {
  const [activeTab, setActiveTab] = useState<TabId>("schedule");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    let font = document.head.querySelector<HTMLLinkElement>('link[data-wf-replica-font]');
    if (!font) {
      font = document.createElement("link");
      font.rel = "stylesheet";
      font.href = FONT_URL;
      font.dataset.wfReplicaFont = "";
      document.head.appendChild(font);
    }
    return () => font?.remove();
  }, []);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + TABS.length) % TABS.length;
    const next = TABS[nextIndex];
    if (!next) return;
    setActiveTab(next.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return <div className="wf-replica" aria-label="Interface ilustrativa do Bwild Workflow">
    <div className="wf-browserbar" aria-hidden="true"><i /><i /><i /><span>bwildworkflow.com/obra/…</span></div>
    <div className="wf-shell">
      <IdentificationCard />
      <section className="wf-card wf-tabs-card">
        <div className="wf-tablist" role="tablist" aria-label="Áreas do portal">
          {TABS.map((tab, index) => { const Icon = tab.icon; return <button ref={(node) => { tabRefs.current[index] = node; }} className="wf-tab" type="button" role="tab" id={`wf-tab-${tab.id}`} aria-controls={`wf-panel-${tab.id}`} aria-selected={activeTab === tab.id} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)} onKeyDown={(event) => handleTabKeyDown(event, index)} key={tab.id}><Icon size={14} /><span>{tab.label}</span></button>; })}
        </div>
        {TABS.map((tab) => <section className="wf-panel" role="tabpanel" id={`wf-panel-${tab.id}`} aria-labelledby={`wf-tab-${tab.id}`} hidden={activeTab !== tab.id} key={tab.id}>
          {tab.id === "schedule" ? <SchedulePanel /> : tab.id === "curve" ? <CurvePanel /> : tab.id === "reports" ? <ReportsPanel /> : <EmptyPanel />}
        </section>)}
      </section>
    </div>
  </div>;
}