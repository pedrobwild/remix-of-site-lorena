import { z } from "zod";

export const externalConnectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  provider: z.enum(["bwild_engine", "custom"]),
  website_url: z.string().url().max(500).refine(value => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash;
  }, "Informe um endereço HTTPS sem credenciais ou parâmetros."),
  api_key: z.string().trim().min(1).max(4096).refine(value => !/[\r\n]/.test(value), "Chave inválida."),
});

export type ExternalConnection = {
  id: string;
  name: string;
  provider: "bwild_engine" | "custom";
  website_url: string;
  updated_at: string;
};

export function connectionMetadata(row: ExternalConnection): ExternalConnection {
  return { id: row.id, name: row.name, provider: row.provider, website_url: row.website_url, updated_at: row.updated_at };
}