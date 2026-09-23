/**
 * Mapa de bairros do /guia-do-investidor (carregado sob demanda por
 * LazyMapaBairrosEmbed).
 *
 * Todos os números vêm da base única `src/guia/data/bairros.ts` (via
 * NEIGHBORHOODS): pinos, cards, ranking, comparador e polígonos mostram a
 * mesma diária, ocupação e receita da tabela e do simulador. O geojson dos
 * polígonos só fornece o desenho — suas propriedades numéricas são ignoradas.
 */
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "@/guia/components/ui/card";
import { Button } from "@/guia/components/ui/button";
import { Badge } from "@/guia/components/ui/badge";
import { Input } from "@/guia/components/ui/input";
import { Switch } from "@/guia/components/ui/switch";

import type * as GeoJSON from "geojson";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  MapPin, Calendar, TrendingUp,
  Flame, ArrowUpDown, CircleDot, Layers, SearchX, MapPinOff,
} from "lucide-react";
import {
  type Neighborhood, type CityEvent, NEIGHBORHOODS, EVENTS,
  DEMAND_FILTERS, EVENT_ICONS, IMPACT_STYLES, TAG_ICONS, scoreColor, fmt,
  POI_CATEGORIES, type POICategoryKey,
} from "@/guia/data/mapaBairrosData";
import { BAIRROS, ROI_AVISO, diariaMediaDe, receitaMensalDe } from "@/guia/data/bairros";
import {
  eventosFuturos, filtrarBairros, juntarPoligonos, limitesDoMapa,
  type FiltroDemanda, type PropriedadesPoligono,
} from "@/guia/lib/mapa";
import { fmtIntervaloDatas, fmtPct, hojeISO } from "@/guia/lib/format";
import { pressionavel } from "@/guia/lib/a11y";
import ROIRanking from "@/guia/components/mapa/ROIRanking";
import NeighborhoodComparison from "@/guia/components/mapa/NeighborhoodComparison";
import ReactMap, { Marker, Popup, NavigationControl, Source, Layer, MapRef } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent, GeoJSONSource, ExpressionSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ─── Configuração ─── */

/**
 * Chave pública do MapTiler (restrita por domínio no painel do MapTiler).
 * Configure VITE_MAPTILER_KEY no ambiente; o valor abaixo é o fallback atual.
 */
const MAPTILER_KEY = (import.meta.env.VITE_MAPTILER_KEY as string | undefined) || "AI17dHeoeJx6rUC1KlSL";
const MAP_STYLE = `https://api.maptiler.com/maps/019cc06d-fb8e-741d-b158-a17a30e87c08/style.json?key=${MAPTILER_KEY}`;

/** Limites calculados a partir dos centros de TODOS os bairros (Itaquera incluída). */
const MAP_BOUNDS = limitesDoMapa(BAIRROS.map((b) => b.centro), 0.08);

const BAIRRO_POR_ID = new Map(BAIRROS.map((b) => [b.id, b]));
const NEIGHBORHOOD_POR_ID = new Map(NEIGHBORHOODS.map((n) => [n.id, n]));

const POI_COLOR_EXPR = [
  "match",
  ["get", "category"],
  ...POI_CATEGORIES.flatMap((c) => [c.key, c.color]),
  "#888",
] as unknown as ExpressionSpecification;

const SCORE_FILL_EXPR = [
  "case",
  [">=", ["get", "score"], 88], "rgba(34,197,94,0.25)",
  [">=", ["get", "score"], 84], "rgba(245,158,11,0.2)",
  "rgba(156,163,175,0.15)",
] as unknown as ExpressionSpecification;

const SCORE_LINE_EXPR = [
  "case",
  [">=", ["get", "score"], 88], "rgba(34,197,94,0.6)",
  [">=", ["get", "score"], 84], "rgba(245,158,11,0.5)",
  "rgba(156,163,175,0.3)",
] as unknown as ExpressionSpecification;

/* ─── Neighborhood Card ─── */
function NeighborhoodCard({ n, isSelected, isHighlighted, onClick, index = 0 }: { n: Neighborhood; isSelected: boolean; isHighlighted: boolean; onClick: () => void; index?: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.92, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.88, filter: "blur(4px)" }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        {...pressionavel(onClick)}
        aria-pressed={isSelected}
        aria-label={`${n.name}: score ${n.score}, diária média R$ ${fmt(n.metrics.nightlyRate)}, ocupação ${fmtPct(n.metrics.occupancy)}`}
        className={`cursor-pointer transition-all duration-300 overflow-hidden relative group ${
          isSelected ? "ring-2 ring-primary border-primary shadow-lg shadow-primary/10" : isHighlighted ? "ring-2 ring-amber-400 border-amber-400 shadow-md shadow-amber-400/10" : "border-border hover:shadow-lg hover:border-primary/30"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-bold text-foreground">{n.name}</h3>
            <div className="flex items-center gap-1.5">
              <motion.div
                className={`w-2.5 h-2.5 rounded-full ${scoreColor(n.score)}`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
              <span className="text-xs font-bold font-mono text-foreground">{n.score}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-body mb-1.5">
            <span>R$ {fmt(n.metrics.nightlyRate)}/noite</span>
            <span>{fmtPct(n.metrics.occupancy)} ocup.</span>
            <span className="text-emerald-700 font-semibold">{fmtPct(n.metrics.estimatedROI)} ROI est.*</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-body mb-2.5">
            ~{fmt(n.metrics.activeListings)} studios no Airbnb · R$ {fmt(n.metrics.nightlyRateRange[0])}–{fmt(n.metrics.nightlyRateRange[1])}/noite · R$ {fmt(n.metrics.avgRevenueMo)}/mês
          </p>
          <div className="flex flex-wrap gap-1">
            {n.tags.slice(0, 4).map((tag) => {
              const Icon = TAG_ICONS[tag] || MapPin;
              return (
                <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon size={8} aria-hidden="true" />{tag}
                </span>
              );
            })}
            {n.tags.length > 4 && <span className="text-[10px] text-muted-foreground">+{n.tags.length - 4}</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

type HoverPoligono = { bairroId: string; poligonoNome: string; lng: number; lat: number };

/* ─── Interactive Map ─── */
function InteractiveMap({
  neighborhoods, showHeatmap, showClusters, showPOIs, selected, highlightedNames, onSelect,
}: {
  neighborhoods: Neighborhood[]; showHeatmap: boolean; showClusters: boolean;
  showPOIs: POICategoryKey[];
  selected: Neighborhood | null; highlightedNames: string[]; onSelect: (n: Neighborhood) => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const loadedRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const [mapError, setMapError] = useState(false);
  const [hoveredN, setHoveredN] = useState<Neighborhood | null>(null);
  const [hoveredPoly, setHoveredPoly] = useState<HoverPoligono | null>(null);
  const [poisGeoJSON, setPoisGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [polygons, setPolygons] = useState<GeoJSON.FeatureCollection<GeoJSON.Geometry, PropriedadesPoligono> | null>(null);
  const [hoveredPOI, setHoveredPOI] = useState<{ name: string; category: string; neighborhood: string; lng: number; lat: number } | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/geo/pois.geojson", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((geojson: GeoJSON.FeatureCollection) => setPoisGeoJSON(geojson))
      .catch(() => { /* camada opcional: sem POIs o mapa continua útil */ });
    // Polígonos: só o desenho vem do arquivo; os dados vêm da base única.
    fetch("/geo/neighborhoods.geojson", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((geojson: GeoJSON.FeatureCollection) => setPolygons(juntarPoligonos(geojson)))
      .catch(() => { /* camada opcional: os pinos continuam mostrando os bairros */ });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!mapRef.current || !selected) return;
    mapRef.current.flyTo({ center: [selected.centerLng, selected.centerLat], zoom: 14, duration: reduceMotion ? 0 : 800 });
  }, [selected, reduceMotion]);

  const setCursor = (cursor: string) => {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = cursor;
  };

  const onPolygonHover = useCallback((e: MapLayerMouseEvent) => {
    const p = e.features?.[0]?.properties as Partial<PropriedadesPoligono> | undefined;
    if (!p?.bairroId) return;
    setHoveredPoly({ bairroId: p.bairroId, poligonoNome: p.poligonoNome ?? "", lng: e.lngLat.lng, lat: e.lngLat.lat });
    setCursor("pointer");
  }, []);

  const onPolygonClick = useCallback((e: MapLayerMouseEvent) => {
    const bairroId = (e.features?.[0]?.properties as Partial<PropriedadesPoligono> | undefined)?.bairroId;
    const n = bairroId ? NEIGHBORHOOD_POR_ID.get(bairroId) : undefined;
    if (n) onSelect(n);
  }, [onSelect]);

  const onClusterClick = useCallback((e: MapLayerMouseEvent, sourceId: string, maxZoom = 17) => {
    const map = mapRef.current;
    const feature = e.features?.[0];
    if (!map || !feature) return;
    const clusterId = feature.properties?.cluster_id;
    const source = map.getSource(sourceId) as GeoJSONSource | undefined;
    if (!source || clusterId == null) return;
    source.getClusterExpansionZoom(clusterId).then((zoom) => {
      const geom = feature.geometry as GeoJSON.Point;
      mapRef.current?.easeTo({ center: geom.coordinates as [number, number], zoom: Math.min(zoom, maxZoom), duration: reduceMotion ? 0 : 500 });
    }).catch(() => { /* cluster sumiu entre o clique e a resposta */ });
  }, [reduceMotion]);

  const onPOIHover = useCallback((e: MapLayerMouseEvent) => {
    const p = e.features?.[0]?.properties;
    if (!p) return;
    setHoveredPOI({ name: p.name || "", category: p.category || "", neighborhood: p.neighborhood || "", lng: e.lngLat.lng, lat: e.lngLat.lat });
    setCursor("pointer");
  }, []);

  // Memoizado: um objeto novo a cada render faria o MapLibre reprocessar e
  // reagrupar os POIs a cada movimento do mouse.
  const filteredPOIs = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!poisGeoJSON || showPOIs.length === 0) return null;
    return {
      type: "FeatureCollection",
      features: poisGeoJSON.features.filter((f) =>
        showPOIs.includes((f.properties as { category?: string } | null)?.category as POICategoryKey),
      ),
    };
  }, [poisGeoJSON, showPOIs]);

  const hoveredPolyData = hoveredPoly ? BAIRRO_POR_ID.get(hoveredPoly.bairroId) : undefined;
  const hoveredPolyNeighborhood = hoveredPoly ? NEIGHBORHOOD_POR_ID.get(hoveredPoly.bairroId) : undefined;

  return (
    <motion.div
      className="relative w-full aspect-square md:aspect-[4/3] rounded-xl border border-border overflow-hidden min-h-[320px]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <ReactMap
        ref={mapRef}
        initialViewState={{ longitude: -46.6333, latitude: -23.5505, zoom: 11 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        minZoom={10} maxZoom={17} maxBounds={MAP_BOUNDS}
        interactiveLayerIds={["neighborhood-fill", "cluster-circles", "poi-unclustered", "poi-clusters"]}
        onLoad={() => { loadedRef.current = true; setMapError(false); }}
        onError={(e) => {
          // Falha de tile isolada não derruba o mapa; falha antes do primeiro
          // "load" (estilo, chave, rede) deixa a área em branco — avisa.
          if (import.meta.env.DEV) console.warn("[mapa de bairros]", e.error);
          if (!loadedRef.current) setMapError(true);
        }}
        onMouseMove={(e) => {
          const polyFeatures = e.features?.filter((f) => f.layer?.id === "neighborhood-fill");
          const poiFeatures = e.features?.filter((f) => f.layer?.id === "poi-unclustered");
          if (polyFeatures?.length) onPolygonHover({ ...e, features: polyFeatures } as MapLayerMouseEvent);
          else setHoveredPoly(null);
          if (poiFeatures?.length) onPOIHover({ ...e, features: poiFeatures } as MapLayerMouseEvent);
          else setHoveredPOI(null);
          if (!polyFeatures?.length && !poiFeatures?.length) setCursor("");
        }}
        onMouseLeave={() => { setHoveredPoly(null); setHoveredPOI(null); setCursor(""); }}
        onClick={(e) => {
          const polyFeatures = e.features?.filter((f) => f.layer?.id === "neighborhood-fill");
          const clusterFeatures = e.features?.filter((f) => f.layer?.id === "cluster-circles");
          const poiClusterFeatures = e.features?.filter((f) => f.layer?.id === "poi-clusters");
          if (polyFeatures?.length) onPolygonClick({ ...e, features: polyFeatures } as MapLayerMouseEvent);
          if (clusterFeatures?.length) onClusterClick({ ...e, features: clusterFeatures } as MapLayerMouseEvent, "clusters-source");
          if (poiClusterFeatures?.length) onClusterClick({ ...e, features: poiClusterFeatures } as MapLayerMouseEvent, "pois-clustered", 16);
        }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Neighborhood polygons — desenho do geojson, dados da base única */}
        {polygons && (
          <Source id="neighborhoods-source" type="geojson" data={polygons}>
            <Layer id="neighborhood-fill" type="fill" paint={{
              "fill-color": SCORE_FILL_EXPR,
              "fill-opacity": showHeatmap ? 0.12 : 0.3,
            }} />
            <Layer id="neighborhood-outline" type="line" paint={{
              "line-color": SCORE_LINE_EXPR,
              "line-width": 2,
            }} />
          </Source>
        )}

        {/* Neighborhood pins — botões de verdade (foco + Enter/Espaço) */}
        {neighborhoods.map((n) => {
          const isSel = selected?.id === n.id;
          const isHigh = highlightedNames.includes(n.name);
          const bgClass = isSel ? "bg-primary" : isHigh ? "bg-amber-400" : n.score >= 88 ? "bg-green-600" : n.score >= 84 ? "bg-amber-600" : "bg-gray-500";
          return (
            <Marker key={n.id} longitude={n.centerLng} latitude={n.centerLat} anchor="center">
              <button
                type="button"
                onClick={() => onSelect(n)}
                onMouseEnter={() => setHoveredN(n)}
                onMouseLeave={() => setHoveredN(null)}
                onFocus={() => setHoveredN(n)}
                onBlur={() => setHoveredN(null)}
                aria-pressed={isSel}
                aria-label={`${n.name}, score ${n.score}. Selecionar bairro`}
                className={`${bgClass} text-white rounded-full px-2 py-1 text-xs font-bold cursor-pointer transition-transform duration-200 hover:scale-[1.4] focus-visible:scale-[1.4] shadow-md ${isSel ? "ring-2 ring-primary/50 scale-110" : ""}`}
              >
                {n.score}
              </button>
            </Marker>
          );
        })}

        {hoveredN && (
          <Popup longitude={hoveredN.centerLng} latitude={hoveredN.centerLat} offset={16} closeButton={false} closeOnClick={false} anchor="bottom">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-[12px] font-bold">{hoveredN.name}</div>
              <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${hoveredN.score >= 88 ? "bg-emerald-600" : hoveredN.score >= 84 ? "bg-amber-600" : "bg-gray-500"}`}>
                Score {hoveredN.score}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">R$ {fmt(hoveredN.metrics.nightlyRate)}/noite · {fmtPct(hoveredN.metrics.occupancy)} ocup.</div>
            <div className="text-[10px] text-muted-foreground">ROI est.* {fmtPct(hoveredN.metrics.estimatedROI)} · ~{fmt(hoveredN.metrics.activeListings)} studios</div>
            <div className="text-[9px] text-muted-foreground/70 mt-1">Clique para selecionar · *estimativa</div>
          </Popup>
        )}

        {hoveredPoly && hoveredPolyData && !hoveredN && (
          <Popup longitude={hoveredPoly.lng} latitude={hoveredPoly.lat} offset={8} closeButton={false} closeOnClick={false} anchor="bottom">
            <div className="text-[11px] font-bold">{hoveredPolyData.nome}</div>
            {hoveredPoly.poligonoNome && hoveredPoly.poligonoNome !== hoveredPolyData.nome && (
              <div className="text-[9px] text-muted-foreground">Região: {hoveredPoly.poligonoNome}</div>
            )}
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground mt-1">
              <span>Diária média</span><span className="font-semibold text-foreground">R$ {fmt(diariaMediaDe(hoveredPolyData.mercado))}</span>
              <span>Ocupação</span><span className="font-semibold text-foreground">{fmtPct(hoveredPolyData.mercado.ocupacao)}</span>
              <span>Receita/mês</span><span className="font-semibold text-foreground">R$ {fmt(receitaMensalDe(hoveredPolyData.mercado))}</span>
              {hoveredPolyNeighborhood && (
                <><span>ROI est.*</span><span className="font-semibold text-foreground">{fmtPct(hoveredPolyNeighborhood.metrics.estimatedROI)}</span></>
              )}
            </div>
            {hoveredPolyNeighborhood && <div className="text-[9px] text-muted-foreground/70 mt-1">*estimativa ilustrativa</div>}
          </Popup>
        )}

        {/* Heatmap */}
        {showHeatmap && (
          <Source id="heatmap-source" type="geojson" data="/geo/heatmap-points.geojson">
            <Layer id="heatmap-layer" type="heatmap" paint={{
              "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 50, 0, 100, 1],
              "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 15, 2],
              "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 20, 15, 40],
              "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.2, "rgba(103,169,207,0.4)", 0.4, "rgba(209,229,143,0.5)", 0.6, "rgba(253,219,49,0.6)", 0.8, "rgba(244,109,67,0.7)", 1, "rgba(215,48,39,0.8)"],
              "heatmap-opacity": 0.7,
            }} />
          </Source>
        )}

        {/* Clusters */}
        {showClusters && (
          <Source id="clusters-source" type="geojson" data="/geo/clusters.geojson" cluster clusterMaxZoom={14} clusterRadius={50}>
            <Layer id="cluster-circles" type="circle" filter={["has", "point_count"]} paint={{
              "circle-color": ["step", ["get", "point_count"], "rgba(34,197,94,0.7)", 5, "rgba(245,158,11,0.7)", 15, "rgba(239,68,68,0.7)"],
              "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 32], "circle-stroke-width": 2, "circle-stroke-color": "#fff",
            }} />
            <Layer id="cluster-count" type="symbol" filter={["has", "point_count"]} layout={{ "text-field": "{point_count_abbreviated}", "text-size": 12 }} paint={{ "text-color": "#fff" }} />
            <Layer id="unclustered-point" type="circle" filter={["!", ["has", "point_count"]]} paint={{ "circle-color": "rgba(34,197,94,0.6)", "circle-radius": 5, "circle-stroke-width": 1, "circle-stroke-color": "#fff" }} />
          </Source>
        )}

        {/* POIs as clustered native layers for performance */}
        {filteredPOIs && (
          <Source id="pois-clustered" type="geojson" data={filteredPOIs} cluster={true} clusterRadius={40} clusterMaxZoom={14}>
            <Layer id="poi-clusters" type="circle" filter={["has", "point_count"]} paint={{
              "circle-color": "#1e3a5f",
              "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 10, 26],
              "circle-opacity": 0.85,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            }} />
            <Layer id="poi-cluster-count" type="symbol" filter={["has", "point_count"]} layout={{
              "text-field": "{point_count_abbreviated}",
              "text-size": 11,
            }} paint={{ "text-color": "#fff" }} />
            <Layer id="poi-unclustered" type="circle" filter={["!", ["has", "point_count"]]} paint={{
              "circle-color": POI_COLOR_EXPR,
              "circle-radius": 6,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
              "circle-opacity": 0.9,
            }} />
          </Source>
        )}

        {hoveredPOI && (
          <Popup
            longitude={hoveredPOI.lng}
            latitude={hoveredPOI.lat}
            offset={14}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
          >
            <div className="text-[11px] leading-tight">
              <p className="font-bold text-foreground">{hoveredPOI.name}</p>
              <p className="text-muted-foreground mt-0.5">
                {POI_CATEGORIES.find(c => c.key === hoveredPOI.category)?.label ?? hoveredPOI.category}
                {" · "}{hoveredPOI.neighborhood}
              </p>
            </div>
          </Popup>
        )}
      </ReactMap>

      {mapError && (
        <div role="alert" className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-muted/95 p-6 text-center">
          <MapPinOff size={28} className="text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-semibold text-foreground font-body">O mapa não carregou.</p>
          <p className="text-xs text-muted-foreground font-body max-w-xs">
            Os números de cada bairro continuam no ranking, nos cards e na tabela desta seção.
          </p>
        </div>
      )}

      {/* Legend */}
      <motion.div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-md border border-border rounded-xl px-4 py-3 z-10 shadow-lg"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <p className="text-[11px] font-semibold text-foreground font-display mb-2">Score de Rentabilidade</p>
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-xs text-foreground/80 font-body">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span className="font-medium">Alto</span>
            <span className="text-muted-foreground">(score ≥ 88)</span>
          </span>
          <span className="flex items-center gap-2 text-xs text-foreground/80 font-body">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
            <span className="font-medium">Médio</span>
            <span className="text-muted-foreground">(score 84–87)</span>
          </span>
          <span className="flex items-center gap-2 text-xs text-foreground/80 font-body">
            <span className="w-3 h-3 rounded-full bg-gray-400 ring-2 ring-gray-400/20" />
            <span className="font-medium">Baixo</span>
            <span className="text-muted-foreground">(score &lt; 84)</span>
          </span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-2 font-body">Clique nos pinos (ou use Tab e Enter) para selecionar</p>
        {showPOIs.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-[11px] font-semibold text-foreground font-display mb-1.5">Pontos de Interesse</p>
            <div className="flex flex-col gap-1">
              {POI_CATEGORIES.filter((c) => showPOIs.includes(c.key)).map((c) => (
                <span key={c.key} className="flex items-center gap-2 text-xs font-body">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color, boxShadow: `0 0 0 2px ${c.color}33` }} />
                  <span className="text-foreground/80">{c.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Events Timeline ─── */
function EventsTimeline({ events, onEventClick, activeEventId }: { events: CityEvent[]; onEventClick: (e: CityEvent) => void; activeEventId: number | null }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-body rounded-lg border border-dashed border-border p-4">
        Nenhum evento futuro no calendário deste guia. Consulte a agenda oficial da cidade para planejar datas de pico.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {events.map((event, i) => {
        const Icon = EVENT_ICONS[event.category as keyof typeof EVENT_ICONS] || Calendar;
        const style = IMPACT_STYLES[event.impactLevel] || IMPACT_STYLES.low;
        const isActive = activeEventId === event.id;
        return (
          <motion.div key={event.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Card
              {...pressionavel(() => onEventClick(event))}
              aria-pressed={isActive}
              aria-label={`${event.name}, ${fmtIntervaloDatas(event.startDate, event.endDate)}. Destacar bairros impactados no mapa`}
              className={`cursor-pointer transition-all duration-200 ${isActive ? "ring-2 ring-primary border-primary shadow-md" : "border-border hover:shadow-md hover:border-primary/30"}`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg ${style.bg}`}><Icon size={14} className={style.text} aria-hidden="true" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-xs font-bold font-display text-foreground truncate">{event.name}</h4>
                      <Badge className={`text-[9px] px-1 py-0 ${style.bg} ${style.text} border-0`}>{style.label}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body">
                      <time dateTime={event.startDate}>{fmtIntervaloDatas(event.startDate, event.endDate)}</time>
                    </p>
                    <p className="text-[10px] text-muted-foreground font-body mt-0.5 line-clamp-2">{event.location}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {event.nearbyNeighborhoods.slice(0, 3).map((name) => (
                        <span key={name} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{name}</span>
                      ))}
                      {event.nearbyNeighborhoods.length > 3 && <span className="text-[9px] text-muted-foreground">+{event.nearbyNeighborhoods.length - 3}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ─── */
export default function MapaBairrosEmbed() {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [activeFilters, setActiveFilters] = useState<FiltroDemanda[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [activePOIs, setActivePOIs] = useState<POICategoryKey[]>([]);
  const [activeEvent, setActiveEvent] = useState<CityEvent | null>(null);
  const [search, setSearch] = useState("");
  const [showComparison, setShowComparison] = useState(false);

  // Calculado uma vez por montagem: a lista de eventos é estática.
  const upcomingEvents = useMemo(() => eventosFuturos(EVENTS, hojeISO()), []);

  const togglePOI = useCallback((key: POICategoryKey) => {
    setActivePOIs((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }, []);

  const toggleFilter = useCallback((filterId: FiltroDemanda) => {
    setActiveFilters((prev) => prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    setSearch("");
  }, []);

  const handleEventClick = useCallback((event: CityEvent) => {
    setActiveEvent((prev) => prev?.id === event.id ? null : event);
  }, []);

  const handleSelect = useCallback((n: Neighborhood) => {
    setSelectedNeighborhood(n);
  }, []);

  const highlightedNames = useMemo(() => activeEvent?.nearbyNeighborhoods || [], [activeEvent]);

  const filtered = useMemo(
    () => filtrarBairros(NEIGHBORHOODS, { busca: search, filtros: activeFilters }),
    [search, activeFilters],
  );

  const hasQuery = search.trim() !== "" || activeFilters.length > 0;

  const emptyState = (
    <div role="status" className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
      <SearchX size={22} className="text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-semibold text-foreground font-body">Nenhum bairro com esse perfil ou nome.</p>
      <p className="text-xs text-muted-foreground font-body">Tente outro filtro ou limpe a busca.</p>
      <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="mt-1 text-xs font-body">
        Limpar filtros
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" aria-label="Buscar bairro" placeholder="Buscar bairro..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 font-body" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" aria-expanded={showComparison} onClick={() => setShowComparison((v) => !v)} className="font-body text-xs">
              <ArrowUpDown size={14} className="mr-1.5" aria-hidden="true" />Comparar
            </Button>
          </div>
        </div>

        {/* Demand filters */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por perfil de demanda">
          {DEMAND_FILTERS.map((f) => {
            const active = activeFilters.includes(f.key);
            const Icon = f.icon;
            return (
              <button key={f.key} type="button" aria-pressed={active} onClick={() => toggleFilter(f.key)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                }`}>
                <Icon size={12} aria-hidden="true" />{f.label}
              </button>
            );
          })}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
              <Flame size={12} aria-hidden="true" /><label htmlFor="mapa-toggle-heatmap">Heatmap</label>
              <Switch id="mapa-toggle-heatmap" checked={showHeatmap} onCheckedChange={setShowHeatmap} className="scale-75" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
              <CircleDot size={12} aria-hidden="true" /><label htmlFor="mapa-toggle-clusters">Clusters</label>
              <Switch id="mapa-toggle-clusters" checked={showClusters} onCheckedChange={setShowClusters} className="scale-75" />
            </div>
          </div>
        </div>

        {/* POI filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin" role="group" aria-label="Pontos de interesse no mapa">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Layers size={12} aria-hidden="true" /> Pontos de interesse:
          </span>
          {POI_CATEGORIES.map((cat) => {
            const active = activePOIs.includes(cat.key);
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                type="button"
                aria-pressed={active}
                onClick={() => togglePOI(cat.key)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all whitespace-nowrap flex-shrink-0 ${
                  active
                    ? "border-primary/50 shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                }`}
                style={active ? { backgroundColor: `${cat.color}18`, color: cat.color, borderColor: `${cat.color}60` } : undefined}
              >
                <Icon size={12} aria-hidden="true" />{cat.label}
              </button>
            );
          })}
          {activePOIs.length > 0 && (
            <button type="button" onClick={() => setActivePOIs([])} className="text-xs text-muted-foreground hover:text-foreground underline ml-1 flex-shrink-0">
              Limpar POIs
            </button>
          )}
        </div>

        {/* POI legend when active */}
        {activePOIs.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-muted-foreground font-body">
            📍 Mostrando {activePOIs.length} categoria{activePOIs.length > 1 ? "s" : ""} de pontos de interesse no mapa. Aproxime o mapa para ver os nomes.
          </div>
        )}

        {/* Filter explainer */}
        {activeFilters.length > 0 && (
          <p className="text-[10px] text-muted-foreground font-body mt-1 ml-1" aria-live="polite">
            🔍 Filtrando por perfil de demanda — {filtered.length} bairro{filtered.length !== 1 ? "s" : ""} com {activeFilters.length > 1 ? "algum dos perfis selecionados" : "esse perfil"}.
          </p>
        )}
      </div>

      {/* Comparison panel */}
      <AnimatePresence>
        {showComparison && (
          <div className="mb-8">
            <NeighborhoodComparison onClose={() => setShowComparison(false)} initialNeighborhoods={NEIGHBORHOODS.slice(0, 2)} />
          </div>
        )}
      </AnimatePresence>

      {/* Map + Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
        <div className="lg:col-span-2 order-1">
          <InteractiveMap
            neighborhoods={filtered}
            showHeatmap={showHeatmap}
            showClusters={showClusters}
            showPOIs={activePOIs}
            selected={selectedNeighborhood}
            highlightedNames={highlightedNames}
            onSelect={handleSelect}
          />
        </div>

        <div className="lg:col-span-1 order-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary" aria-hidden="true" />
            <h3 className="font-display text-sm font-bold text-foreground">Ranking de Bairros</h3>
          </div>
          {filtered.length === 0 && hasQuery ? emptyState : (
            <ROIRanking neighborhoods={filtered} onSelectNeighborhood={handleSelect} selectedName={selectedNeighborhood?.name} />
          )}
        </div>
      </div>

      {/* Neighborhood Grid */}
      <div className="mb-12">
        <h3 className="font-display text-xl font-bold text-foreground mb-1">Bairros analisados</h3>
        <p className="text-sm text-muted-foreground font-body mb-3" aria-live="polite">{filtered.length} bairro{filtered.length !== 1 ? "s" : ""}</p>
        {/* Card legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg bg-muted/30 border border-border/50 text-[11px] text-muted-foreground font-body">
          <span className="font-semibold text-foreground text-xs">Como ler os cards:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Score ≥ 88 (alto potencial)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Score 84–87 (moderado)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Score &lt; 84 (menor potencial)
          </span>
          <span className="hidden sm:inline text-muted-foreground/60">|</span>
          <span className="hidden sm:inline">Tags indicam perfil de demanda e amenidades da região</span>
          <span className="basis-full">* {ROI_AVISO}</span>
        </div>
        {filtered.length === 0 && hasQuery ? emptyState : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filtered.map((n, i) => (
                <NeighborhoodCard key={n.id} n={n} index={i} isSelected={selectedNeighborhood?.id === n.id}
                  isHighlighted={highlightedNames.includes(n.name)}
                  onClick={() => handleSelect(n)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Events */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={20} className="text-primary" aria-hidden="true" />
          <h3 className="font-display text-xl font-bold text-foreground">Eventos que aumentam a demanda</h3>
        </div>
        <p className="text-sm text-muted-foreground font-body mb-3">Próximos eventos. Clique em um evento para destacar os bairros impactados no mapa.</p>
        {/* Events impact legend */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] font-body">
          <span className="text-muted-foreground font-semibold">Nível de impacto:</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">🔴 Alta demanda — picos de até +40% nas reservas</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">🟡 Média demanda — aumento moderado</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-muted-foreground">⚪ Baixa demanda — impacto localizado</span>
        </div>
        <EventsTimeline events={upcomingEvents} onEventClick={handleEventClick} activeEventId={activeEvent?.id ?? null} />
      </div>
    </div>
  );
}
