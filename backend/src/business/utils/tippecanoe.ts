import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { TippecanoeOptions, TippecanoeResult } from './TippecanoeTypes';

// Map of option names to their CLI argument names
const OPTION_MAP: Record<string, string> = {
  minZoom: '--minimum-zoom',
  maxZoom: '--maximum-zoom',
  baseZoom: '--base-zoom',
  dropRate: '--drop-rate',
  buffer: '--buffer',
  tolerance: '--tolerance',
  layer: '--layer',
  dropDensestAsNeeded: '--drop-densest-as-needed',
  extendZoomsIfStillDropping: '--extend-zooms-if-still-dropping',
};

/**
 * Process a GeoJSON stream into a PMTiles file using tippecanoe CLI
 *
 * Usage examples:
 *
 * 1. Basic usage with automatic cleanup (recommended):
 * ```typescript
 * await using result = await tippecanoe(geojsonStream);
 * // Use result.outputPath to access the PMTiles file
 * // File is automatically cleaned up when result goes out of scope
 * ```
 *
 * 2. Process with options:
 * ```typescript
 * await using result = await tippecanoe(geojsonStream, {
 *   minZoom: 0,
 *   maxZoom: 16
 * });
 * ```
 *
 * 3. Process newline-delimited GeoJSON:
 * ```typescript
 * await using result = await tippecanoe(geojsonStream, {
 *   newlineDelimited: true,
 *   minZoom: 5,
 *   maxZoom: 14
 * });
 * ```
 *
 * 4. Error handling with automatic cleanup:
 * ```typescript
 * try {
 *   await using result = await tippecanoe(geojsonStream);
 *   console.log('PMTiles generation completed successfully');
 *   // Cleanup happens automatically, even if an error is thrown
 * } catch (error) {
 *   console.error('Tippecanoe process error:', error);
 * }
 * ```
 *
 * @param inputStream - NodeJS.ReadableStream containing GeoJSON data
 * @param options - Tippecanoe configuration options
 * @returns Promise that resolves to result object with output path and automatic cleanup
 */
export default async function tippecanoe(
  inputStream: NodeJS.ReadableStream,
  options: TippecanoeOptions = {}
): Promise<TippecanoeResult> {
  const { newlineDelimited, additionalArgs = {} } = options;

  // Create temporary output file
  const outputPath = join(tmpdir(), `tippecanoe-${randomUUID()}.pmtiles`);

  // Build tippecanoe command arguments - only add if explicitly provided
  const args: string[] = ['--output', outputPath];

  // Add numeric options
  Object.entries(OPTION_MAP).forEach(([optionName, cliArg]) => {
    const value = options[optionName as keyof TippecanoeOptions];
    if (value !== undefined) {
      if (typeof value === 'boolean') {
        if (value) {
          args.push(cliArg);
        }
      } else {
        args.push(cliArg, value.toString());
      }
    }
  });

  if (newlineDelimited) {
    args.push('--newline-delimited');
  }

  // Add additional arguments with validation
  for (const [key, value] of Object.entries(additionalArgs)) {
    if (value === undefined || value === null) {
      continue; // Skip undefined/null values
    }

    if (typeof value === 'boolean') {
      if (value) {
        args.push(`--${key}`);
      }
    } else if (typeof value === 'string' || typeof value === 'number') {
      args.push(`--${key}`, value.toString());
    }
  }

  // Spawn tippecanoe process
  const tippecanoeProcess = spawn('tippecanoe', args, {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Set up progress monitoring (stderr is where tippecanoe writes progress)
  tippecanoeProcess.stderr?.on('data', (data: Buffer) => {
    // Forward tippecanoe's stderr to the parent process stderr
    process.stderr.write(data);
  });

  // Pipe input stream to tippecanoe stdin
  inputStream.pipe(tippecanoeProcess.stdin);

  // Handle process completion
  const processPromise = new Promise<void>((resolve, reject) => {
    tippecanoeProcess.on('error', (error) => {
      reject(new Error(`Tippecanoe process error: ${error.message}`));
    });

    tippecanoeProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tippecanoe exited with code ${code ?? 'unknown'}`));
      }
    });
  });

  // Wait for process to complete
  await processPromise;

  return {
    outputPath,
    [Symbol.dispose]() {
      // Automatic cleanup when using 'await using'
      unlink(outputPath).catch((error) => {
        console.warn(`Failed to cleanup temporary file ${outputPath}:`, error);
      });
    },
  };
}
