import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import LngLat from '../enum/LngLat';
import StoryState from '../enum/StoryState';
import StoryType from '../enum/StoryType';

@Entity('stories')
export default class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
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

  @Column({
    type: 'point',
    transformer: {
      from: ({ x, y }: { x: number; y: number }) => ({ lng: x, lat: y }),
      to: (lngLat: LngLat | null) =>
        lngLat ? `(${lngLat.lng}, ${lngLat.lat})` : null,
    },
  })
  lngLat: LngLat | null;

  @Column()
  photo: string;

  @Column()
  textContent?: string;

  @Column()
  recaptchaScore: number;
}
