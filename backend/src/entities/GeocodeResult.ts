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
      from: ({ x, y }: { x: number; y: number }) => ({ lng: x, lat: y }),
      to: ({ lng, lat }: LngLat) => `(${lng}, ${lat})`,
    },
  })
  lngLat: LngLat | null;
}
