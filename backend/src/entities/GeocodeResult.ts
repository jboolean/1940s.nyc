import { Point } from 'geojson';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

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
      from: ({ x, y }) => ({ coordinates: [x, y] }),
      to: (p: Point) => p,
    },
  })
  lngLat: Point | null;
}
