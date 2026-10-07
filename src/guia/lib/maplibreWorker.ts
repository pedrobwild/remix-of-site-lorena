/**
 * URL do worker do MapLibre (v6), empacotado pelo Vite.
 *
 * O MapLibre 6 procura o worker em `./maplibre-gl-worker.mjs` ao lado do
 * próprio módulo. Depois do build o módulo vira `assets/maplibre-gl-<hash>.js`
 * e esse arquivo não existe — o mapa do guia caía em "Worker failed to load"
 * e mostrava "O mapa não carregou". `?worker&url` faz o Vite gerar o worker
 * (com o chunk compartilhado embutido) e devolve a URL final dele.
 *
 * A URL é EXPORTADA e chega ao MapLibre pela prop `workerUrl` do mapa (o
 * react-map-gl chama `setWorkerUrl` logo antes de criar o mapa). Não troque
 * por um `import "@/guia/lib/maplibreWorker"` só de efeito colateral: com
 * `"sideEffects": false` no package.json, o build de produção descarta esse
 * import — foi assim que a correção de 01/10/2026 funcionou no preview (dev,
 * sem tree-shaking) e o mapa continuou quebrado no site publicado.
 */
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

export const MAPLIBRE_WORKER_URL: string = maplibreWorkerUrl;
