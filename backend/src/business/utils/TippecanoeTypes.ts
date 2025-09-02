/**
 * Tippecanoe options based on the official documentation
 * @see https://github.com/felt/tippecanoe
 */
export interface TippecanoeOptions {
  /** Minimum zoom level (default: 0) */
  minZoom?: number;
  /** Maximum zoom level (default: 14) */
  maxZoom?: number;
  /** Base zoom level (default: 14) */
  baseZoom?: number;
  /** Drop rate (default: 2) */
  dropRate?: number;
  /** Buffer size in pixels (default: 5) */
  buffer?: number;
  /** Simplification tolerance in pixels (default: 0) */
  tolerance?: number;
  /** Layer name for the output tiles */
  layer?: string;
  /** Read input as newline-delimited GeoJSON */
  newlineDelimited?: boolean;
  /** Drop densest features as needed when tiles become too large */
  dropDensestAsNeeded?: boolean;
  /** Extend zoom levels if features are still being dropped */
  extendZoomsIfStillDropping?: boolean;
  /** Additional tippecanoe arguments as key-value pairs */
  additionalArgs?: Record<string, string | number | boolean>;
}

export interface TippecanoeResult {
  /** Path to the generated PMTiles file */
  outputPath: string;
  /** Symbol for automatic disposal */
  [Symbol.dispose](): void;
}
