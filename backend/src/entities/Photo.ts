import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import Collection from '../enum/Collection';
import EffectiveAddress from './EffectiveAddress';
import EffectiveGeocode from './EffectiveGeocode';
import GeocodeResult from './GeocodeResult';
import Story from './Story';

@Entity('photos')
export default class Photo {
  @PrimaryColumn()
  identifier: string;

  @Column()
  collection: Collection;

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

  @Column()
  isOuttake: boolean;

  @OneToMany(() => GeocodeResult, (geocode) => geocode.photo)
  geocodeResults: GeocodeResult[];

  @OneToOne(() => EffectiveGeocode, {
    eager: true,
  })
  @JoinColumn({ name: 'identifier' })
  effectiveGeocode?: EffectiveGeocode;

  @OneToOne(() => EffectiveAddress, {
    eager: true,
  })
  @JoinColumn({ name: 'identifier' })
  effectiveAddress: EffectiveAddress;

  @OneToMany(() => Story, (story) => story.photo)
  stories: Story[];
}
