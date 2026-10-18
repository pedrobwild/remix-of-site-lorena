/** Categorias fechadas: nunca enviar o texto livre do endereço ao Google. */
const BAIRROS = [
  "Alto da Boa Vista", "Avenida Paulista", "Barra Funda", "Bela Vista", "Brooklin",
  "Butantã", "Campo Belo", "Cerqueira César", "Chácara Klabin", "Cidade Jardim",
  "Consolação", "Higienópolis", "Ibirapuera", "Indianópolis", "Ipiranga",
  "Itaim Bibi", "Jardim Paulista", "Liberdade", "Moema", "Paraíso", "Perdizes",
  "Pinheiros", "República", "Santo Amaro", "Vila Buarque", "Vila Clementino",
  "Vila Madalena", "Vila Mariana", "Vila Nova Conceição", "Vila Olímpia",
] as const;

const FINALIDADES = ["Short stay", "Locação tradicional", "Uso misto", "Moradia", "Ainda avaliando"] as const;

function categoria(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim().replace(/\s+/g, "_");
}

export function googleAdsProfileVariables(input: {
  bairro?: string | null;
  objetivo?: string | null;
  areaM2?: number | null;
}): Record<string, string> {
  const out: Record<string, string> = {};
  const bairro = BAIRROS.find((known) => categoria(known) === categoria(input.bairro ?? ""));
  if (bairro) out.imovel_bairro = categoria(bairro);
  const finalidade = FINALIDADES.find((known) => categoria(known) === categoria(input.objetivo ?? ""));
  if (finalidade) out.imovel_finalidade = categoria(finalidade);
  const area = input.areaM2;
  if (typeof area === "number" && Number.isFinite(area) && area > 0) {
    out.imovel_faixa_m2 = area <= 35 ? "ate_35" : area <= 60 ? "36_60" : "acima_60";
  }
  return out;
}