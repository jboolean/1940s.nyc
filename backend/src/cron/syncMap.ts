import GeojsonEncoder from '../business/geodata/GeojsonEncoder';
import * as TilesetService from '../business/geodata/TilesetService';

export default async function syncMap(): Promise<void> {
  const encoder = new GeojsonEncoder('newline-delimited-geojson');

  console.log('Beginning sync of map data...');

  const dataStream = await encoder.createGeojson('1940');

  console.log('Uploading tileset source...');
  await TilesetService.uploadTilesetSource(dataStream);
  console.log('Tileset source uploaded.');

  if (!(await TilesetService.tilesetExists())) {
    console.log('Tileset does not exist. Creating...');
    await TilesetService.createTileset();
  }

  console.log('Publishing tileset...');
  await TilesetService.publishTileset();

  const queueSize = await TilesetService.getGlobalQueueSize();
  console.log(`Mapbox global queue size: ${queueSize}`);

  console.log('Sync of map data complete.');
}
