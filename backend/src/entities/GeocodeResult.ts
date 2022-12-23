import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import LngLat from '../enum/LngLat';

import Photo from './Photo';

@Entity('geocode_results')
export default class GeocodeResult {
  @PrimaryColumn({ name: 'photo' })
  photoId: string;

  @ManyToOne(() => Photo, (photo) => photo.geocodeResults)
  @JoinColumn({ name: 'photo' })
  photo: Photo;

  @PrimaryColumn()
  method: string;

  @Column({
    type: 'point',
    transformer: {
      from: (coords: { x: number; y: number } | null) =>
        coords ? { lng: coords.x, lat: coords.y } : null,
      to: ({ lng, lat }: LngLat) => `(${lng}, ${lat})`,
    },
  })
  lngLat: LngLat | null;
}
