import { Point } from 'geojson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import StoryState from './StoryState';
import StoryType from './StoryType';

@Entity('photos')
export default class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  createdAt: Date;

  @Column()
  storyType: StoryType;

  @Column()
  state: StoryState;

  @Column()
  storytellerEmail?: string;

  @Column()
  storytellerName?: string;

  @Column()
  storytellerSubtitle?: string;

  @Column({ type: 'point' })
  lngLat?: Point;

  @Column()
  photo: string;

  @Column()
  textContent?: string;
}
