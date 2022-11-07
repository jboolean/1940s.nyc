import { Entity, Column, PrimaryColumn } from 'typeorm';
import { Point } from 'geojson';
import LngLat from '../enum/LngLat';

/**
 * A materialized view summarizing a photo with its best geocode result.
 * Used for quickly generating geojson.
 * Materialized view is refreshed when scraping data.
 */
@Entity('photos_with_effective_geocode_view')
export default class EffectiveGeocode {
  @PrimaryColumn()
  identifier: string;

  // TODO
  // @Column()
  // collection: string;

  @Column()
  date?: string;

  @Column()
  borough?: string;

  @Column()
  block?: number;

  @Column()
  lot?: string;

  @Column()
  bldgNumberStart?: string;

  @Column()
  bldgNumberEnd?: string;

  @Column()
  sideOfStreet?: boolean;

  @Column()
  streetName?: string;

  @Column()
  address?: string;

  @PrimaryColumn()
  method: string;

  @Column({
    type: 'point',
    transformer: {
      from: ({ x, y }: { x: number; y: number }) => ({ lng: x, lat: y }),
      to: ({ lng, lat }: LngLat) => ({ x: lng, y: lat }),
    },
  })
  lngLat: LngLat | null;
}
