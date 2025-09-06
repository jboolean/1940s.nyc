import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol as PmTilesProtocol } from 'pmtiles';

const pmtilesProtocol = new PmTilesProtocol();
maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile);
