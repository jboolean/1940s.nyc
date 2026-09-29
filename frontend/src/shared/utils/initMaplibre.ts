import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol as PmTilesProtocol } from 'pmtiles';

// maplibre-gl derives its worker URL from `import.meta.url`, which only works
// when the ESM build is served unbundled. Under webpack it resolves to a
// non-http value and maplibre falls back to an empty URL, which spawns a worker
// pointed at the current document and leaves every vector source unloadable.
// maplibre-gl-worker.mjs and its maplibre-gl-shared.mjs import are copied to the
// output root by CopyPlugin so the worker's relative import resolves.
maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs');

const pmtilesProtocol = new PmTilesProtocol();
maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile);
