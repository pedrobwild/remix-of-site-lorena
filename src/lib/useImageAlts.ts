/**
 * useImageAlts — textos alternativos (alt text) descritivos das imagens.
 *
 * As descrições ficam na tabela `image_alt_texts` (uma por URL de imagem),
 * geradas a partir da análise de cada foto (scripts/backfill-alt-text.mjs).
 * O componente pede as URLs que vai exibir e recebe um mapa url → alt.
 * Enquanto não carrega (ou se faltar descrição), o chamador usa o alt de
 * fallback baseado nos dados do projeto.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AltMap = Record<string, string>;

const CHUNK = 150;
const cache = new Map<string, string>();

async function fetchAlts(urls: string[]): Promise<AltMap> {
  const map: AltMap = {};
  const missing: string[] = [];
  for (const url of urls) {
    const hit = cache.get(url);
    if (hit) map[url] = hit;
    else missing.push(url);
  }
  for (let i = 0; i < missing.length; i += CHUNK) {
    const slice = missing.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("image_alt_texts")
      .select("url,alt")
      .in("url", slice);
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.url && row.alt) {
        cache.set(row.url, row.alt);
        map[row.url] = row.alt;
      }
    }
  }
  return map;
}

export function useImageAlts(urls: (string | null | undefined)[]): AltMap {
  const key = useMemo(
    () =>
      Array.from(
        new Set(urls.filter((u): u is string => typeof u === "string" && u.startsWith("http"))),
      )
        .sort()
        .join("|"),
    [urls],
  );
  const [alts, setAlts] = useState<AltMap>({});

  useEffect(() => {
    if (!key) {
      setAlts({});
      return;
    }
    let active = true;
    fetchAlts(key.split("|"))
      .then((map) => {
        if (active) setAlts(map);
      })
      .catch(() => {
        if (active) setAlts({});
      });
    return () => {
      active = false;
    };
  }, [key]);

  return alts;
}
