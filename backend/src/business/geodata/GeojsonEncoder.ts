import { Feature } from 'geojson';
import gp from 'geojson-precision';
import JSONStream from 'jsonstream';
import { Transform } from 'stream';
import { getRepository } from 'typeorm';
import EffectiveGeocode from '../../entities/EffectiveGeocode';
import StoryState from '../../enum/StoryState';

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
  stories_storyteller_subtitle: string;
  stories_title: string;
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
      (
        await getRepository(EffectiveGeocode)
          .createQueryBuilder('record')
          // ensure only one result per photo (even if there are multiple stories)
          // This lets us use the photo identifier as a unique identifier for the feature.
          .distinctOn(['record.identifier'])
          .leftJoin('record.stories', 'stories', 'stories.state = :state', {
            state: StoryState.PUBLISHED,
          })
          .where({ collection })
          .orWhere('stories.id IS NOT NULL')
          .select([
            'record.identifier',
            'record.method',
            'record.lngLat',
            'stories.storytellerSubtitle',
            'stories.title',
          ])
          .stream()
      )
        .pipe(this.rowToFeatureTransform)
        .pipe(this.reducePrecisionTransform)
        .pipe(
          this.style === 'newline-delimited-geojson'
            ? JSONStream.stringify(false)
            : JSONStream.stringify()
        )
        .pipe(this.openCloseTransform)
    );
  }

  // Typeorm cannot stream real entity instances. It creates weird key names on an object.
  private rowToFeature = ({
    record_lng_lat: lngLat,
    record_identifier: photoIdentifier,
    stories_storyteller_subtitle,
    stories_title,
  }: RawEffectiveGeocode): Feature => {
    const storyLabel = stories_title || stories_storyteller_subtitle;
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lngLat.x, lngLat.y],
      },
      properties: storyLabel
        ? {
            photoIdentifier,
            storyLabel: storyLabel,
          }
        : {
            photoIdentifier,
          },
    };
  };

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
        }
        first = false;
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
