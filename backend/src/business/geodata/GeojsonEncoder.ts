import { Feature } from 'geojson';
import gp from 'geojson-precision';
import JSONStream from 'JSONStream';
import { Transform } from 'stream';
import { getRepository } from 'typeorm';
import EffectiveGeocode from '../../entities/EffectiveGeocode';

const OPEN = `
{
  "type": "FeatureCollection",
  "features":\n`;

const CLOSE = `
}`;

type RawEffectiveGeocode = {
  record_identifier: string;
  record_method: string;
  record_lng_lat: { x: number; y: number };
};

export default class GeojsonEncoder {
  private readonly style: 'geojson' | 'newline-delimited-geojson';

  constructor(style: 'geojson' | 'newline-delimited-geojson' = 'geojson') {
    this.style = style;
  }

  public async createGeojson(
    collection = '1940'
  ): Promise<NodeJS.ReadableStream> {
    return (
      await getRepository(EffectiveGeocode)
        .createQueryBuilder('record')
        .where({ collection })
        .stream()
    )
      .pipe(this.rowToFeatureTransform)
      .pipe(this.reducePrecisionTransform)
      .pipe(
        this.style === 'newline-delimited-geojson'
          ? JSONStream.stringify(false)
          : JSONStream.stringify()
      )
      .pipe(this.openCloseTransform);
  }

  // Typeorm cannot stream real entity instances. It creates weird key names on an object.
  private rowToFeature = ({
    record_lng_lat: lngLat,
    record_identifier: photoIdentifier,
  }: RawEffectiveGeocode): Feature => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lngLat.x, lngLat.y],
    },
    properties: {
      photoIdentifier,
    },
  });

  private get rowToFeatureTransform(): Transform {
    const rowToFeature = this.rowToFeature;
    return new Transform({
      objectMode: true,

      transform(chunk, encoding, callback) {
        callback(undefined, rowToFeature(chunk as RawEffectiveGeocode));
      },
    });
  }

  private get reducePrecisionTransform(): Transform {
    return new Transform({
      objectMode: true,

      transform(chunk, encoding, callback) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        callback(undefined, gp(chunk, 5));
      },
    });
  }

  private get openCloseTransform(): Transform {
    const style = this.style;
    let first = true;
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        if (first && style === 'geojson') {
          this.push(OPEN);
          first = false;
        }
        callback(undefined, chunk);
      },
      flush(callback) {
        if (style === 'geojson') {
          this.push(CLOSE);
        }
        if (style === 'newline-delimited-geojson') {
          this.push('\n');
        }
        callback();
      },
    });
  }
}
