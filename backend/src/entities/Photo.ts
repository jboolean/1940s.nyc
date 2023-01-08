import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import GeocodeResult from './GeocodeResult';
import Story from './Story';

@Entity('photos')
export default class Photo {
  @PrimaryColumn()
  identifier: string;

  @Column()
  collection: string;

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

  @OneToMany(() => Story, (story) => story.photo)
  stories: Story[];
}
