import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import PointColumnOptions from '../business/utils/PointColumnOptions';
import GeocodeMethod from '../enum/GeocodeMethod';
import LngLat from '../enum/LngLat';
import Photo from './Photo';
import Story from './Story';

/**
 * A materialized view summarizing a photo with its best geocode result.
 * Used for quickly generating geojson.
 * Materialized view is refreshed when scraping data.
 */
@Entity('effective_geocodes_view')
export default class EffectiveGeocode {
  @PrimaryColumn()
  identifier: string;

  @Column()
  collection: string;

  @Column()
  method: GeocodeMethod;

  @Column(PointColumnOptions)
  lngLat: LngLat | null;

  @OneToOne(() => Photo, (photo) => photo.effectiveGeocode)
  @JoinColumn({ name: 'identifier' })
  photo: Photo;

  @OneToMany(() => Story, (story) => story.effectiveGeocode)
  stories: Story[];
}
