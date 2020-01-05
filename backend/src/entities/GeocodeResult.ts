import { Entity, ManyToOne, PrimaryColumn, Column, JoinColumn } from 'typeorm';
import { Point } from 'geojson';

import Photo from './Photo';

@Entity('geocode_results')
export default class GeocodeResult {
  @ManyToOne(
    () => Photo,
    photo => photo.geocodeResults,
    {
      primary: true,
    }
  )
  @JoinColumn({ name: 'photo' })
  photo: Photo;

  @PrimaryColumn()
  method: string;

  @Column({ type: 'point' })
  lngLat: Point | null;
}
