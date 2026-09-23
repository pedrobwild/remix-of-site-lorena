import studioZipAntes from "@/assets/portfolio/studio-zip-brooklin-antes.jpg.asset.json";

export type WorkflowStatus = "Concluído" | "Em andamento" | "Pendente";

export type WorkflowActivity = {
  number: string;
  name: string;
  stage: "Preparação" | "Instalações" | "Marcenaria" | "Acabamento" | "Entrega";
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  status: WorkflowStatus;
};

export const project = {
  title: "Studio Urban Flex · Unidade 1204",
  client: "Investidor Bewild",
  address: "Rua Exemplo, 100 · Pinheiros, São Paulo",
  currentStage: "Instalação de marcenaria",
  activityCount: "7 de 12 atividades",
  period: "Início 04/08 › Entrega 10/10",
  progress: 52,
  plannedProgress: 55,
} as const;

export const milestones = [
  { label: "Assin. Contrato", date: "10/07" },
  { label: "Briefing Arq.", date: "14/07" },
  { label: "Aprov. 3D", date: "22/07" },
  { label: "Aprov. Executivo", date: "29/07" },
  { label: "Aprov. Obra", date: "01/08" },
  { label: "Início Mobilização", date: "04/08" },
] as const;

export const activities: WorkflowActivity[] = [
  { number: "01", name: "Mobilização de mão de obra, medições e alinhamento com o projeto executivo", stage: "Preparação", plannedStart: "04/08", plannedEnd: "06/08", actualStart: "04/08", actualEnd: "06/08", status: "Concluído" },
  { number: "02", name: "Fechadura eletrônica, adequações elétricas e infra de ar-condicionado", stage: "Preparação", plannedStart: "05/08", plannedEnd: "14/08", actualStart: "06/08", actualEnd: "15/08", status: "Concluído" },
  { number: "03", name: "Bancadas, cubas e luminárias", stage: "Instalações", plannedStart: "13/08", plannedEnd: "18/08", actualStart: "14/08", actualEnd: "18/08", status: "Concluído" },
  { number: "04", name: "Backsplash, nivelamento e piso vinílico", stage: "Instalações", plannedStart: "17/08", plannedEnd: "24/08", actualStart: "18/08", actualEnd: "25/08", status: "Concluído" },
  { number: "05", name: "Medição de marcenaria, produção das peças e box/espelhos", stage: "Instalações", plannedStart: "21/08", plannedEnd: "31/08", actualStart: "21/08", actualEnd: "02/09", status: "Concluído" },
  { number: "06", name: "Fechamento de shaft do ar-condicionado, drywall e metais", stage: "Instalações", plannedStart: "28/08", plannedEnd: "04/09", actualStart: "29/08", actualEnd: "05/09", status: "Concluído" },
  { number: "07", name: "Ar-condicionado e primeira demão de pintura", stage: "Instalações", plannedStart: "05/09", plannedEnd: "12/09", actualStart: "06/09", actualEnd: "13/09", status: "Concluído" },
  { number: "08", name: "Marcenaria", stage: "Marcenaria", plannedStart: "15/09", plannedEnd: "25/09", actualStart: "16/09", actualEnd: "–", status: "Em andamento" },
  { number: "09", name: "Ajustes de marcenaria, rodapé e acabamentos de civil", stage: "Marcenaria", plannedStart: "24/09", plannedEnd: "30/09", actualStart: "–", actualEnd: "–", status: "Pendente" },
  { number: "10", name: "Segunda demão de pintura, acabamentos elétricos e acessórios", stage: "Acabamento", plannedStart: "29/09", plannedEnd: "04/10", actualStart: "–", actualEnd: "–", status: "Pendente" },
  { number: "11", name: "Cortinas, eletros e móveis", stage: "Acabamento", plannedStart: "03/10", plannedEnd: "07/10", actualStart: "–", actualEnd: "–", status: "Pendente" },
  { number: "12", name: "Vistoria Bwild, limpeza fina e vistoria cliente", stage: "Entrega", plannedStart: "08/10", plannedEnd: "10/10", actualStart: "–", actualEnd: "–", status: "Pendente" },
];

const planned = [0, 2, 5, 8, 12, 16, 21, 27, 33, 39, 45, 50, 55, 61, 67, 73, 79, 84, 89, 93, 96, 98, 100];
const actual = [0, 1, 4, 7, 11, 15, 19, 25, 31, 37, 42, 47, 52];

export const curveData = planned.map((value, index) => {
  const date = new Date(2026, 7, 4 + index * 3);
  return {
    date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    previsto: value,
    realizado: actual[index],
  };
});

export const reportPhotos = [
  { src: "/videos/time-obra-poster.jpg", caption: "Marcenaria · instalação", alt: "Instalação de marcenaria durante a obra" },
  { src: "/videos/arquiteta-medicao-poster.jpg", caption: "Medição técnica", alt: "Medição técnica realizada pela equipe Bewild" },
  { src: studioZipAntes.url, caption: "Antes da obra", alt: "Apartamento antes do início da obra" },
] as const;

export const reports = [
  { week: 6, dates: "15 set - 19 set", stage: "Instalação de marcenaria", progress: 52, planned: 55, current: true },
  { week: 5, dates: "08 set - 12 set", stage: "Instalações e pintura", progress: 45, planned: 47, current: false },
  { week: 4, dates: "01 set - 05 set", stage: "Drywall e metais", progress: 36, planned: 38, current: false },
  { week: 3, dates: "25 ago - 29 ago", stage: "Piso e marcenaria", progress: 28, planned: 29, current: false },
  { week: 2, dates: "18 ago - 22 ago", stage: "Instalações", progress: 18, planned: 18, current: false },
  { week: 1, dates: "11 ago - 15 ago", stage: "Preparação", progress: 9, planned: 10, current: false },
] as const;