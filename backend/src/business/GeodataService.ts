/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import JSONStream from 'JSONStream';
import { Transform } from 'stream';
import type stream from 'stream';
import gp from 'geojson-precision';
import EffectiveGeocode from '../entities/EffectiveGeocode';
import { getRepository } from 'typeorm';
import { Feature } from 'geojson';

const OPEN = `
{
  "type": "FeatureCollection",
  "features":\n`;

const CLOSE = `
}`;

type RawEffectiveGeocode = {
  record_identifier: string;
  record_date: string;
  record_borough: string;
  record_block: number;
  record_lot: string;
  record_bldg_number_start: string;
  record_bldg_number_end: string;
  record_side_of_street: boolean;
  record_street_name: string;
  record_address: string;
  record_method: string;
  record_lng_lat: { x: number; y: number };
};

// const pool = new Pool();

// Typeorm cannot stream real entity instances. It creates weird key names on an object.
const rowToFeature = ({
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

const rowToFeatureTransform = new Transform({
  objectMode: true,

  transform(chunk, encoding, callback) {
    callback(undefined, rowToFeature(chunk));
  },
});

const reducePrecisionTransform = new Transform({
  objectMode: true,

  transform(chunk, encoding, callback) {
    callback(undefined, gp(chunk, 5));
  },
});

const appendTransform = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    callback(undefined, chunk);
  },
  flush(callback) {
    this.push(CLOSE);
    callback();
  },
});

export async function createGeojson(outStream: stream.Writable): Promise<void> {
  const recordStream = await getRepository(EffectiveGeocode)
    .createQueryBuilder('record')
    .stream();

  outStream.write(OPEN);

  recordStream
    .pipe(rowToFeatureTransform)
    .pipe(reducePrecisionTransform)
    .pipe(JSONStream.stringify())
    .pipe(appendTransform)
    .pipe(outStream);
}
