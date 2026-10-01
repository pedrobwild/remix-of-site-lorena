/**
 * Worker do MapLibre (v6) empacotado pelo Vite.
 *
 * O MapLibre 6 procura o worker em `./maplibre-gl-worker.mjs` ao lado do
 * próprio módulo. Depois do build o módulo vira `assets/maplibre-gl-<hash>.js`
 * e esse arquivo não existe — o mapa do guia caía em "Worker failed to load"
 * e mostrava "O mapa não carregou". `?worker&url` faz o Vite gerar o worker
 * (com o chunk compartilhado embutido) e devolve a URL final dele.
 */
import { setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

setWorkerUrl(maplibreWorkerUrl);
