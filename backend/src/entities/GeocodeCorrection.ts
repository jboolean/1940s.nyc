import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import PointColumnOptions from '../business/utils/PointColumnOptions';
import LngLat from '../enum/LngLat';

@Entity('geocode_corrections')
export default class GeocodeCorrection {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @Index()
  photo: string;

  @Column(PointColumnOptions)
  lngLat: LngLat | null;

  @Column({
    type: 'integer',
    name: 'user_id',
  })
  userId: number;
}
