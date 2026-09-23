import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, RefreshCw } from "lucide-react";

type Estado = "aguardando" | "carregando" | "pronto" | "erro";

/**
 * Carrega o mapa (MapLibre + dados, ~250 kB) só quando a seção se aproxima
 * da tela. Se o chunk falhar — tipicamente um deploy novo que apagou o
 * arquivo antigo enquanto a aba estava aberta —, mostra erro com "Tentar de
 * novo" em vez de girar para sempre.
 */
export default function LazyMapaBairrosEmbed() {
  const [estado, setEstado] = useState<Estado>("aguardando");
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || estado !== "aguardando") return;
    if (typeof IntersectionObserver === "undefined") {
      setEstado("carregando");
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEstado("carregando");
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [estado]);

  useEffect(() => {
    if (estado !== "carregando") return;
    let ativo = true;
    import("@/guia/components/mapa/MapaBairrosEmbed")
      .then((mod) => {
        if (!ativo) return;
        setComponent(() => mod.default);
        setEstado("pronto");
      })
      .catch((err: unknown) => {
        if (!ativo) return;
        if (import.meta.env.DEV) console.warn("[mapa de bairros] falha ao carregar o módulo do mapa", err);
        setEstado("erro");
      });
    return () => {
      ativo = false;
    };
  }, [estado, tentativa]);

  const tentarDeNovo = useCallback(() => {
    setTentativa((t) => t + 1);
    setEstado("carregando");
  }, []);

  if (estado === "pronto" && Component) return <Component />;

  if (estado === "erro") {
    return (
      <div role="alert" className="bg-muted rounded-xl h-[400px] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <MapPin size={32} className="text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground font-body">Não foi possível carregar o mapa.</p>
        <p className="text-xs text-muted-foreground font-body max-w-sm">
          Verifique a conexão. Se o site acabou de ser atualizado, recarregar a página resolve.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={tentarDeNovo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:border-primary/40 font-body"
          >
            <RefreshCw size={14} aria-hidden="true" /> Tentar de novo
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 font-body"
          >
            Recarregar a página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sentinelRef}
      className="bg-muted rounded-xl h-[400px] flex flex-col items-center justify-center gap-3"
      aria-busy={estado === "carregando"}
    >
      <MapPin size={32} className="text-muted-foreground/40" aria-hidden="true" />
      <p className="text-sm text-muted-foreground font-body" role="status">Carregando mapa...</p>
      {estado === "carregando" && (
        <div className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" aria-hidden="true" />
      )}
    </div>
  );
}
