import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import PointColumnOptions from '../business/utils/PointColumnOptions';
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

  @Column(PointColumnOptions)
  lngLat: LngLat | null;
}
