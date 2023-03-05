import GeojsonEncoder from '../business/GeojsonEncoder';

export default async function syncMap(): Promise<void> {
  const encoder = new GeojsonEncoder('geojson');

  (await encoder.createGeojson('1940')).pipe(process.stdout);
}
